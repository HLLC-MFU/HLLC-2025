package repository

import (
	"context"
	"errors"
	"log"
	"time"

	entity "github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrNotFound     = errors.New("check-in not found")
	ErrDuplicate    = errors.New("user already checked in to this activity")
	ErrInvalidID    = errors.New("invalid ID format")
	ErrInternalError = errors.New("internal repository error")
)

// CheckInRepositoryService defines the interface for check-in repository operations
type CheckInRepositoryService interface {
	CreateCheckIn(ctx context.Context, checkIn *entity.CheckIn) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*entity.CheckIn, error)
	FindByUserAndActivity(ctx context.Context, userID, activityID primitive.ObjectID) (*entity.CheckIn, error)
	FindByUserID(ctx context.Context, userID primitive.ObjectID) ([]*entity.CheckIn, error)
	FindByActivityID(ctx context.Context, activityID primitive.ObjectID) ([]*entity.CheckIn, error)
	CountByActivityID(ctx context.Context, activityID primitive.ObjectID) (int64, error)
	FindAll(ctx context.Context) ([]*entity.CheckIn, error)
	DeleteCheckIn(ctx context.Context, id primitive.ObjectID) error
}

// checkInRepository implements the CheckInRepositoryService interface
type checkInRepository struct {
	db *mongo.Client
}

// NewCheckInRepository creates a new instance of the check-in repository
func NewCheckInRepository(db *mongo.Client) CheckInRepositoryService {
	return &checkInRepository{db: db}
}

// dbConnect returns a reference to the database
func (r *checkInRepository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

// CreateCheckIn creates a new check-in record
func (r *checkInRepository) CreateCheckIn(ctx context.Context, checkIn *entity.CheckIn) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("check_ins")

		// Create composite index on user_id and activity_id for uniqueness
		_, err := collection.Indexes().CreateOne(ctx, mongo.IndexModel{
			Keys: bson.D{
				{Key: "user_id", Value: 1},
				{Key: "activity_id", Value: 1},
			},
			Options: options.Index().SetUnique(true),
		})
		if err != nil {
			log.Printf("Error creating index: %v", err)
			return struct{}{}, ErrInternalError
		}

		// Insert the check-in
		_, err = collection.InsertOne(ctx, checkIn)
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

// FindByID finds a check-in by ID
func (r *checkInRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*entity.CheckIn, error) {
	var checkIn *entity.CheckIn

	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("check_ins")
		filter := bson.M{"_id": id}

		err := collection.FindOne(ctx, filter).Decode(&checkIn)
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

	return checkIn, nil
}

// FindByUserAndActivity finds a check-in by user ID and activity ID
func (r *checkInRepository) FindByUserAndActivity(ctx context.Context, userID, activityID primitive.ObjectID) (*entity.CheckIn, error) {
	var checkIn *entity.CheckIn

	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("check_ins")
		filter := bson.M{
			"user_id":     userID,
			"activity_id": activityID,
		}

		err := collection.FindOne(ctx, filter).Decode(&checkIn)
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

	return checkIn, nil
}

// FindByUserID finds all check-ins for a specific user
func (r *checkInRepository) FindByUserID(ctx context.Context, userID primitive.ObjectID) ([]*entity.CheckIn, error) {
	var checkIns []*entity.CheckIn

	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("check_ins")
		filter := bson.M{"user_id": userID}

		cursor, err := collection.Find(ctx, filter)
		if err != nil {
			return struct{}{}, err
		}
		defer cursor.Close(ctx)

		if err := cursor.All(ctx, &checkIns); err != nil {
			return struct{}{}, err
		}

		return struct{}{}, nil
	})(ctx)

	if err != nil {
		return nil, err
	}

	return checkIns, nil
}

// FindByActivityID finds all check-ins for a specific activity
func (r *checkInRepository) FindByActivityID(ctx context.Context, activityID primitive.ObjectID) ([]*entity.CheckIn, error) {
	var checkIns []*entity.CheckIn

	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("check_ins")
		filter := bson.M{"activity_id": activityID}

		cursor, err := collection.Find(ctx, filter)
		if err != nil {
			return struct{}{}, err
		}
		defer cursor.Close(ctx)

		if err := cursor.All(ctx, &checkIns); err != nil {
			return struct{}{}, err
		}

		return struct{}{}, nil
	})(ctx)

	if err != nil {
		return nil, err
	}

	return checkIns, nil
}

// CountByActivityID counts the number of check-ins for a specific activity
func (r *checkInRepository) CountByActivityID(ctx context.Context, activityID primitive.ObjectID) (int64, error) {
	var count int64

	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("check_ins")
		filter := bson.M{"activity_id": activityID}

		var err error
		count, err = collection.CountDocuments(ctx, filter)
		if err != nil {
			return struct{}{}, err
		}

		return struct{}{}, nil
	})(ctx)

	if err != nil {
		return 0, err
	}

	return count, nil
}

// FindAll finds all check-ins
func (r *checkInRepository) FindAll(ctx context.Context) ([]*entity.CheckIn, error) {
	var checkIns []*entity.CheckIn

	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("check_ins")

		cursor, err := collection.Find(ctx, bson.M{})
		if err != nil {
			return struct{}{}, err
		}
		defer cursor.Close(ctx)

		if err := cursor.All(ctx, &checkIns); err != nil {
			return struct{}{}, err
		}

		return struct{}{}, nil
	})(ctx)

	if err != nil {
		return nil, err
	}

	return checkIns, nil
}

// DeleteCheckIn deletes a check-in by ID
func (r *checkInRepository) DeleteCheckIn(ctx context.Context, id primitive.ObjectID) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("check_ins")
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