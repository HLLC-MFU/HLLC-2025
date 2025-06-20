package repository

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MajorRepository interface {
	GetById(ctx context.Context, id primitive.ObjectID) (*model.Major, error)
	GetByName(ctx context.Context, thName, enName string) (*model.Major, error)
	List(ctx context.Context, page, limit int64) ([]*model.Major, int64, error)
	ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error)
}

type repository struct {
	db *mongo.Client
}

func NewRepository(db *mongo.Client) MajorRepository {
	return &repository{db: db}
}

func (r *repository) dbConnect() *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *repository) GetById(ctx context.Context, id primitive.ObjectID) (*model.Major, error) {
	var major model.Major
	err := r.dbConnect().Collection("majors").FindOne(ctx, bson.M{"_id": id}).Decode(&major)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	return &major, err
}

func (r *repository) GetByName(ctx context.Context, thName, enName string) (*model.Major, error) {
	var major model.Major
	err := r.dbConnect().Collection("majors").FindOne(ctx, bson.M{
		"$or": []bson.M{
			{"name.th": thName},
			{"name.en": enName},
		},
	}).Decode(&major)

	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	return &major, err
}

func (r *repository) List(ctx context.Context, page, limit int64) ([]*model.Major, int64, error) {
	skip := (page - 1) * limit
	opts := options.Find().SetSkip(skip).SetLimit(limit)

	cursor, err := r.dbConnect().Collection("majors").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var majors []*model.Major
	if err := cursor.All(ctx, &majors); err != nil {
		return nil, 0, err
	}

	count, err := r.dbConnect().Collection("majors").CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, err
	}

	return majors, count, nil
}

func (r *repository) ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error) {
	count, err := r.dbConnect().Collection("majors").CountDocuments(ctx, bson.M{"_id": id})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
