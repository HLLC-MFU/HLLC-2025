package service

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Service defines the interface for school business logic
type Service interface {
	CreateSchool(ctx context.Context, school *model.School) error
	GetSchool(ctx context.Context, id primitive.ObjectID) (*model.School, error)
	GetSchoolByAcronym(ctx context.Context, acronym string) (*model.School, error)
	ListSchools(ctx context.Context, page, limit int64) ([]*model.School, int64, error)
	UpdateSchool(ctx context.Context, school *model.School) error
	DeleteSchool(ctx context.Context, id primitive.ObjectID) error
}

type service struct {
	repo repository.Repository
}

// NewService creates a new instance of the school service
func NewService(repo repository.Repository) Service {
	return &service{
		repo: repo,
	}
}

func (s *service) CreateSchool(ctx context.Context, school *model.School) error {
	// Check if school with same acronym exists
	existing, err := s.repo.GetByAcronym(ctx, school.Acronym)
	if err != nil {
		return err
	}
	if existing != nil {
		return ErrSchoolAlreadyExists
	}

	return s.repo.Create(ctx, school)
}

func (s *service) GetSchool(ctx context.Context, id primitive.ObjectID) (*model.School, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) GetSchoolByAcronym(ctx context.Context, acronym string) (*model.School, error) {
	return s.repo.GetByAcronym(ctx, acronym)
}

func (s *service) ListSchools(ctx context.Context, page, limit int64) ([]*model.School, int64, error) {
	return s.repo.List(ctx, page, limit)
}

func (s *service) UpdateSchool(ctx context.Context, school *model.School) error {
	// Check if school exists
	existing, err := s.repo.GetByID(ctx, school.ID)
	if err != nil {
		return err
	}
	if existing == nil {
		return ErrSchoolNotFound
	}

	// Check if new acronym conflicts with another school
	if school.Acronym != existing.Acronym {
		conflicting, err := s.repo.GetByAcronym(ctx, school.Acronym)
		if err != nil {
			return err
		}
		if conflicting != nil && conflicting.ID != school.ID {
			return ErrSchoolAlreadyExists
		}
	}

	return s.repo.Update(ctx, school)
}

func (s *service) DeleteSchool(ctx context.Context, id primitive.ObjectID) error {
	// Check if school exists
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return ErrSchoolNotFound
	}

	return s.repo.Delete(ctx, id)
} 