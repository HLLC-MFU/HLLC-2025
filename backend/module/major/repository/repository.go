package repository

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/model"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Repository defines the interface for major data operations
type Repository interface {
	// Create creates a new major
	Create(ctx context.Context, major *model.Major) error

	// GetByID retrieves a major by its ID
	GetByID(ctx context.Context, id primitive.ObjectID) (*model.Major, error)

	// List retrieves all majors with optional pagination
	List(ctx context.Context, page, limit int64) ([]*model.Major, int64, error)

	// ListBySchool retrieves majors by school ID with optional pagination
	ListBySchool(ctx context.Context, schoolID primitive.ObjectID, skip, limit int64) ([]*model.Major, error)

	// CountBySchool retrieves the count of majors by school ID
	CountBySchool(ctx context.Context, schoolID primitive.ObjectID) (int64, error)

	// Update updates an existing major
	Update(ctx context.Context, major *model.Major) error

	// Delete deletes a major by its ID
	Delete(ctx context.Context, id primitive.ObjectID) error

	// ExistsByID checks if a major exists by its ID
	ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error)

	// ExistsByNameOrAcronym checks if a major exists by its name or acronym
	ExistsByNameOrAcronym(ctx context.Context, name coreModel.LocalizedName, acronym string) (bool, error)

	// ExistsByNameOrAcronymExceptID checks if a major exists by its name, acronym, and except for a specific ID
	ExistsByNameOrAcronymExceptID(ctx context.Context, name coreModel.LocalizedName, acronym string, id primitive.ObjectID) (bool, error)
}

type repository struct {
	db *mongo.Client
}

func NewRepository(db *mongo.Client) Repository {
	return &repository{db: db}
}

func (r *repository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *repository) Create(ctx context.Context, major *model.Major) error {
	_, err := r.dbConnect(ctx).Collection("majors").InsertOne(ctx, major)
	return err
}

func (r *repository) GetByID(ctx context.Context, id primitive.ObjectID) (*model.Major, error) {
	var major model.Major
	err := r.dbConnect(ctx).Collection("majors").FindOne(ctx, bson.M{"_id": id}).Decode(&major)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &major, nil
}

func (r *repository) List(ctx context.Context, page, limit int64) ([]*model.Major, int64, error) {
	skip := (page - 1) * limit

	// Get total count
	total, err := r.dbConnect(ctx).Collection("majors").CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := r.dbConnect(ctx).Collection("majors").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var majors []*model.Major
	if err := cursor.All(ctx, &majors); err != nil {
		return nil, 0, err
	}

	return majors, total, nil
}

func (r *repository) ListBySchool(ctx context.Context, schoolID primitive.ObjectID, skip, limit int64) ([]*model.Major, error) {
	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := r.dbConnect(ctx).Collection("majors").Find(ctx, bson.M{"school_id": schoolID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var majors []*model.Major
	if err := cursor.All(ctx, &majors); err != nil {
		return nil, err
	}

	return majors, nil
}

func (r *repository) CountBySchool(ctx context.Context, schoolID primitive.ObjectID) (int64, error) {
	return r.dbConnect(ctx).Collection("majors").CountDocuments(ctx, bson.M{"school_id": schoolID})
}

func (r *repository) Update(ctx context.Context, major *model.Major) error {
	_, err := r.dbConnect(ctx).Collection("majors").ReplaceOne(ctx, bson.M{"_id": major.ID}, major)
	return err
}

func (r *repository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.dbConnect(ctx).Collection("majors").DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *repository) ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error) {
	count, err := r.dbConnect(ctx).Collection("majors").CountDocuments(ctx, bson.M{"_id": id})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *repository) ExistsByNameOrAcronym(ctx context.Context, name coreModel.LocalizedName, acronym string) (bool, error) {
	count, err := r.dbConnect(ctx).Collection("majors").CountDocuments(ctx, bson.M{
		"$or": []bson.M{
			{"name.th_name": name.ThName},
			{"name.en_name": name.EnName},
			{"acronym": acronym},
		},
	})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *repository) ExistsByNameOrAcronymExceptID(ctx context.Context, name coreModel.LocalizedName, acronym string, id primitive.ObjectID) (bool, error) {
	count, err := r.dbConnect(ctx).Collection("majors").CountDocuments(ctx, bson.M{
		"$and": []bson.M{
			{
				"$or": []bson.M{
					{"name.th_name": name.ThName},
					{"name.en_name": name.EnName},
					{"acronym": acronym},
				},
			},
			{"_id": bson.M{"$ne": id}},
		},
	})
	if err != nil {
		return false, err
	}
	return count > 0, nil
} 