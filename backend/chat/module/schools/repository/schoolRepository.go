package repository

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/schools/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type SchoolRepository interface {
	Create(ctx context.Context, school *model.School) error

	GetById(ctx context.Context, id primitive.ObjectID) (*model.School, error)

	GetByName(ctx context.Context, thName, enName string) (*model.School, error)

	List(ctx context.Context, page, limit int64) ([]*model.School, int64, error)

	Update(ctx context.Context, school *model.School) error

	Delete(ctx context.Context, id primitive.ObjectID) error

	ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error)
}

type repository struct {
	db *mongo.Client
}

func NewRepository(db *mongo.Client) SchoolRepository {
	return &repository{db: db}
}

func (r *repository) dbConnect() *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *repository) Create(ctx context.Context, school *model.School) error {
	_, err := r.dbConnect().Collection("schools").InsertOne(ctx, school)
	return err
}

func (r *repository) GetById(ctx context.Context, id primitive.ObjectID) (*model.School, error) {
	var school model.School
	err := r.dbConnect().Collection("schools").FindOne(ctx, bson.M{"_id": id}).Decode(&school)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &school, nil
}

func (r *repository) GetByName(ctx context.Context, thName, enName string) (*model.School, error) {
	var school model.School
	err := r.dbConnect().Collection("schools").FindOne(ctx, bson.M{
		"name.th_name": thName,
		"name.en_name": enName,
	}).Decode(&school)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &school, nil
}

func (r *repository) List(ctx context.Context, page, limit int64) ([]*model.School, int64, error) {
	skip := (page - 1) * limit

	total, err := r.dbConnect().Collection("schools").CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, nil
	}

	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := r.dbConnect().Collection("schools").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var schools []*model.School
	if err := cursor.All(ctx, &schools); err != nil {
		return nil, 0, err
	}
	return schools, total, nil
}

func (r *repository) Update(ctx context.Context, school *model.School) error {
	_, err := r.dbConnect().Collection("schools").ReplaceOne(ctx, bson.M{"_id": school.ID}, school)
	return err
}

func (r *repository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.dbConnect().Collection("schools").DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *repository) ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error) {
	count, err := r.dbConnect().Collection("schools").CountDocuments(ctx, bson.M{"_id": id})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
