package repository

import (
	"context"
	"time"

	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	collectionMajors = "majors"
)

// MajorRepositoryService defines the interface for major data operations
type (
	MajorRepositoryService interface {
		Create(ctx context.Context, major *majorPb.Major) error
		GetByID(ctx context.Context, id primitive.ObjectID) (*majorPb.Major, error)
		GetBySchoolID(ctx context.Context, schoolID primitive.ObjectID) ([]*majorPb.Major, error)
		List(ctx context.Context, page, limit int64) ([]*majorPb.Major, int64, error)
		ListBySchool(ctx context.Context, schoolID primitive.ObjectID, page, limit int64) ([]*majorPb.Major, int64, error)
		Update(ctx context.Context, major *majorPb.Major) error
		Delete(ctx context.Context, id primitive.ObjectID) error
		
		// Bulk operations
		// BulkCreate(ctx context.Context, majors []*majorPb.Major) ([]string, error)
		// BulkUpdate(ctx context.Context, majors []*majorPb.Major) ([]string, error)
		// BulkDelete(ctx context.Context, ids []primitive.ObjectID) ([]string, error)
	}
	
	majorRepository struct {
		db *mongo.Client
	}
)

func NewRepository(db *mongo.Client) MajorRepositoryService {
	return &majorRepository{db: db}
}

func (r *majorRepository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *majorRepository) majorsColl(ctx context.Context) *mongo.Collection {
	return r.dbConnect(ctx).Collection(collectionMajors)
}

// Create creates a new major
func (r *majorRepository) Create(ctx context.Context, major *majorPb.Major) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating major",
			logging.FieldOperation, "create_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, major.Id,
		)
		
		majorsColl := r.majorsColl(ctx)
		
		// Check if major acronym already exists
		filter := bson.M{
			"$or": []bson.M{
				{"acronym.th": major.Acronym.Th},
				{"acronym.en": major.Acronym.En},
			},
		}
		
		var existingMajor majorPb.Major
		err := majorsColl.FindOne(ctx, filter).Decode(&existingMajor)
		if err == nil {
			logger.Warn("Major acronym already exists",
				logging.FieldOperation, "create_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, major.Id,
				"acronym", major.Acronym.Th,
			)
			return struct{}{}, exceptions.AlreadyExists("major", "acronym", major.Acronym.Th, nil, exceptions.WithOperation("create"))
		} else if err != mongo.ErrNoDocuments {
			logger.Error("Error checking existing major", err,
				logging.FieldOperation, "create_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, major.Id,
			)
			return struct{}{}, exceptions.Internal("error checking existing major", err)
		}
		
		// Convert string ID to ObjectID
		var objectID primitive.ObjectID
		if major.Id == "" {
			objectID = primitive.NewObjectID()
			major.Id = objectID.Hex()
		} else {
			var err error
			objectID, err = primitive.ObjectIDFromHex(major.Id)
			if err != nil {
				logger.Error("Invalid major ID format", err,
					logging.FieldOperation, "create_major",
					logging.FieldEntity, "major",
					logging.FieldEntityID, major.Id,
				)
				return struct{}{}, exceptions.InvalidInput("invalid major ID format", err)
			}
		}
		
		// Validate school ID format
		if major.SchoolId != "" {
			_, err := primitive.ObjectIDFromHex(major.SchoolId)
			if err != nil {
				logger.Error("Invalid school ID format", err,
					logging.FieldOperation, "create_major",
					logging.FieldEntity, "major",
					logging.FieldEntityID, major.Id,
				)
				return struct{}{}, exceptions.InvalidInput("invalid school ID format", err)
			}
		}
		
		// Prepare document
		doc := bson.M{
			"_id":        objectID,
			"id":         major.Id,
			"school_id":  major.SchoolId,
			"name":       major.Name,
			"acronym":    major.Acronym,
			"details":    major.Details,
			"photos":     major.Photos,
			"created_at": major.CreatedAt,
			"updated_at": major.UpdatedAt,
		}
		
		// Insert document
		_, err = majorsColl.InsertOne(ctx, doc)
		if err != nil {
			logger.Error("Error creating major", err,
				logging.FieldOperation, "create_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, major.Id,
			)
			
			if mongo.IsDuplicateKeyError(err) {
				return struct{}{}, exceptions.AlreadyExists("major", "id", major.Id, err, exceptions.WithOperation("create"))
			}
			
			return struct{}{}, exceptions.Internal("error creating major", err)
		}
		
		logger.Info("Major created successfully",
			logging.FieldOperation, "create_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, major.Id,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// GetByID retrieves a major by ID
func (r *majorRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*majorPb.Major, error) {
	return decorator.WithTimeout[*majorPb.Major](10*time.Second)(func(ctx context.Context) (*majorPb.Major, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding major by ID",
			logging.FieldOperation, "get_major_by_id",
			logging.FieldEntity, "major",
			logging.FieldEntityID, id.Hex(),
		)

		majorsColl := r.majorsColl(ctx)

		filter := bson.M{
			"$or": []bson.M{
				{"_id": id},
				{"id": id.Hex()},
			},
		}

		var major majorPb.Major
		err := majorsColl.FindOne(ctx, filter).Decode(&major)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("Major not found",
					logging.FieldOperation, "get_major_by_id",
					logging.FieldEntity, "major",
					logging.FieldEntityID, id.Hex(),
				)
				return nil, exceptions.NotFound("major", id.Hex(), err)
			}

			logger.Error("Error finding major", err,
				logging.FieldOperation, "get_major_by_id",
				logging.FieldEntity, "major",
				logging.FieldEntityID, id.Hex(),
			)
			return nil, exceptions.Internal("error finding major", err)
		}

		logger.Info("Major found",
			logging.FieldOperation, "get_major_by_id",
			logging.FieldEntity, "major",
			logging.FieldEntityID, id.Hex(),
		)
		
		return &major, nil
	})(ctx)
}

// GetBySchoolID retrieves majors by school ID without pagination
func (r *majorRepository) GetBySchoolID(ctx context.Context, schoolID primitive.ObjectID) ([]*majorPb.Major, error) {
	return decorator.WithTimeout[[]*majorPb.Major](10*time.Second)(func(ctx context.Context) ([]*majorPb.Major, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding majors by school ID",
			logging.FieldOperation, "get_majors_by_school_id",
			logging.FieldEntity, "major",
			"school_id", schoolID.Hex(),
		)

		majorsColl := r.majorsColl(ctx)

		filter := bson.M{"school_id": schoolID.Hex()}
		
		cursor, err := majorsColl.Find(ctx, filter)
		if err != nil {
			logger.Error("Error finding majors by school ID", err,
				logging.FieldOperation, "get_majors_by_school_id",
				logging.FieldEntity, "major",
				"school_id", schoolID.Hex(),
			)
			return nil, exceptions.Internal("error finding majors by school ID", err)
		}
		defer cursor.Close(ctx)

		var majors []*majorPb.Major
		if err := cursor.All(ctx, &majors); err != nil {
			logger.Error("Error decoding majors", err,
				logging.FieldOperation, "get_majors_by_school_id",
				logging.FieldEntity, "major",
				"school_id", schoolID.Hex(),
			)
			return nil, exceptions.Internal("error decoding majors", err)
		}

		logger.Info("Majors found by school ID",
			logging.FieldOperation, "get_majors_by_school_id",
			logging.FieldEntity, "major",
			"school_id", schoolID.Hex(),
			"count", len(majors),
		)
		
		return majors, nil
	})(ctx)
}

// List retrieves all majors with pagination
func (r *majorRepository) List(ctx context.Context, page, limit int64) ([]*majorPb.Major, int64, error) {
	type Result struct {
		Majors []*majorPb.Major
		Count  int64
	}
	
	result, err := decorator.WithTimeout[Result](10*time.Second)(func(ctx context.Context) (Result, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Listing majors",
			logging.FieldOperation, "list_majors",
			logging.FieldEntity, "major",
			"page", page,
			"limit", limit,
		)

		majorsColl := r.majorsColl(ctx)
		
		// Calculate skip
		skip := (page - 1) * limit
		
		// Get total count
		total, err := majorsColl.CountDocuments(ctx, bson.M{})
		if err != nil {
			logger.Error("Error counting majors", err,
				logging.FieldOperation, "list_majors",
				logging.FieldEntity, "major",
			)
			return Result{}, exceptions.Internal("error counting majors", err)
		}
		
		// Get majors with pagination
		opts := options.Find().SetSkip(skip).SetLimit(limit)
		cursor, err := majorsColl.Find(ctx, bson.M{}, opts)
		if err != nil {
			logger.Error("Error finding majors", err,
				logging.FieldOperation, "list_majors",
				logging.FieldEntity, "major",
				"page", page,
				"limit", limit,
			)
			return Result{}, exceptions.Internal("error finding majors", err)
		}
		defer cursor.Close(ctx)
		
		var majors []*majorPb.Major
		if err := cursor.All(ctx, &majors); err != nil {
			logger.Error("Error decoding majors", err,
				logging.FieldOperation, "list_majors",
				logging.FieldEntity, "major",
			)
			return Result{}, exceptions.Internal("error decoding majors", err)
		}
		
		logger.Info("Majors listed successfully",
			logging.FieldOperation, "list_majors",
			logging.FieldEntity, "major",
			"count", len(majors),
			"total", total,
		)
		
		return Result{
			Majors: majors,
			Count:  total,
		}, nil
	})(ctx)
	
	if err != nil {
		return nil, 0, err
	}
	
	return result.Majors, result.Count, nil
}

// ListBySchool retrieves majors for a specific school with pagination
func (r *majorRepository) ListBySchool(ctx context.Context, schoolID primitive.ObjectID, page, limit int64) ([]*majorPb.Major, int64, error) {
	type Result struct {
		Majors []*majorPb.Major
		Count  int64
	}
	
	result, err := decorator.WithTimeout[Result](10*time.Second)(func(ctx context.Context) (Result, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Listing majors by school",
			logging.FieldOperation, "list_majors_by_school",
			logging.FieldEntity, "major",
			"school_id", schoolID.Hex(),
			"page", page,
			"limit", limit,
		)

		majorsColl := r.majorsColl(ctx)
		
		// Calculate skip
		skip := (page - 1) * limit
		
		filter := bson.M{"school_id": schoolID.Hex()}
		
		// Get total count for the school
		total, err := majorsColl.CountDocuments(ctx, filter)
		if err != nil {
			logger.Error("Error counting majors by school", err,
				logging.FieldOperation, "list_majors_by_school",
				logging.FieldEntity, "major",
				"school_id", schoolID.Hex(),
			)
			return Result{}, exceptions.Internal("error counting majors by school", err)
		}
		
		// Get majors with pagination
		opts := options.Find().SetSkip(skip).SetLimit(limit)
		cursor, err := majorsColl.Find(ctx, filter, opts)
		if err != nil {
			logger.Error("Error finding majors by school", err,
				logging.FieldOperation, "list_majors_by_school",
				logging.FieldEntity, "major",
				"school_id", schoolID.Hex(),
				"page", page,
				"limit", limit,
			)
			return Result{}, exceptions.Internal("error finding majors by school", err)
		}
		defer cursor.Close(ctx)
		
		var majors []*majorPb.Major
		if err := cursor.All(ctx, &majors); err != nil {
			logger.Error("Error decoding majors", err,
				logging.FieldOperation, "list_majors_by_school",
				logging.FieldEntity, "major",
				"school_id", schoolID.Hex(),
			)
			return Result{}, exceptions.Internal("error decoding majors", err)
		}
		
		logger.Info("Majors listed by school successfully",
			logging.FieldOperation, "list_majors_by_school",
			logging.FieldEntity, "major",
			"school_id", schoolID.Hex(),
			"count", len(majors),
			"total", total,
		)
		
		return Result{
			Majors: majors,
			Count:  total,
		}, nil
	})(ctx)
	
	if err != nil {
		return nil, 0, err
	}
	
	return result.Majors, result.Count, nil
}

// Update updates an existing major
func (r *majorRepository) Update(ctx context.Context, major *majorPb.Major) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Updating major",
			logging.FieldOperation, "update_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, major.Id,
		)
		
		majorsColl := r.majorsColl(ctx)
		
		// Convert ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(major.Id)
		if err != nil {
			logger.Error("Invalid major ID format", err,
				logging.FieldOperation, "update_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, major.Id,
			)
			return struct{}{}, exceptions.InvalidInput("invalid major ID format", err)
		}
		
		// Check if major exists
		filter := bson.M{"_id": objectID}
		var existingMajor majorPb.Major
		err = majorsColl.FindOne(ctx, filter).Decode(&existingMajor)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("Major not found",
					logging.FieldOperation, "update_major",
					logging.FieldEntity, "major",
					logging.FieldEntityID, major.Id,
				)
				return struct{}{}, exceptions.NotFound("major", major.Id, err)
			}
			
			logger.Error("Error checking existing major", err,
				logging.FieldOperation, "update_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, major.Id,
			)
			return struct{}{}, exceptions.Internal("error checking existing major", err)
		}
		
		// Check if updated name or acronym conflicts with other majors
		conflictFilter := bson.M{
			"$and": []bson.M{
				{
					"$or": []bson.M{
						{"acronym.th": major.Acronym.Th},
						{"acronym.en": major.Acronym.En},
					},
				},
				{"_id": bson.M{"$ne": objectID}},
			},
		}
		
		count, err := majorsColl.CountDocuments(ctx, conflictFilter)
		if err != nil {
			logger.Error("Error checking conflict majors", err,
				logging.FieldOperation, "update_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, major.Id,
			)
			return struct{}{}, exceptions.Internal("error checking conflict majors", err)
		}
		
		if count > 0 {
			logger.Warn("Major acronym already exists",
				logging.FieldOperation, "update_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, major.Id,
				"acronym", major.Acronym.Th,
			)
			return struct{}{}, exceptions.AlreadyExists("major", "acronym", major.Acronym.Th, nil, exceptions.WithOperation("update"))
		}
		
		// Update document
		update := bson.M{
			"$set": bson.M{
				"name":       major.Name,
				"acronym":    major.Acronym,
				"details":    major.Details,
				"photos":     major.Photos,
				"updated_at": major.UpdatedAt,
			},
		}
		
		_, err = majorsColl.UpdateOne(ctx, filter, update)
		if err != nil {
			logger.Error("Error updating major", err,
				logging.FieldOperation, "update_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, major.Id,
			)
			return struct{}{}, exceptions.Internal("error updating major", err)
		}
		
		logger.Info("Major updated successfully",
			logging.FieldOperation, "update_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, major.Id,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// Delete deletes a major
func (r *majorRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deleting major",
			logging.FieldOperation, "delete_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, id.Hex(),
		)
		
		majorsColl := r.majorsColl(ctx)
		
		// Check if major exists
		filter := bson.M{"_id": id}
		var existingMajor majorPb.Major
		err := majorsColl.FindOne(ctx, filter).Decode(&existingMajor)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("Major not found",
					logging.FieldOperation, "delete_major",
					logging.FieldEntity, "major",
					logging.FieldEntityID, id.Hex(),
				)
				return struct{}{}, exceptions.NotFound("major", id.Hex(), err)
			}
			
			logger.Error("Error checking existing major", err,
				logging.FieldOperation, "delete_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, id.Hex(),
			)
			return struct{}{}, exceptions.Internal("error checking existing major", err)
		}
		
		// Delete document
		_, err = majorsColl.DeleteOne(ctx, filter)
		if err != nil {
			logger.Error("Error deleting major", err,
				logging.FieldOperation, "delete_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, id.Hex(),
			)
			return struct{}{}, exceptions.Internal("error deleting major", err)
		}
		
		logger.Info("Major deleted successfully",
			logging.FieldOperation, "delete_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, id.Hex(),
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
} 