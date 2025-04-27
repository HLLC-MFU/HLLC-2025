package repository

import (
	"context"
	"time"

	schoolPb "github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const (
	collectionSchools = "schools"
) 

// SchoolRepositoryService defines the interface for school data operations
type (
	
	SchoolRepositoryService interface {
	Create(ctx context.Context, school *schoolPb.School) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*schoolPb.School, error)
	GetByAcronym(ctx context.Context, acronym string) (*schoolPb.School, error)
	List(ctx context.Context, page, limit int64) ([]*schoolPb.School, int64, error)
	Update(ctx context.Context, school *schoolPb.School) error
	Delete(ctx context.Context, id primitive.ObjectID) error

	// Bulk operations
	// BulkCreate(ctx context.Context, schools []*schoolPb.School) ([]string, error)
	// BulkUpdate(ctx context.Context, schools []*schoolPb.School) ([]string, error)
	// BulkDelete(ctx context.Context, ids []primitive.ObjectID) ([]string, error)

	}
	
	schoolRepository struct {
		db *mongo.Client
	}
)


func NewRepository(db *mongo.Client) SchoolRepositoryService {
	return &schoolRepository{db: db}
}

func (r *schoolRepository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *schoolRepository) schoolsColl(ctx context.Context) *mongo.Collection {
	return r.dbConnect(ctx).Collection(collectionSchools)
}

func (r *schoolRepository) Create(ctx context.Context, school *schoolPb.School) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating school",
			logging.FieldOperation, "create_school",
			logging.FieldEntity, "school",
			logging.FieldEntityID, school.Id,
		)
		
		schoolsColl := r.schoolsColl(ctx)
		
		// Check if school acronym already exists
		filter := bson.M{
			"$or": []bson.M{
				{"acronym.th": school.Acronym.Th},
				{"acronym.en": school.Acronym.En},
			},
		}
		
		var existingSchool schoolPb.School
		err := schoolsColl.FindOne(ctx, filter).Decode(&existingSchool)
		if err == nil {
			logger.Warn("School acronym already exists",
				logging.FieldOperation, "create_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, school.Id,
				"acronym", school.Acronym.Th,
			)
			return struct{}{}, exceptions.AlreadyExists("school", "acronym", school.Acronym.Th, nil, exceptions.WithOperation("create"))
		} else if err != mongo.ErrNoDocuments {
			logger.Error("Error checking existing school", err,
				logging.FieldOperation, "create_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, school.Id,
			)
			return struct{}{}, exceptions.Internal("error checking existing school", err)
		}
		
		// Convert string ID to ObjectID
		var objectID primitive.ObjectID
		if school.Id == "" {
			objectID = primitive.NewObjectID()
			school.Id = objectID.Hex()
		} else {
			var err error
			objectID, err = primitive.ObjectIDFromHex(school.Id)
			if err != nil {
				logger.Error("Invalid school ID format", err,
					logging.FieldOperation, "create_school",
					logging.FieldEntity, "school",
					logging.FieldEntityID, school.Id,
				)
				return struct{}{}, exceptions.InvalidInput("invalid school ID format", err)
			}
		}
		
		// Prepare document
		doc := bson.M{
			"_id":          objectID,
			"id":           school.Id,
			"name":         school.Name,
			"acronym":      school.Acronym,
			"details":      school.Details,
			"photos":       school.Photos,
			"created_at":   school.CreatedAt,
			"updated_at":   school.UpdatedAt,
		}
		
		// Insert document
		_, err = schoolsColl.InsertOne(ctx, doc)
		if err != nil {
			logger.Error("Error creating school", err,
				logging.FieldOperation, "create_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, school.Id,
			)
			
			if mongo.IsDuplicateKeyError(err) {
				return struct{}{}, exceptions.AlreadyExists("school", "id", school.Id, err, exceptions.WithOperation("create"))
			}
			
			return struct{}{}, exceptions.Internal("error creating school", err)
		}
		
		logger.Info("School created successfully",
			logging.FieldOperation, "create_school",
			logging.FieldEntity, "school",
			logging.FieldEntityID, school.Id,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

func (r *schoolRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*schoolPb.School, error) {
	return decorator.WithTimeout[*schoolPb.School](10*time.Second)(func(ctx context.Context) (*schoolPb.School, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding school By ID",
			logging.FieldOperation, "get_school_by_id",
			logging.FieldEntity, "school",
			logging.FieldEntityID, id.Hex(),
		)

		schoolsColl := r.schoolsColl(ctx)

		filter := bson.M{
			"$or": []bson.M{
				{"_id": id},
				{"id": id.Hex()},
			},
		}

		var school schoolPb.School
		err := schoolsColl.FindOne(ctx, filter).Decode(&school)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("School not found",
					logging.FieldOperation, "get_school_by_id",
					logging.FieldEntity, "school",
					logging.FieldEntityID, id.Hex(),
				)
				return nil, exceptions.NotFound("school", id.Hex(), err)
			}

			logger.Error("Error finding school", err,
				logging.FieldOperation, "get_school_by_id",
				logging.FieldEntity, "school",
				logging.FieldEntityID, id.Hex(),
			)
			return nil, exceptions.Internal("error finding school", err)
		}

		logger.Info("School found",
			logging.FieldOperation, "get_school_by_id",
			logging.FieldEntity, "school",
			logging.FieldEntityID, id.Hex(),
		)
		
		return &school, nil
	})(ctx)
}

func (r *schoolRepository) GetByAcronym(ctx context.Context, acronym string) (*schoolPb.School, error) {
	return decorator.WithTimeout[*schoolPb.School](10*time.Second)(func(ctx context.Context) (*schoolPb.School, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding school By Acronym",
			logging.FieldOperation, "get_school_by_acronym",
			logging.FieldEntity, "school",
			logging.FieldEntityID, acronym,
		)
		
		schoolsColl := r.schoolsColl(ctx)

		filter := bson.M{
			"$or": []bson.M{
				{"acronym.th": acronym},
				{"acronym.en": acronym},
			},
		}

		var school schoolPb.School
		err := schoolsColl.FindOne(ctx, filter).Decode(&school)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("School not found with acronym",
					logging.FieldOperation, "get_school_by_acronym",
					logging.FieldEntity, "school",
					logging.FieldEntityID, acronym,
				)
				return nil, exceptions.NotFound("school", "acronym=" + acronym, err)
			}
			logger.Error("Error finding school by acronym", err,
				logging.FieldOperation, "get_school_by_acronym",
				logging.FieldEntity, "school",
				logging.FieldEntityID, acronym,
			)
			return nil, exceptions.Internal("error finding school by acronym", err)
		}

		logger.Info("School found",
			logging.FieldOperation, "get_school_by_acronym",
			logging.FieldEntity, "school",
			logging.FieldEntityID, acronym,
		)

		return &school, nil
	})(ctx)
}

func (r *schoolRepository) List(ctx context.Context, page, limit int64) ([]*schoolPb.School, int64, error) {
	type Result struct {
		Schools []*schoolPb.School
		Count   int64
	}
	
	result, err := decorator.WithTimeout[Result](10*time.Second)(func(ctx context.Context) (Result, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Listing schools",
			logging.FieldOperation, "list_schools",
			logging.FieldEntity, "school",
		)

		schoolsColl := r.schoolsColl(ctx)

		//Find school
		cursor, err := schoolsColl.Find(ctx, bson.M{})
		if err != nil {
			logger.Error("Error finding schools", err,
				logging.FieldOperation, "list_schools",
				logging.FieldEntity, "school",
			)
			return Result{}, exceptions.Internal("error finding schools", err)
		}

		defer cursor.Close(ctx)

		var schools []*schoolPb.School
		if err := cursor.All(ctx, &schools); err != nil {
			logger.Error("Error decoding schools", err,
				logging.FieldEntity, "school",
			)
			return Result{}, exceptions.Internal("error decoding schools", err)
		}

		// Return empty array instead of nil
		if schools == nil {
			schools = []*schoolPb.School{}
		}

		logger.Info("Found schools",
			logging.FieldOperation, "list_schools",
			logging.FieldEntity, "school",
			"count", len(schools),
		)
	
		return Result{
			Schools: schools,
			Count:   int64(len(schools)),
		}, nil
	})(ctx)
	
	if err != nil {
		return nil, 0, err
	}
	
	return result.Schools, result.Count, nil
}

func (r *schoolRepository) Update(ctx context.Context, school *schoolPb.School) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		
		// Parse school ID
		schoolID, err := primitive.ObjectIDFromHex(school.Id)
		if err != nil {
			logger.Error("Invalid school ID", err,
				logging.FieldOperation, "update_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, school.Id,
			)
			return struct{}{}, exceptions.InvalidInput("invalid school ID format", err)
		}
		
		logger.Info("Updating school",
			logging.FieldOperation, "update_school",
			logging.FieldEntity, "school",
			logging.FieldEntityID, school.Id,
		)

		schoolsColl := r.schoolsColl(ctx)

		filter := bson.M{
			"_id": schoolID,
		}

		// Create update document with only fields from schoolPb struct
		update := bson.M{
			"$set": bson.M{
				"name":       school.Name,
				"acronym":    school.Acronym,
				"updated_at": time.Now(),
				// Add other fields from schoolPb as needed
			},
		}
		
		result, err := schoolsColl.UpdateOne(ctx, filter, update)
		if err != nil {
			logger.Error("Error updating school", err,
				logging.FieldOperation, "update_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, school.Id,
			)
			return struct{}{}, exceptions.Internal("error updating school", err)
		}
		
		if result.MatchedCount == 0 {
			logger.Warn("School not found for update",
				logging.FieldOperation, "update_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, school.Id,
			)
			return struct{}{}, exceptions.NotFound("school", school.Id, nil)
		}

		logger.Info("School updated successfully",
			logging.FieldOperation, "update_school",
			logging.FieldEntity, "school",
			logging.FieldEntityID, school.Id,
		)

		return struct{}{}, nil
	})(ctx)
	
	return err
}

func (r *schoolRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deleting school",
			logging.FieldOperation, "delete_school",
			logging.FieldEntity, "school",
			logging.FieldEntityID, id.Hex(),
		)
		
		schoolsColl := r.schoolsColl(ctx)
		
		result, err := schoolsColl.DeleteOne(ctx, bson.M{"_id": id})
		if err != nil {
			logger.Error("Error deleting school", err,
				logging.FieldOperation, "delete_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, id.Hex(),
			)
			return struct{}{}, exceptions.Internal("error deleting school", err)
		}
		
		if result.DeletedCount == 0 {
			logger.Warn("School not found for deletion",
				logging.FieldOperation, "delete_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, id.Hex(),
			)
			return struct{}{}, exceptions.NotFound("school", id.Hex(), nil)
		}
		
		logger.Info("School deleted successfully",
			logging.FieldOperation, "delete_school",
			logging.FieldEntity, "school",
			logging.FieldEntityID, id.Hex(),
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// // BulkCreate creates multiple schools in one operation
// func (r *schoolRepository) BulkCreate(ctx context.Context, schools []*schoolPb.School) ([]string, error) {
// 	failedIDs, err := decorator.WithTimeout[[]string](30*time.Second)(func(ctx context.Context) ([]string, error) {
// 		logger := logging.DefaultLogger.WithContext(ctx)
// 		logger.Info("Bulk creating schools",
// 			logging.FieldOperation, "bulk_create_schools",
// 			logging.FieldEntity, "school",
// 			"count", len(schools),
// 		)
		
// 		if len(schools) == 0 {
// 			return []string{}, nil
// 		}

// 		schoolsColl := r.schoolsColl(ctx)
// 		failedIDs := make([]string, 0)
		
// 		// Prepare models for bulk insert
// 		models := make([]mongo.WriteModel, 0, len(schools))
		
// 		// Create a map to keep track of acronyms to check for duplicates
// 		existingAcronyms := make(map[string]bool)
		
// 		// First check for existing acronyms to avoid duplicates
// 		for _, school := range schools {
// 			if school.Acronym == nil || school.Acronym.Th == "" {
// 				failedIDs = append(failedIDs, school.Id)
// 				continue
// 			}
			
// 			// Check if acronym already exists
// 			var existingSchool schoolPb.School
// 			err := schoolsColl.FindOne(ctx, bson.M{
// 				"$or": []bson.M{
// 					{"acronym.th": school.Acronym.Th},
// 					{"acronym.en": school.Acronym.En},
// 				},
// 			}).Decode(&existingSchool)
// 			if err == nil {
// 				// Acronym already exists
// 				logger.Warn("School acronym already exists, skipping",
// 					logging.FieldOperation, "bulk_create_schools",
// 					logging.FieldEntity, "school",
// 					logging.FieldEntityID, school.Id,
// 					"acronym", school.Acronym.Th,
// 				)
// 				failedIDs = append(failedIDs, school.Id)
// 				continue
// 			} else if err != mongo.ErrNoDocuments {
// 				// Database error
// 				logger.Error("Error checking existing school", err,
// 					logging.FieldOperation, "bulk_create_schools",
// 					logging.FieldEntity, "school",
// 					logging.FieldEntityID, school.Id,
// 				)
// 				return nil, exceptions.Internal("error checking existing schools", err)
// 			}
			
// 			// Check for duplicates within the batch
// 			if existingAcronyms[school.Acronym.Th] {
// 				logger.Warn("Duplicate acronym in batch, skipping",
// 					logging.FieldOperation, "bulk_create_schools",
// 					logging.FieldEntity, "school",
// 					logging.FieldEntityID, school.Id,
// 					"acronym", school.Acronym.Th,
// 				)
// 				failedIDs = append(failedIDs, school.Id)
// 				continue
// 			}
			
// 			existingAcronyms[school.Acronym.Th] = true
			
// 			// Convert string ID to ObjectID for MongoDB
// 			var objectID primitive.ObjectID
// 			if school.Id == "" {
// 				objectID = primitive.NewObjectID()
// 				school.Id = objectID.Hex()
// 			} else {
// 				var err error
// 				objectID, err = primitive.ObjectIDFromHex(school.Id)
// 				if err != nil {
// 					logger.Error("Invalid school ID format", err,
// 						logging.FieldOperation, "bulk_create_schools",
// 						logging.FieldEntity, "school",
// 						logging.FieldEntityID, school.Id,
// 					)
// 					failedIDs = append(failedIDs, school.Id)
// 					continue
// 				}
// 			}
			
// 			// Create document
// 			doc := bson.M{
// 				"_id":          objectID,
// 				"id":           school.Id,
// 				"name":         school.Name,
// 				"acronym":      school.Acronym,
// 				"photos":       school.Photos,
// 				"created_at":   school.CreatedAt,
// 				"updated_at":   school.UpdatedAt,
// 			}
			
// 			// Create insert model
// 			model := mongo.NewInsertOneModel().SetDocument(doc)
// 			models = append(models, model)
// 		}
		
// 		// If no valid models, return early
// 		if len(models) == 0 {
// 			return failedIDs, nil
// 		}
		
// 		// Execute bulk write
// 		opts := options.BulkWrite().SetOrdered(false)
// 		result, err := schoolsColl.BulkWrite(ctx, models, opts)
// 		if err != nil {
// 			if mongo.IsDuplicateKeyError(err) {
// 				logger.Warn("Duplicate key error in bulk insert",
// 					logging.FieldOperation, "bulk_create_schools",
// 					logging.FieldEntity, "school",
// 				)
// 				// Continue with the schools that were successfully inserted
// 			} else {
// 				logger.Error("Error in bulk insert", err,
// 					logging.FieldOperation, "bulk_create_schools",
// 					logging.FieldEntity, "school",
// 				)
// 				return nil, exceptions.Internal("error in bulk insert", err)
// 			}
// 		}
		
// 		logger.Info("Bulk insert completed",
// 			logging.FieldOperation, "bulk_create_schools",
// 			logging.FieldEntity, "school",
// 			"inserted_count", result.InsertedCount,
// 			"failed_count", len(failedIDs),
// 		)
		
// 		return failedIDs, nil
// 	})(ctx)
	
// 	return failedIDs, err
// }

// // BulkUpdate updates multiple schools in one operation
// func (r *schoolRepository) BulkUpdate(ctx context.Context, schools []*schoolPb.School) ([]string, error) {
// 	failedIDs, err := decorator.WithTimeout[[]string](30*time.Second)(func(ctx context.Context) ([]string, error) {
// 		logger := logging.DefaultLogger.WithContext(ctx)
// 		logger.Info("Bulk updating schools",
// 			logging.FieldOperation, "bulk_update_schools",
// 			logging.FieldEntity, "school",
// 			"count", len(schools),
// 		)
		
// 		if len(schools) == 0 {
// 			return []string{}, nil
// 		}

// 		schoolsColl := r.schoolsColl(ctx)
// 		failedIDs := make([]string, 0)
		
// 		// Prepare models for bulk update
// 		models := make([]mongo.WriteModel, 0, len(schools))
		
// 		for _, school := range schools {
// 			if school.Id == "" {
// 				continue
// 			}
			
// 			objectID, err := primitive.ObjectIDFromHex(school.Id)
// 			if err != nil {
// 				logger.Error("Invalid school ID format", err,
// 					logging.FieldOperation, "bulk_update_schools",
// 					logging.FieldEntity, "school",
// 					logging.FieldEntityID, school.Id,
// 				)
// 				failedIDs = append(failedIDs, school.Id)
// 				continue
// 			}
			
// 			// Create filter
// 			filter := bson.M{"_id": objectID}
			
// 			// Update document
// 			update := bson.M{
// 				"$set": bson.M{
// 					"name":       school.Name,
// 					"acronym":    school.Acronym,
// 					"photos":     school.Photos,
// 					"updated_at": time.Now().Format(time.RFC3339),
// 				},
// 			}
			
// 			// Create update model
// 			model := mongo.NewUpdateOneModel().
// 				SetFilter(filter).
// 				SetUpdate(update).
// 				SetUpsert(false)
			
// 			models = append(models, model)
// 		}
		
// 		// If no valid models, return early
// 		if len(models) == 0 {
// 			return failedIDs, nil
// 		}
		
// 		// Execute bulk write
// 		opts := options.BulkWrite().SetOrdered(false)
// 		result, err := schoolsColl.BulkWrite(ctx, models, opts)
// 		if err != nil {
// 			logger.Error("Error in bulk update", err,
// 				logging.FieldOperation, "bulk_update_schools",
// 				logging.FieldEntity, "school",
// 			)
// 			return nil, exceptions.Internal("error in bulk update", err)
// 		}
		
// 		// Check for schools that weren't updated
// 		if result.MatchedCount < int64(len(models)) {
// 			logger.Warn("Some schools weren't found",
// 				logging.FieldOperation, "bulk_update_schools",
// 				logging.FieldEntity, "school",
// 				"matched_count", result.MatchedCount,
// 				"models_count", len(models),
// 			)
			
// 			// For simplicity, we're not tracking which specific schools weren't found
// 			// A more robust implementation would need to check each school individually
// 		}
		
// 		logger.Info("Bulk update completed",
// 			logging.FieldOperation, "bulk_update_schools",
// 			logging.FieldEntity, "school",
// 			"matched_count", result.MatchedCount,
// 			"modified_count", result.ModifiedCount,
// 			"failed_count", len(failedIDs),
// 		)
		
// 		return failedIDs, nil
// 	})(ctx)
	
// 	return failedIDs, err
// }

// // BulkDelete deletes multiple schools by ID
// func (r *schoolRepository) BulkDelete(ctx context.Context, ids []primitive.ObjectID) ([]string, error) {
// 	failedIDs, err := decorator.WithTimeout[[]string](30*time.Second)(func(ctx context.Context) ([]string, error) {
// 		logger := logging.DefaultLogger.WithContext(ctx)
// 		logger.Info("Bulk deleting schools",
// 			logging.FieldOperation, "bulk_delete_schools",
// 			logging.FieldEntity, "school",
// 			"count", len(ids),
// 		)
		
// 		if len(ids) == 0 {
// 			return []string{}, nil
// 		}

// 		schoolsColl := r.schoolsColl(ctx)
// 		failedIDs := make([]string, 0)
		
// 		// Create filter for all IDs
// 		filter := bson.M{
// 			"_id": bson.M{
// 				"$in": ids,
// 			},
// 		}
		
// 		// Execute delete operation
// 		result, err := schoolsColl.DeleteMany(ctx, filter)
// 		if err != nil {
// 			logger.Error("Error in bulk delete", err,
// 				logging.FieldOperation, "bulk_delete_schools",
// 				logging.FieldEntity, "school",
// 			)
// 			return nil, exceptions.Internal("error in bulk delete", err)
// 		}
		
// 		// Check for schools that weren't deleted
// 		if result.DeletedCount < int64(len(ids)) {
// 			logger.Warn("Some schools weren't found",
// 				logging.FieldOperation, "bulk_delete_schools",
// 				logging.FieldEntity, "school",
// 				"deleted_count", result.DeletedCount,
// 				"ids_count", len(ids),
// 			)
			
// 			// For simplicity, we're not tracking which specific schools weren't found
// 			// A more robust implementation would need to find which IDs weren't deleted
// 			// This would require querying all remaining IDs after deletion
// 		}
		
// 		logger.Info("Bulk delete completed",
// 			logging.FieldOperation, "bulk_delete_schools",
// 			logging.FieldEntity, "school",
// 			"deleted_count", result.DeletedCount,
// 		)
		
// 		return failedIDs, nil
// 	})(ctx)
	
// 	return failedIDs, err
// } 