package repository

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type UserRepository interface {
	GetById(ctx context.Context, id primitive.ObjectID) (*model.User, error)

	GetByUsername(ctx context.Context, username string) (*model.User, error)

	ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error)

	ExistsByUsername(ctx context.Context, username string) (bool, error)

	List(ctx context.Context, page, limit int64) ([]*model.User, int64, error)

	FindByFilter(ctx context.Context, filter bson.M) ([]*model.User, error)
}

type userRepository struct {
	db *mongo.Client
}

func NewUserRepository(db *mongo.Client) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) dbConnect() *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *userRepository) GetById(ctx context.Context, id primitive.ObjectID) (*model.User, error) {
	var user model.User
	err := r.dbConnect().Collection("users").FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) List(ctx context.Context, page, limit int64) ([]*model.User, int64, error) {
	skip := (page - 1) * limit

	total, err := r.dbConnect().Collection("users").CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, nil
	}

	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := r.dbConnect().Collection("users").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var users []*model.User
	if err := cursor.All(ctx, &users); err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

func (r *userRepository) GetByUsername(ctx context.Context, username string) (*model.User, error) {
	var user model.User
	err := r.dbConnect().Collection("users").FindOne(ctx, bson.M{"username": username}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error) {
	count, err := r.dbConnect().Collection("users").CountDocuments(ctx, bson.M{"_id": id})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *userRepository) ExistsByUsername(ctx context.Context, username string) (bool, error) {
	count, err := r.dbConnect().Collection("users").CountDocuments(ctx, bson.M{"username": username})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
func (r *userRepository) FindByFilter(ctx context.Context, filter bson.M) ([]*model.User, error) {
	cursor, err := r.dbConnect().Collection("users").Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []*model.User
	if err := cursor.All(ctx, &users); err != nil {
		return nil, err
	}
	return users, nil
}
