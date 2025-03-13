package service

import (
	"context"
	"errors"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	ErrMajorNotFound      = errors.New("major not found")
	ErrMajorAlreadyExists = errors.New("major already exists")
)

// Service defines the interface for major business logic
type Service interface {
	CreateMajor(ctx context.Context, major *model.Major) error
	GetMajor(ctx context.Context, id primitive.ObjectID) (*model.Major, error)
	ListMajors(ctx context.Context, page, limit int64) ([]*model.Major, int64, error)
	ListMajorsBySchool(ctx context.Context, schoolID primitive.ObjectID, page, limit int64) ([]*model.Major, int64, error)
	UpdateMajor(ctx context.Context, major *model.Major) error
	DeleteMajor(ctx context.Context, id primitive.ObjectID) error
}

type service struct {
	repo repository.Repository
}

// NewService creates a new instance of the major service
func NewService(repo repository.Repository) Service {
	return &service{
		repo: repo,
	}
}

func (s *service) CreateMajor(ctx context.Context, major *model.Major) error {
	// Check if major with same name or acronym exists
	exists, err := s.repo.ExistsByNameOrAcronym(ctx, major.Name, major.Acronym)
	if err != nil {
		return err
	}
	if exists {
		return ErrMajorAlreadyExists
	}

	// Set timestamps
	now := time.Now()
	major.CreatedAt = now
	major.UpdatedAt = now

	return s.repo.Create(ctx, major)
}

func (s *service) GetMajor(ctx context.Context, id primitive.ObjectID) (*model.Major, error) {
	major, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if major == nil {
		return nil, ErrMajorNotFound
	}
	return major, nil
}

func (s *service) ListMajors(ctx context.Context, page, limit int64) ([]*model.Major, int64, error) {
	return s.repo.List(ctx, page, limit)
}

func (s *service) ListMajorsBySchool(ctx context.Context, schoolID primitive.ObjectID, page, limit int64) ([]*model.Major, int64, error) {
	skip := (page - 1) * limit

	// Get total count for the school
	total, err := s.repo.CountBySchool(ctx, schoolID)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	majors, err := s.repo.ListBySchool(ctx, schoolID, skip, limit)
	if err != nil {
		return nil, 0, err
	}

	return majors, total, nil
}

func (s *service) UpdateMajor(ctx context.Context, major *model.Major) error {
	// Check if major exists
	exists, err := s.repo.ExistsByID(ctx, major.ID)
	if err != nil {
		return err
	}
	if !exists {
		return ErrMajorNotFound
	}

	// Check if updated name or acronym conflicts with other majors
	conflictExists, err := s.repo.ExistsByNameOrAcronymExceptID(ctx, major.Name, major.Acronym, major.ID)
	if err != nil {
		return err
	}
	if conflictExists {
		return ErrMajorAlreadyExists
	}

	// Update timestamp
	major.UpdatedAt = time.Now()

	return s.repo.Update(ctx, major)
}

func (s *service) DeleteMajor(ctx context.Context, id primitive.ObjectID) error {
	// Check if major exists
	exists, err := s.repo.ExistsByID(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return ErrMajorNotFound
	}

	return s.repo.Delete(ctx, id)
} 