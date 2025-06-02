package repository

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Repository interface {
	Create(ctx context.Context, sticker *model.Sticker) error
	GetById(ctx context.Context, id primitive.ObjectID) (*model.Sticker, error)
	List(ctx context.Context, page, limit int64) ([]*model.Sticker, int64, error)
	Update(ctx context.Context, stick *model.Sticker) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	GetByName(ctx context.Context, thName, enName string) (*model.Sticker, error)
}

type repository struct {
	db *mongo.Client
}

func NewStickerRepository(db *mongo.Client) Repository {
	return &repository{db: db}
}

func (r *repository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *repository) Create(ctx context.Context, sticker *model.Sticker) error {
	_, err := r.dbConnect(ctx).Collection("stickers").InsertOne(ctx, sticker)
	return err
}

func (r *repository) GetById(ctx context.Context, id primitive.ObjectID) (*model.Sticker, error) {
	var sticker model.Sticker
	err := r.dbConnect(ctx).Collection("stickers").FindOne(ctx, bson.M{"_id": id}).Decode(&sticker)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &sticker, nil
}

func (r *repository) List(ctx context.Context, page, limit int64) ([]*model.Sticker, int64, error) {
	skip := (page - 1) * limit

	total, err := r.dbConnect(ctx).Collection("stickers").CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, nil
	}

	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := r.dbConnect(ctx).Collection("stickers").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var stickers []*model.Sticker
	if err := cursor.All(ctx, &stickers); err != nil {
		return nil, 0, err
	}
	return stickers, total, nil
}

func (r *repository) Update(ctx context.Context, sticker *model.Sticker) error {
	_, err := r.dbConnect(ctx).Collection("stickers").ReplaceOne(ctx, bson.M{"_id": sticker.ID}, sticker)
	return err
}

func (r *repository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.dbConnect(ctx).Collection("stickers").DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *repository) GetByName(ctx context.Context, thName, enName string) (*model.Sticker, error) {
	var sticker model.Sticker
	err := r.dbConnect(ctx).Collection("stickers").FindOne(ctx, bson.M{
		"name.th_name": thName,
		"name.en_name": enName,
	}).Decode(&sticker)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &sticker, nil
}
