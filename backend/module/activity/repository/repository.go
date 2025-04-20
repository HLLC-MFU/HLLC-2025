package repository

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/entity"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrNotFound     = errors.New("activity not found")
	ErrDuplicate    = errors.New("activity with this code already exists")
	ErrInvalidID    = errors.New("invalid activity ID")
	ErrInternalError = errors.New("internal repository error")
)

// ActivityRepositoryService defines the interface for activity repository operations
type ActivityRepositoryService interface {
	CreateActivity(ctx context.Context, activity *entity.Activity) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*entity.Activity, error)
	FindByCode(ctx context.Context, code string) (*entity.Activity, error)
	FindAll(ctx context.Context) ([]*entity.Activity, error)
	UpdateActivity(ctx context.Context, activity *entity.Activity) error
	DeleteActivity(ctx context.Context, id primitive.ObjectID) error
}

// activityRepository implements the ActivityRepositoryService interface
type activityRepository struct {
	db *mongo.Client
}

// NewActivityRepository creates a new instance of the activity repository
func NewActivityRepository(db *mongo.Client) ActivityRepositoryService {
	return &activityRepository{db: db}
}

// dbConnect returns a reference to the database
func (r *activityRepository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

// CreateActivity creates a new activity
func (r *activityRepository) CreateActivity(ctx context.Context, activity *entity.Activity) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("activities")

		// Create indexes if they don't exist
		_, err := collection.Indexes().CreateOne(ctx, mongo.IndexModel{
			Keys:    bson.D{{Key: "code", Value: 1}},
			Options: options.Index().SetUnique(true),
		})
		if err != nil {
			log.Printf("Error creating index: %v", err)
			return struct{}{}, ErrInternalError
		}

		// Insert the activity
		_, err = collection.InsertOne(ctx, activity)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				return struct{}{}, ErrDuplicate
			}
			return struct{}{}, err
		}

		return struct{}{}, nil
	})(ctx)

	return err
}

// FindByID finds an activity by ID
func (r *activityRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*entity.Activity, error) {
	var activity *entity.Activity

	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("activities")
		filter := bson.M{"_id": id}

		err := collection.FindOne(ctx, filter).Decode(&activity)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return struct{}{}, ErrNotFound
			}
			return struct{}{}, err
		}

		return struct{}{}, nil
	})(ctx)

	if err != nil {
		return nil, err
	}

	return activity, nil
}

// FindByCode finds an activity by code
func (r *activityRepository) FindByCode(ctx context.Context, code string) (*entity.Activity, error) {
	var activity *entity.Activity

	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("activities")
		filter := bson.M{"code": code}

		err := collection.FindOne(ctx, filter).Decode(&activity)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return struct{}{}, ErrNotFound
			}
			return struct{}{}, err
		}

		return struct{}{}, nil
	})(ctx)

	if err != nil {
		return nil, err
	}

	return activity, nil
}

// FindAll finds all activities
func (r *activityRepository) FindAll(ctx context.Context) ([]*entity.Activity, error) {
	var activities []*entity.Activity

	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("activities")
		
		cursor, err := collection.Find(ctx, bson.M{})
		if err != nil {
			return struct{}{}, err
		}
		defer cursor.Close(ctx)

		if err := cursor.All(ctx, &activities); err != nil {
			return struct{}{}, err
		}

		return struct{}{}, nil
	})(ctx)

	if err != nil {
		return nil, err
	}

	return activities, nil
}

// UpdateActivity updates an activity
func (r *activityRepository) UpdateActivity(ctx context.Context, activity *entity.Activity) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("activities")
		
		// Update the activity's update timestamp
		activity.UpdatedAt = time.Now()
		
		filter := bson.M{"_id": activity.ID}
		update := bson.M{"$set": activity}
		
		result, err := collection.UpdateOne(ctx, filter, update)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				return struct{}{}, ErrDuplicate
			}
			return struct{}{}, err
		}
		
		if result.MatchedCount == 0 {
			return struct{}{}, ErrNotFound
		}
		
		return struct{}{}, nil
	})(ctx)

	return err
}

// DeleteActivity deletes an activity
func (r *activityRepository) DeleteActivity(ctx context.Context, id primitive.ObjectID) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("activities")
		
		filter := bson.M{"_id": id}
		result, err := collection.DeleteOne(ctx, filter)
		if err != nil {
			return struct{}{}, err
		}
		
		if result.DeletedCount == 0 {
			return struct{}{}, ErrNotFound
		}
		
		return struct{}{}, nil
	})(ctx)

	return err
} 