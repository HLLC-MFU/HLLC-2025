package repository

import (
	"context"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Repository defines the interface for school data operations
type Repository interface {
	// Create creates a new school
	Create(ctx context.Context, school *model.School) error

	// GetByID retrieves a school by its ID
	GetByID(ctx context.Context, id primitive.ObjectID) (*model.School, error)

	// GetByAcronym retrieves a school by its acronym
	GetByAcronym(ctx context.Context, acronym string) (*model.School, error)

	// List retrieves all schools with optional pagination
	List(ctx context.Context, page, limit int64) ([]*model.School, int64, error)

	// Update updates an existing school
	Update(ctx context.Context, school *model.School) error

	// Delete deletes a school by its ID
	Delete(ctx context.Context, id primitive.ObjectID) error
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

func (r *repository) Create(ctx context.Context, school *model.School) error {
	school.ID = primitive.NewObjectID()
	school.CreatedAt = time.Now()
	school.UpdatedAt = time.Now()
	
	_, err := r.dbConnect(ctx).Collection("schools").InsertOne(ctx, school)
	return err
}

func (r *repository) GetByID(ctx context.Context, id primitive.ObjectID) (*model.School, error) {
	var school model.School
	err := r.dbConnect(ctx).Collection("schools").FindOne(ctx, bson.M{"_id": id}).Decode(&school)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &school, nil
}

func (r *repository) GetByAcronym(ctx context.Context, acronym string) (*model.School, error) {
	var school model.School
	err := r.dbConnect(ctx).Collection("schools").FindOne(ctx, bson.M{"acronym": acronym}).Decode(&school)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &school, nil
}

func (r *repository) List(ctx context.Context, page, limit int64) ([]*model.School, int64, error) {
	var schools []*model.School

	// Calculate skip value for pagination
	skip := (page - 1) * limit

	// Get total count
	total, err := r.dbConnect(ctx).Collection("schools").CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, err
	}

	// Find schools with pagination
	opts := options.Find().
		SetSkip(skip).
		SetLimit(limit).
		SetSort(bson.D{{Key: "name.en_name", Value: 1}})

	cursor, err := r.dbConnect(ctx).Collection("schools").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &schools); err != nil {
		return nil, 0, err
	}

	return schools, total, nil
}

func (r *repository) Update(ctx context.Context, school *model.School) error {
	school.UpdatedAt = time.Now()
	_, err := r.dbConnect(ctx).Collection("schools").ReplaceOne(ctx, bson.M{"_id": school.ID}, school)
	return err
}

func (r *repository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.dbConnect(ctx).Collection("schools").DeleteOne(ctx, bson.M{"_id": id})
	return err
} 