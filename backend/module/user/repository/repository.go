package repository

import (
	"context"
	"time"

	contextDecorator "github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"

	userEntity "github.com/HLLC-MFU/HLLC-2025/backend/module/user/entity"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

/**
 * UserRepositoryServicec interface
 *
 * @author Dev. Bengi (Backend Team)
 */

type (
	UserRepositoryService interface {
		CreateUser(ctx context.Context, user *userEntity.User) error
		FindByUsername(ctx context.Context, username string) (*userEntity.User, error)
		UpdatePassword(ctx context.Context, userID primitive.ObjectID, password string) error
		ValidatePassword(ctx context.Context, username, password string) (bool, error)
	}
	
	UserRepository struct {
		db *mongo.Client
	}
)

func NewUserRepository(db *mongo.Client) UserRepositoryService {
	return &UserRepository{
		db: db,
	}
}

func (r *UserRepository) userDbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

// CreateUser is a function that creates a user
func (r *UserRepository) CreateUser(ctx context.Context, user *userEntity.User) error {
    return contextDecorator.WithTimeout(10*time.Second)(func(ctx context.Context) error {
        collection := r.userDbConnect(ctx).Collection("users")
        _, err := collection.InsertOne(ctx, user)
        return err
    })(ctx)
}

// FindByUsername is a function that finds a user by username
func (r *UserRepository) FindByUsername(ctx context.Context, username string) (*userEntity.User, error) {
    var result *userEntity.User
	err := contextDecorator.WithTimeout(10*time.Second)(func(ctx context.Context) error {
		collection := r.userDbConnect(ctx).Collection("users")

		var user userEntity.User
		err := collection.FindOne(ctx, bson.M{"username": username}).Decode(&user)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return nil
			}
			return err
		}

		result = &user
		return nil
	}) (ctx)

	return result, err
}

// UpdatePassword is a function that updates a user's password
func (r *UserRepository) UpdatePassword(ctx context.Context, userID primitive.ObjectID, password string) error {
    return contextDecorator.WithTimeout(10*time.Second)(func(ctx context.Context) error {
        collection := r.userDbConnect(ctx).Collection("users")

		update := bson.M{
			"$set": bson.M{
				"password": password,
				"updated_at": time.Now(),
			},
		}
		
		_, err := collection.UpdateByID(ctx, userID, update)
		return err
    })(ctx)
}

// ValidatePassword validates a user's password
func (r *UserRepository) ValidatePassword(ctx context.Context, username, password string) (bool, error) {
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