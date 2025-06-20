package service

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/schools/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/schools/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Error string

func (e Error) Error() string { return string(e) }

func NewError(text string) error {
	return Error(text)
}

type SchoolService interface {
	GetSchool(ctx context.Context, id primitive.ObjectID) (*model.School, error)
	ListSchools(ctx context.Context, page, limit int64) ([]*model.School, int64, error)
	ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error)
}

type service struct {
	repo repository.SchoolRepository
}

func NewService(repo repository.SchoolRepository) SchoolService {
	return &service{
		repo: repo,
	}
}

func (s *service) GetSchool(ctx context.Context, id primitive.ObjectID) (*model.School, error) {
	return s.repo.GetById(ctx, id)
}

func (s *service) ListSchools(ctx context.Context, page, limit int64) ([]*model.School, int64, error) {
	return s.repo.List(ctx, page, limit)
}

func (s *service) ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error) {
	return s.repo.ExistsByID(ctx, id)
}
