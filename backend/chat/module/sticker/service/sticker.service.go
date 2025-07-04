package service

import (
	"chat/module/sticker/model"
	"chat/pkg/database/queries"
	"context"

	"go.mongodb.org/mongo-driver/mongo"
)

type (
	StickerService struct {
		*queries.BaseService[model.Sticker]
	}
)

func NewStickerService(db *mongo.Database) *StickerService {
	return &StickerService{
		BaseService: queries.NewBaseService[model.Sticker](db.Collection("stickers")),
	}
}

func (s *StickerService) GetStickerById(ctx context.Context, stickerID string) (*model.Sticker, error) {
	sticker, err := s.FindOneById(ctx, stickerID)
	if err != nil {
		return nil, err
	}
	return &sticker.Data[0], nil
}

func (s *StickerService) GetAllStickers(ctx context.Context, opts queries.QueryOptions) (*queries.Response[model.Sticker], error) {
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}

	return s.FindAll(ctx, opts)
}

func (s *StickerService) CreateSticker(ctx context.Context, sticker *model.Sticker) (*model.Sticker, error) {
	result, err := s.Create(ctx, *sticker)
	if err != nil {
		return nil, err
	}
	return &result.Data[0], nil
}

func (s *StickerService) UpdateSticker(ctx context.Context, stickerID string, sticker *model.Sticker) (*model.Sticker, error) {
	result, err := s.UpdateById(ctx, stickerID, *sticker)
	if err != nil {
		return nil, err
	}
	return &result.Data[0], nil
}

func (s *StickerService) DeleteSticker(ctx context.Context, stickerID string) (*model.Sticker, error) {
	result, err := s.DeleteById(ctx, stickerID)
	if err != nil {
		return nil, err
	}
	return &result.Data[0], nil
}
