package repository

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
)

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

// CreateUser creates a new user with timeout and transaction handling
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
	var user userPb.User
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("users")
		err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
		if err == mongo.ErrNoDocuments {
			return struct{}{}, ErrNotFound
		}
		return struct{}{}, err
	})(ctx)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByUsername finds a user by username with timeout handling
func (r *userRepository) FindByUsername(ctx context.Context, username string) (*userPb.User, error) {
	var user userPb.User
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("users")
		err := collection.FindOne(ctx, bson.M{"username": username}).Decode(&user)
		if err == mongo.ErrNoDocuments {
			return struct{}{}, ErrNotFound
		}
		return struct{}{}, err
	})(ctx)
	if err != nil {
		return nil, err
	}
	return &user, nil
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

		if err := cursor.All(ctx, &users); err != nil {
			return struct{}{}, err
		}
		return struct{}{}, nil
	})(ctx)
	if err != nil {
		return nil, err
	}
	return users, nil
}

// UpdateUser updates user information with timeout handling
func (r *userRepository) UpdateUser(ctx context.Context, user *userPb.User) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("users")
		update := bson.M{
			"$set": bson.M{
				"username":   user.Username,
				"updated_at": time.Now(),
			},
		}
		if user.Password != "" {
			update["$set"].(bson.M)["password"] = user.Password
		}
		_, err := collection.UpdateByID(ctx, user.Id, update)
		return struct{}{}, err
	})(ctx)
	return err
}

// UpdatePassword updates user password with timeout handling
func (r *userRepository) UpdatePassword(ctx context.Context, userID primitive.ObjectID, password string) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("users")
		update := bson.M{
			"$set": bson.M{
				"password":   password,
				"updated_at": time.Now(),
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

// ValidatePassword validates user password with bcrypt comparison
func (r *userRepository) ValidatePassword(ctx context.Context, username, password string) (bool, error) {
	user, err := r.FindByUsername(ctx, username)
	if err != nil {
		return false, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		if err == bcrypt.ErrMismatchedHashAndPassword {
			return false, nil
		}
		return false, err
	}
	return true, nil
} 