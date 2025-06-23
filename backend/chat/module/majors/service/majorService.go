package service

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Error string

func (e Error) Error() string { return string(e) }

func NewError(text string) error {
	return Error(text)
}

type MajorService interface {
	GetMajor(ctx context.Context, id primitive.ObjectID) (*model.Major, error)
	ListMajors(ctx context.Context, page, limit int64) ([]*model.Major, int64, error)
}

type majorService struct {
	repo repository.MajorRepository
}

func NewService(repo repository.MajorRepository) MajorService {
	return &majorService{
		repo: repo,
	}
}

func (s *majorService) GetMajor(ctx context.Context, id primitive.ObjectID) (*model.Major, error) {
	return s.repo.GetById(ctx, id)
}

func (s *majorService) ListMajors(ctx context.Context, page, limit int64) ([]*model.Major, int64, error) {
	return s.repo.List(ctx, page, limit)
}
