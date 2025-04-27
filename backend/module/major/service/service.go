package service

// import (
// 	"context"
// 	"errors"
// 	"log"
// 	"time"

// 	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/model"
// 	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/repository"
// 	schoolPb "github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto/generated"
// 	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
// 	"go.mongodb.org/mongo-driver/bson/primitive"
// 	"google.golang.org/protobuf/types/known/timestamppb"
// )

// var (
// 	ErrMajorNotFound      = errors.New("major not found")
// 	ErrMajorAlreadyExists = errors.New("major already exists")
// 	ErrSchoolNotFound     = errors.New("school not found")
// 	ErrSchoolServiceUnavailable = errors.New("school service unavailable")
// )

// // Service defines the interface for major business logic
// type (
// 	MajorService interface {
// 	CreateMajor(ctx context.Context, major *majorPb.Major) error
// 	GetMajor(ctx context.Context, id primitive.ObjectID) (*majorPb.Major, error)
// 	GetMajorWithSchool(ctx context.Context, id primitive.ObjectID) (*majorPb.Major, error)
// 	ListMajors(ctx context.Context, page, limit int64) ([]*majorPb.Major, int64, error)
// 	ListMajorsWithSchool(ctx context.Context, page, limit int64) ([]*majorPb.Major, int64, error)
// 	ListMajorsBySchool(ctx context.Context, schoolID primitive.ObjectID, page, limit int64) ([]*majorPb.Major, int64, error)
// 	UpdateMajor(ctx context.Context, major *majorPb.Major) error
// 	DeleteMajor(ctx context.Context, id primitive.ObjectID) error
// 	}

// 	majorService struct {
// 		repo         repository.MajorRepositoryService
// 		schoolClient schoolPb.SchoolServiceClient
// 	}
// )

// // NewService creates a new instance of the major service
// func NewMajorService(repo repository.MajorRepositoryService, schoolClient schoolPb.SchoolServiceClient) MajorService {
// 	return &majorService{
// 		repo:         repo,
// 		schoolClient: schoolClient,
// 	}
// }

// func (s *majorService) CreateMajor(ctx context.Context, major *majorPb.Major) error {
// 	// Check if major with same name or acronym exists
// 	return decorator.WithTimeout[error](5*time.Second)(func(ctx context.Context) (error) {
// 		logger := logging.DefaultLogger.WithContext(ctx)
// 		logger.Info("Creating new major",
// 			logging.FieldOperation, "create_major",
// 			logging.FieldEntity, "major",
// 		)

// 		// Convert DTO to proto
// 		major := majorPb.Major{
// 			Id: primitive.NewObjectID().Hex(),
// 			SchoolId: major.SchoolId,
// 			Name: major.Name,
// 			Acronym: major.Acronym,
// 			Details: major.Details,
// 			Photos: major.Photos,
// 		}

// 		// Save major
// 		if err := s.repo.Create(ctx, major); err != nil {
// 			logger.Error("Failed to create major", err,
// 				logging.FieldOperation, "create_major",
// 				logging.FieldEntity, "major",
// 			)
// 			return err
// 		}

// 		logger.Info("Major created successfully",
// 			logging.FieldOperation, "create_major",
// 			logging.FieldEntity, "major",
// 		)

// 		return nil
// 	})(ctx)
// }

// func (s *majorService) GetMajor(ctx context.Context, id primitive.ObjectID) (*majorPb.Major, error) {
// 	major, err := s.repo.GetByID(ctx, id)
// 	if err != nil {
// 		return nil, err
// 	}
// 	if major == nil {
// 		return nil, ErrMajorNotFound
// 	}
// 	return major, nil
// }

// func (s *majorService) ListMajors(ctx context.Context, page, limit int64) ([]*majorPb.Major, int64, error) {
// 	return s.repo.List(ctx, page, limit)
// }

// func (s *majorService) ListMajorsBySchool(ctx context.Context, schoolID primitive.ObjectID, page, limit int64) ([]*majorPb.Major, int64, error) {
// 	skip := (page - 1) * limit

// 	// Get total count for the school
// 	total, err := s.repo.CountBySchool(ctx, schoolID)
// 	if err != nil {
// 		return nil, 0, err
// 	}

// 	// Get paginated results
// 	majors, err := s.repo.ListBySchool(ctx, schoolID, skip, limit)
// 	if err != nil {
// 		return nil, 0, err
// 	}

// 	return majors, total, nil
// }

// func (s *majorService) UpdateMajor(ctx context.Context, major *majorPb.Major) error {
// 	// Check if major exists
// 	exists, err := s.repo.ExistsByID(ctx, major.Id)
// 	if err != nil {
// 		return err
// 	}
// 	if !exists {
// 		return ErrMajorNotFound
// 	}

// 	// Check if updated name or acronym conflicts with other majors
// 	conflictExists, err := s.repo.ExistsByNameOrAcronymExceptID(ctx, major.Name, major.Acronym, major.Id)
// 	if err != nil {
// 		return err
// 	}
// 	if conflictExists {
// 		return ErrMajorAlreadyExists
// 	}

// 	// Update timestamp
// 	major.UpdatedAt = timestamppb.New(time.Now())

// 	return s.repo.Update(ctx, major)
// }

// func (s *majorService) DeleteMajor(ctx context.Context, id primitive.ObjectID) error {
// 	// Check if major exists
// 	exists, err := s.repo.ExistsByID(ctx, id)
// 	if err != nil {
// 		return err
// 	}
// 	if !exists {
// 		return ErrMajorNotFound
// 	}

// 	return s.repo.Delete(ctx, id)
// }

// func (s *majorService) GetMajorWithSchool(ctx context.Context, id primitive.ObjectID) (*majorPb.Major, error) {
// 	major, err := s.repo.GetByID(ctx, id)
// 	if err != nil {
// 		return nil, err
// 	}
// 	if major == nil {
// 		return nil, ErrMajorNotFound
// 	}

// 	// Check if school client is available
// 	if s.schoolClient == nil {
// 		log.Printf("Warning: School client is unavailable when getting major with ID: %s", id.Hex())
// 		return major, ErrSchoolServiceUnavailable
// 	}

// 	// Fetch school data with timeout
// 	ctxWithTimeout, cancel := context.WithTimeout(ctx, 3*time.Second)
// 	defer cancel()

// 	schoolResp, err := s.schoolClient.GetSchool(ctxWithTimeout, &schoolPb.GetSchoolRequest{
// 		Id: major.SchoolID.Hex(),
// 	})
// 	if err != nil {
// 		log.Printf("Error fetching school data for major %s: %v", id.Hex(), err)
// 		return major, nil // Return just the major without school data
// 	}

// 	// Convert school proto to model
// 	major.School = &model.School{
// 		ID:      major.SchoolID,
// 		Name:    coreModel.LocalizedName{
// 			ThName: schoolResp.School.Name.ThName,
// 			EnName: schoolResp.School.Name.EnName,
// 		},
// 		Acronym: schoolResp.School.Acronym,
// 		Details: coreModel.LocalizedDetails{
// 			ThDetails: schoolResp.School.Details.ThDetails,
// 			EnDetails: schoolResp.School.Details.EnDetails,
// 		},
// 		Photos: coreModel.Photos{
// 			CoverPhoto:     schoolResp.School.Photos.CoverPhoto,
// 			BannerPhoto:    schoolResp.School.Photos.BannerPhoto,
// 			ThumbnailPhoto: schoolResp.School.Photos.ThumbnailPhoto,
// 			LogoPhoto:      schoolResp.School.Photos.LogoPhoto,
// 		},
// 	}

// 	return major, nil
// }

// func (s *majorService) ListMajorsWithSchool(ctx context.Context, page, limit int64) ([]*majorPb.Major, int64, error) {
// 	majors, total, err := s.repo.List(ctx, page, limit)
// 	if err != nil {
// 		return nil, 0, err
// 	}

// 	// If school client is unavailable, return majors without school data
// 	if s.schoolClient == nil {
// 		log.Println("Warning: School client is unavailable when listing majors with schools")
// 		return majors, total, nil
// 	}

// 	// Fetch school data for each major
// 	for _, major := range majors {
// 		// Use timeout for each school request
// 		ctxWithTimeout, cancel := context.WithTimeout(ctx, 2*time.Second)
// 		schoolResp, err := s.schoolClient.GetSchool(ctxWithTimeout, &schoolPb.GetSchoolRequest{
// 			Id: major.SchoolID.Hex(),
// 		})
// 		cancel() // Cancel immediately after the call

// 		if err != nil {
// 			log.Printf("Warning: Error fetching school data for major %s: %v", major.ID.Hex(), err)
// 			continue // Skip if school not found
// 		}

// 		major.School = &model.School{
// 			ID:      major.SchoolID,
// 			Name:    coreModel.LocalizedName{
// 				ThName: schoolResp.School.Name.ThName,
// 				EnName: schoolResp.School.Name.EnName,
// 			},
// 			Acronym: schoolResp.School.Acronym,
// 			Details: coreModel.LocalizedDetails{
// 				ThDetails: schoolResp.School.Details.ThDetails,
// 				EnDetails: schoolResp.School.Details.EnDetails,
// 			},
// 			Photos: coreModel.Photos{
// 				CoverPhoto:     schoolResp.School.Photos.CoverPhoto,
// 				BannerPhoto:    schoolResp.School.Photos.BannerPhoto,
// 				ThumbnailPhoto: schoolResp.School.Photos.ThumbnailPhoto,
// 				LogoPhoto:      schoolResp.School.Photos.LogoPhoto,
// 			},
// 		}
// 	}

// 	return majors, total, nil
// }