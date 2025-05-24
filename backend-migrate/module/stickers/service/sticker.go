package service

import (
	"context"
	"errors"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/stickers/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrStickerNotFound = errors.New("sticker not found")
)

type StickerService interface {
	CreateSticker(ctx context.Context, sticker *model.Sticker) error
	GetSticker(ctx context.Context, id primitive.ObjectID) (*model.Sticker, error)
	ListStickers(ctx context.Context, page, limit int64) ([]*model.Sticker, int64, error)
	DeleteSticker(ctx context.Context, id primitive.ObjectID) error
	GetStickersByCategory(ctx context.Context, category string) ([]*model.Sticker, error)
}

type stickerService struct {
	db *mongo.Database
}

func NewStickerService(db *mongo.Database) StickerService {
	return &stickerService{db: db}
}

func (s *stickerService) CreateSticker(ctx context.Context, sticker *model.Sticker) error {
	sticker.CreatedAt = time.Now()
	sticker.UpdatedAt = time.Now()
	_, err := s.db.Collection("stickers").InsertOne(ctx, sticker)
	return err
}

func (s *stickerService) GetSticker(ctx context.Context, id primitive.ObjectID) (*model.Sticker, error) {
	var sticker model.Sticker
	err := s.db.Collection("stickers").FindOne(ctx, bson.M{"_id": id}).Decode(&sticker)
	if err == mongo.ErrNoDocuments {
		return nil, ErrStickerNotFound
	}
	if err != nil {
		return nil, err
	}
	return &sticker, nil
}

func (s *stickerService) ListStickers(ctx context.Context, page, limit int64) ([]*model.Sticker, int64, error) {
	skip := (page - 1) * limit
	opts := options.Find().SetSkip(skip).SetLimit(limit)

	cursor, err := s.db.Collection("stickers").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var stickers []*model.Sticker
	if err = cursor.All(ctx, &stickers); err != nil {
		return nil, 0, err
	}

	total, err := s.db.Collection("stickers").CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, err
	}

	return stickers, total, nil
}

func (s *stickerService) DeleteSticker(ctx context.Context, id primitive.ObjectID) error {
	result, err := s.db.Collection("stickers").DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}
	if result.DeletedCount == 0 {
		return ErrStickerNotFound
	}
	return nil
}

func (s *stickerService) GetStickersByCategory(ctx context.Context, category string) ([]*model.Sticker, error) {
	cursor, err := s.db.Collection("stickers").Find(ctx, bson.M{"category": category})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var stickers []*model.Sticker
	if err = cursor.All(ctx, &stickers); err != nil {
		return nil, err
	}
	return stickers, nil
} 