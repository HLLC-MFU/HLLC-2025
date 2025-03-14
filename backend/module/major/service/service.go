package service

import (
	"context"
	"errors"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/repository"
	schoolPb "github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto/generated"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	ErrMajorNotFound      = errors.New("major not found")
	ErrMajorAlreadyExists = errors.New("major already exists")
	ErrSchoolNotFound     = errors.New("school not found")
)

// Service defines the interface for major business logic
type Service interface {
	CreateMajor(ctx context.Context, major *model.Major) error
	GetMajor(ctx context.Context, id primitive.ObjectID) (*model.Major, error)
	GetMajorWithSchool(ctx context.Context, id primitive.ObjectID) (*model.Major, error)
	ListMajors(ctx context.Context, page, limit int64) ([]*model.Major, int64, error)
	ListMajorsWithSchool(ctx context.Context, page, limit int64) ([]*model.Major, int64, error)
	ListMajorsBySchool(ctx context.Context, schoolID primitive.ObjectID, page, limit int64) ([]*model.Major, int64, error)
	UpdateMajor(ctx context.Context, major *model.Major) error
	DeleteMajor(ctx context.Context, id primitive.ObjectID) error
}

type service struct {
	repo         repository.Repository
	schoolClient schoolPb.SchoolServiceClient
}

// NewService creates a new instance of the major service
func NewService(repo repository.Repository, schoolClient schoolPb.SchoolServiceClient) Service {
	return &service{
		repo:         repo,
		schoolClient: schoolClient,
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

func (s *service) GetMajorWithSchool(ctx context.Context, id primitive.ObjectID) (*model.Major, error) {
	major, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if major == nil {
		return nil, ErrMajorNotFound
	}

	// Fetch school data
	schoolResp, err := s.schoolClient.GetSchool(ctx, &schoolPb.GetSchoolRequest{
		Id: major.SchoolID.Hex(),
	})
	if err != nil {
		return nil, err
	}

	// Convert school proto to model
	major.School = &coreModel.School{
		ID:      major.SchoolID,
		Name:    coreModel.LocalizedName{
			ThName: schoolResp.School.Name.ThName,
			EnName: schoolResp.School.Name.EnName,
		},
		Acronym: schoolResp.School.Acronym,
		Details: coreModel.LocalizedDetails{
			ThDetails: schoolResp.School.Details.ThDetails,
			EnDetails: schoolResp.School.Details.EnDetails,
		},
		Photos: coreModel.Photos{
			CoverPhoto:     schoolResp.School.Photos.CoverPhoto,
			BannerPhoto:    schoolResp.School.Photos.BannerPhoto,
			ThumbnailPhoto: schoolResp.School.Photos.ThumbnailPhoto,
			LogoPhoto:      schoolResp.School.Photos.LogoPhoto,
		},
	}

	return major, nil
}

func (s *service) ListMajorsWithSchool(ctx context.Context, page, limit int64) ([]*model.Major, int64, error) {
	majors, total, err := s.repo.List(ctx, page, limit)
	if err != nil {
		return nil, 0, err
	}

	// Fetch school data for each major
	for _, major := range majors {
		schoolResp, err := s.schoolClient.GetSchool(ctx, &schoolPb.GetSchoolRequest{
			Id: major.SchoolID.Hex(),
		})
		if err != nil {
			continue // Skip if school not found
		}

		major.School = &coreModel.School{
			ID:      major.SchoolID,
			Name:    coreModel.LocalizedName{
				ThName: schoolResp.School.Name.ThName,
				EnName: schoolResp.School.Name.EnName,
			},
			Acronym: schoolResp.School.Acronym,
			Details: coreModel.LocalizedDetails{
				ThDetails: schoolResp.School.Details.ThDetails,
				EnDetails: schoolResp.School.Details.EnDetails,
			},
			Photos: coreModel.Photos{
				CoverPhoto:     schoolResp.School.Photos.CoverPhoto,
				BannerPhoto:    schoolResp.School.Photos.BannerPhoto,
				ThumbnailPhoto: schoolResp.School.Photos.ThumbnailPhoto,
				LogoPhoto:      schoolResp.School.Photos.LogoPhoto,
			},
		}
	}

	return majors, total, nil
} 