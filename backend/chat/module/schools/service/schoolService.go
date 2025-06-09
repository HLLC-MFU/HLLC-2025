package service

import (
	"context"
	"time"

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
	CreateSchool(ctx context.Context, school *model.School) error
	GetSchool(ctx context.Context, id primitive.ObjectID) (*model.School, error)
	ListSchools(ctx context.Context, page, limit int64) ([]*model.School, int64, error)
	UpdateSchool(ctx context.Context, school *model.School) error
	DeleteSchool(ctx context.Context, id primitive.ObjectID) error
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

func (s *service) CreateSchool(ctx context.Context, school *model.School) error {
	now := time.Now()
	school.CreatedAt = now
	school.UpdatedAt = now

	existing, err := s.repo.GetByName(ctx, school.Name.Th, school.Name.En)
	if err != nil {
		return err
	}
	if existing != nil {
		return NewError("school already exists")
	}

	if err := s.repo.Create(ctx, school); err != nil {
		return err
	}

	return nil
}

func (s *service) GetSchool(ctx context.Context, id primitive.ObjectID) (*model.School, error) {
	return s.repo.GetById(ctx, id)
}

func (s *service) ListSchools(ctx context.Context, page, limit int64) ([]*model.School, int64, error) {
	return s.repo.List(ctx, page, limit)
}

func (s *service) UpdateSchool(ctx context.Context, school *model.School) error {
	existing, err := s.repo.GetById(ctx, school.ID)
	if err != nil {
		return err
	}
	if existing == nil {
		return NewError("school not found")
	}

	existing.Name = school.Name
	existing.Acronym = school.Acronym
	existing.Detail = school.Detail
	existing.Photo = school.Photo
	existing.UpdatedAt = time.Now()

	return s.repo.Update(ctx, existing)
}

func (s *service) DeleteSchool(ctx context.Context, id primitive.ObjectID) error {
	return s.repo.Delete(ctx, id)
}

func (s *service) ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error) {
	return s.repo.ExistsByID(ctx, id)
}
