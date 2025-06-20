package repository

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/roles/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Rolerepository interface {
	List(ctx context.Context, page, limit int64) ([]*model.Role, int64, error)
	GetById(ctx context.Context, id primitive.ObjectID) (*model.Role, error)
}

type roleRepository struct {
	db *mongo.Client
}

func NewRoleRepository(db *mongo.Client) Rolerepository {
	return &roleRepository{db: db}
}

func (r *roleRepository) dbConnect() *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *roleRepository) List(ctx context.Context, page, limit int64) ([]*model.Role, int64, error) {
	skip := (page - 1) * limit

	total, err := r.dbConnect().Collection("roles").CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, nil
	}

	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := r.dbConnect().Collection("roles").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var roles []*model.Role
	if err := cursor.All(ctx, &roles); err != nil {
		return nil, 0, err
	}
	return roles, total, nil
}

func (r *roleRepository) GetById(ctx context.Context, id primitive.ObjectID) (*model.Role, error) {
	var role model.Role
	err := r.dbConnect().Collection("roles").FindOne(ctx, bson.M{"_id": id}).Decode(&role)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &role, nil
}
