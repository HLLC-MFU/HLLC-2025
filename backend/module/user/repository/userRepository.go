package repository

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/user"
	"github.com/ansel1/merry/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type UserRepository interface {
	Create(ctx context.Context, user *user.User) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*user.User, error)
	FindByUsername(ctx context.Context, username string) (*user.User, error)
	Update(ctx context.Context, user *user.User) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context, page, limit int64) ([]*user.User, int64, error)
}

type userRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewUserRepository(db *mongo.Database) UserRepository {
	return &userRepository{
		db:         db,
		collection: db.Collection("users"),
	}
}

func (r *userRepository) Create(ctx context.Context, user *user.User) error {
	_, err := r.collection.InsertOne(ctx, user)
	if err != nil {
		return merry.Wrap(err).WithHTTPCode(500)
	}
	return nil
}

func (r *userRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*user.User, error) {
	var user user.User
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return nil, merry.New("user not found").WithHTTPCode(404)
	}
	if err != nil {
		return nil, merry.Wrap(err).WithHTTPCode(500)
	}
	return &user, nil
}

func (r *userRepository) FindByUsername(ctx context.Context, username string) (*user.User, error) {
	var user user.User
	err := r.collection.FindOne(ctx, bson.M{"username": username}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return nil, merry.New("user not found").WithHTTPCode(404)
	}
	if err != nil {
		return nil, merry.Wrap(err).WithHTTPCode(500)
	}
	return &user, nil
}

func (r *userRepository) Update(ctx context.Context, user *user.User) error {
	_, err := r.collection.ReplaceOne(ctx, bson.M{"_id": user.ID}, user)
	if err != nil {
		return merry.Wrap(err).WithHTTPCode(500)
	}
	return nil
}

func (r *userRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return merry.Wrap(err).WithHTTPCode(500)
	}
	return nil
}

func (r *userRepository) List(ctx context.Context, page, limit int64) ([]*user.User, int64, error) {
	skip := (page - 1) * limit
	
	opts := options.Find().
		SetSkip(skip).
		SetLimit(limit)

	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, merry.Wrap(err).WithHTTPCode(500)
	}
	defer cursor.Close(ctx)

	var users []*user.User
	if err = cursor.All(ctx, &users); err != nil {
		return nil, 0, merry.Wrap(err).WithHTTPCode(500)
	}

	total, err := r.collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, merry.Wrap(err).WithHTTPCode(500)
	}

	return users, total, nil
} 