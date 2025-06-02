package service

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Error string

func (e Error) Error() string { return string(e) }

func NewError(text string) error {
	return Error(text)
}

type StickerService interface {
	CreateSticker(ctx context.Context, sticker *model.Sticker) error
	GetSticker(ctx context.Context, id primitive.ObjectID) (*model.Sticker, error)
	ListStickers(ctx context.Context, page, limit int64) ([]*model.Sticker, int64, error)
	UpdateSticker(ctx context.Context, sticker *model.Sticker) error
	DeleteSticker(ctx context.Context, id primitive.ObjectID) error
}

type service struct {
	repo repository.Repository
}

func NewStickerService(repo repository.Repository) StickerService {
	return &service{
		repo: repo,
	}
}

func (s *service) CreateSticker(ctx context.Context, sticker *model.Sticker) error {

	existing, err := s.repo.GetByName(ctx, sticker.Name.Th, sticker.Name.En)
	if err != nil {
		return err
	}
	if existing != nil {
		return NewError("sticker name already exists")
	}

	if err := s.repo.Create(ctx, sticker); err != nil {
		return err
	}
	return nil
}

func (s *service) GetSticker(ctx context.Context, id primitive.ObjectID) (*model.Sticker, error) {
	return s.repo.GetById(ctx, id)
}

func (s *service) ListStickers(ctx context.Context, page, limit int64) ([]*model.Sticker, int64, error) {
	return s.repo.List(ctx, page, limit)
}

func (s *service) UpdateSticker(ctx context.Context, sticker *model.Sticker) error {
	existing, err := s.repo.GetById(ctx, sticker.ID)
	if err != nil {
		return err
	}
	if existing == nil {
		return NewError("sticker not found")
	}
	return s.repo.Update(ctx, sticker)
}

func (s *service) DeleteSticker(ctx context.Context, id primitive.ObjectID) error {
	existing, err := s.repo.GetById(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return NewError("sticker not found")
	}
	return s.repo.Delete(ctx, id)
}
