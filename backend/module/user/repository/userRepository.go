package repository

import (
	"context"
	"os/user"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
)

/**
 * UserRepositoryServicec interface
 *
 * @author Dev. Bengi (Backend Team)
 */

type (
	UserRepositoryService interface {
		CreateUser(ctx context.Context, user *user.User) error
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
	return r.db.Database("user")
}

func (r *UserRepository) CreateUser(ctx context.Context, user *user.User) error {
	ctx, cancle := context.WithTimeout(ctx, 10*time.Second)
	defer cancle()

	collection := r.db.Database("user").Collection("users")
	_, err := collection.InsertOne(ctx, user)
	if err != nil {
			return err
	}

	return nil
}