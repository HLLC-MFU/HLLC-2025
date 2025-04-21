package repository

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
)

// UserRepositoryService defines user-specific operations
type UserRepositoryService interface {
	CreateUser(ctx context.Context, user *userPb.User) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*userPb.User, error)
	FindByUsername(ctx context.Context, username string) (*userPb.User, error)
	FindAll(ctx context.Context) ([]*userPb.User, error)
	FindAllPaginated(ctx context.Context, page, limit int32) ([]*userPb.User, int32, error)
	UpdateUser(ctx context.Context, user *userPb.User) error
	UpdatePassword(ctx context.Context, userID primitive.ObjectID, password string) error
	DeleteUser(ctx context.Context, id primitive.ObjectID) error
	ValidatePassword(ctx context.Context, username, password string) (bool, error)
}

// userRepository implements user-specific operations
type userRepository struct {
	db *mongo.Client
}

// NewUserRepository creates a new user repository instance
func NewUserRepository(db *mongo.Client) UserRepositoryService {
	return &userRepository{db: db}
}

func (r *userRepository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

// CreateUser creates a new user with timeout handling
func (r *userRepository) CreateUser(ctx context.Context, user *userPb.User) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("users")
		_, err := collection.InsertOne(ctx, user)
		return struct{}{}, err
	})(ctx)
	return err
}

// FindByID finds a user by ID with timeout handling
func (r *userRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*userPb.User, error) {
	var user *userPb.User
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("users")
		result := collection.FindOne(ctx, bson.M{"_id": id})
		if result.Err() != nil {
			if result.Err() == mongo.ErrNoDocuments {
				return struct{}{}, ErrNotFound
			}
			return struct{}{}, result.Err()
		}
		
		user = &userPb.User{}
		if err := result.Decode(user); err != nil {
			return struct{}{}, err
		}
		return struct{}{}, nil
	})(ctx)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// FindByUsername finds a user by username with timeout handling
func (r *userRepository) FindByUsername(ctx context.Context, username string) (*userPb.User, error) {
	var user *userPb.User
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("users")
		result := collection.FindOne(ctx, bson.M{"username": username})
		if result.Err() != nil {
			if result.Err() == mongo.ErrNoDocuments {
				return struct{}{}, ErrNotFound
			}
			return struct{}{}, result.Err()
		}
		
		user = &userPb.User{}
		if err := result.Decode(user); err != nil {
			return struct{}{}, err
		}
		return struct{}{}, nil
	})(ctx)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// FindAll retrieves all users with timeout and cursor handling
func (r *userRepository) FindAll(ctx context.Context) ([]*userPb.User, error) {
	var users []*userPb.User
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("users")
		cursor, err := collection.Find(ctx, bson.M{})
		if err != nil {
			return struct{}{}, err
		}
		defer cursor.Close(ctx)

		// Decode the documents
		for cursor.Next(ctx) {
			user := &userPb.User{}
			if err := cursor.Decode(user); err != nil {
				return struct{}{}, err
			}
			
			// Ensure Name object is initialized
			if user.Name == nil {
				user.Name = &userPb.Name{}
			}
			
			// Ensure RoleIds is initialized
			if user.RoleIds == nil {
				user.RoleIds = []string{}
			}
			
			users = append(users, user)
		}
		
		if err := cursor.Err(); err != nil {
			return struct{}{}, err
		}
		
		return struct{}{}, nil
	})(ctx)
	if err != nil {
		return nil, err
	}
	return users, nil
}

// FindAllPaginated retrieves paginated users with timeout and cursor handling
func (r *userRepository) FindAllPaginated(ctx context.Context, page, limit int32) ([]*userPb.User, int32, error) {
	// Set defaults for pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10 // Default to 10 items per page
	}

	var users []*userPb.User
	var totalCount int32

	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("users")
		
		// Get total count first
		count, err := collection.CountDocuments(ctx, bson.M{})
		if err != nil {
			return struct{}{}, err
		}
		totalCount = int32(count)
		
		// Calculate skip value for pagination
		skip := (page - 1) * limit
		
		// Set options for pagination
		findOptions := options.Find()
		findOptions.SetSkip(int64(skip))
		findOptions.SetLimit(int64(limit))
		findOptions.SetSort(bson.M{"created_at": -1}) // Sort by newest first
		
		// Execute the find query with pagination
		cursor, err := collection.Find(ctx, bson.M{}, findOptions)
		if err != nil {
			return struct{}{}, err
		}
		defer cursor.Close(ctx)

		// Decode the documents
		for cursor.Next(ctx) {
			user := &userPb.User{}
			if err := cursor.Decode(user); err != nil {
				return struct{}{}, err
			}
			
			// Ensure Name object is initialized
			if user.Name == nil {
				user.Name = &userPb.Name{}
			}
			
			// Ensure RoleIds is initialized
			if user.RoleIds == nil {
				user.RoleIds = []string{}
			}
			
			users = append(users, user)
		}
		
		if err := cursor.Err(); err != nil {
			return struct{}{}, err
		}
		
		return struct{}{}, nil
	})(ctx)

	if err != nil {
		return nil, 0, err
	}
	
	return users, totalCount, nil
}

// UpdateUser updates user information with timeout handling
func (r *userRepository) UpdateUser(ctx context.Context, user *userPb.User) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("users")
		update := bson.M{
			"$set": bson.M{
				"username":     user.Username,
				"name":         user.Name,
				"role_ids":     user.RoleIds,
				"major_id":     user.MajorId,
				"is_activated": user.IsActivated,
				"updated_at":   time.Now().Format(time.RFC3339),
			},
		}
		_, err := collection.UpdateByID(ctx, user.Id, update)
		return struct{}{}, err
	})(ctx)
	return err
}

// UpdatePassword updates a user's password with timeout handling
func (r *userRepository) UpdatePassword(ctx context.Context, userID primitive.ObjectID, password string) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("users")
		update := bson.M{
			"$set": bson.M{
				"password":   password,
				"updated_at": time.Now().Format(time.RFC3339),
			},
		}
		_, err := collection.UpdateByID(ctx, userID, update)
		return struct{}{}, err
	})(ctx)
	return err
}

// DeleteUser deletes a user with timeout handling
func (r *userRepository) DeleteUser(ctx context.Context, id primitive.ObjectID) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("users")
		_, err := collection.DeleteOne(ctx, bson.M{"_id": id})
		return struct{}{}, err
	})(ctx)
	return err
}

// ValidatePassword checks if the provided password matches the stored one
func (r *userRepository) ValidatePassword(ctx context.Context, username, password string) (bool, error) {
	var valid bool
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		// Find the user
		user, err := r.FindByUsername(ctx, username)
		if err != nil {
			return struct{}{}, err
		}
		
		// Compare passwords
		if user.Password != password {
			return struct{}{}, nil
		}
		
		valid = true
		return struct{}{}, nil
	})(ctx)
	
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return false, nil
		}
		return false, err
	}
	
	return valid, nil
} 