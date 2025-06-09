package service

import (
	"context"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/repository"
	schoolRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/schools/repository"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Error string

func (e Error) Error() string { return string(e) }

func NewError(text string) error {
	return Error(text)
}

type MajorService interface {
	CreateMajor(ctx context.Context, major *model.Major) error
	GetMajor(ctx context.Context, id primitive.ObjectID) (*model.Major, error)
	ListMajors(ctx context.Context, page, limit int64) ([]*model.Major, int64, error)
	UpdateMajor(ctx context.Context, major *model.Major) error
	DeleteMajor(ctx context.Context, id primitive.ObjectID) error
}

type majorService struct {
	repo       repository.MajorRepository
	schoolRepo schoolRepo.SchoolRepository
}

func NewService(repo repository.MajorRepository) MajorService {
	return &majorService{
		repo: repo,
	}
}

func (s *majorService) CreateMajor(ctx context.Context, major *model.Major) error {
	now := time.Now()
	major.CreatedAt = now
	major.UpdatedAt = now

	// ตรวจสอบชื่อซ้ำ
	existing, err := s.repo.GetByName(ctx, major.Name.Th, major.Name.En)
	if err != nil {
		return err
	}
	if existing != nil {
		return NewError("major already exists")
	}
	return nil
}

func (s *majorService) GetMajor(ctx context.Context, id primitive.ObjectID) (*model.Major, error) {
	return s.repo.GetById(ctx, id)
}

func (s *majorService) ListMajors(ctx context.Context, page, limit int64) ([]*model.Major, int64, error) {
	return s.repo.List(ctx, page, limit)
}

func (s *majorService) UpdateMajor(ctx context.Context, updated *model.Major) error {
	existing, err := s.repo.GetById(ctx, updated.ID)
	if err != nil {
		return err
	}
	if existing == nil {
		return NewError("major not found")
	}

	existing.Name = updated.Name
	existing.Acronym = updated.Acronym
	existing.Detail = updated.Detail
	existing.UpdatedAt = time.Now()

	return s.repo.Update(ctx, existing)
}

func (s *majorService) DeleteMajor(ctx context.Context, id primitive.ObjectID) error {
	existing, err := s.repo.GetById(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return NewError("major not found")
	}

	return s.repo.Delete(ctx, id)
}
