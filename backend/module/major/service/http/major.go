package http

import (
	"context"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/dto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/repository"
	schoolPb "github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type (
	// MajorService defines the interface for major business logic
	MajorService interface {
		// Single operations
		CreateMajor(ctx context.Context, req *dto.CreateMajorRequest) (*dto.MajorResponse, error)
		GetMajorByID(ctx context.Context, id string) (*dto.MajorResponse, error)
		ListMajors(ctx context.Context, page, limit int64) ([]*dto.MajorResponse, int64, error)
		ListMajorsBySchool(ctx context.Context, schoolID string, page, limit int64) ([]*dto.MajorResponse, int64, error)
		UpdateMajor(ctx context.Context, id string, req *dto.UpdateMajorRequest) (*dto.MajorResponse, error)
		DeleteMajor(ctx context.Context, id string) error
		
		// Bulk operations
		// BulkCreateMajors(ctx context.Context, req *dto.BulkCreateMajorsRequest) (*dto.BulkOperationResponse, error)
		// BulkUpdateMajors(ctx context.Context, req *dto.BulkUpdateMajorsRequest) (*dto.BulkOperationResponse, error)
		// BulkDeleteMajors(ctx context.Context, req *dto.BulkDeleteMajorsRequest) (*dto.BulkOperationResponse, error)
	}

	// majorService implements MajorService
	majorService struct {
		majorRepository repository.MajorRepositoryService
		schoolClient    schoolPb.SchoolServiceClient
	}
)

// NewMajorService creates a new instance of MajorService
func NewMajorService(majorRepository repository.MajorRepositoryService, schoolClient schoolPb.SchoolServiceClient) MajorService {
	return &majorService{
		majorRepository: majorRepository,
		schoolClient:    schoolClient,
	}
}

// CreateMajor creates a new major
func (s *majorService) CreateMajor(ctx context.Context, req *dto.CreateMajorRequest) (*dto.MajorResponse, error) {
	return decorator.WithTimeout[*dto.MajorResponse](10*time.Second)(func(ctx context.Context) (*dto.MajorResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating new major",
			logging.FieldOperation, "create_major",
			logging.FieldEntity, "major",
			"school_id", req.SchoolID,
		)

		// Validate school ID
		_, err := primitive.ObjectIDFromHex(req.SchoolID)
		if err != nil {
			logger.Error("Invalid school ID format", err,
				logging.FieldOperation, "create_major",
				logging.FieldEntity, "major",
				"school_id", req.SchoolID,
			)
			return nil, exceptions.InvalidInput("invalid school ID format", err)
		}

		// Check if school exists if school client is available
		if s.schoolClient != nil {
			ctxWithTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
			defer cancel()
			
			_, err := s.schoolClient.GetSchool(ctxWithTimeout, &schoolPb.GetSchoolRequest{
				Id: req.SchoolID,
			})
			if err != nil {
				logger.Error("Failed to get school", err,
					logging.FieldOperation, "create_major",
					logging.FieldEntity, "major",
					"school_id", req.SchoolID,
				)
				return nil, exceptions.NotFound("school", req.SchoolID, err)
			}
		}

		// Convert DTO to proto
		major := req.ToProto()
		major.Id = primitive.NewObjectID().Hex()

		// Save major
		if err := s.majorRepository.Create(ctx, major); err != nil {
			logger.Error("Failed to create major", err,
				logging.FieldOperation, "create_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, major.Id,
			)
			return nil, err
		}

		logger.Info("Major created successfully",
			logging.FieldOperation, "create_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, major.Id,
		)

		// Convert to response
		return dto.ToMajorResponse(major), nil
	})(ctx)
}

// GetMajorByID retrieves a major by ID
func (s *majorService) GetMajorByID(ctx context.Context, id string) (*dto.MajorResponse, error) {
	return decorator.WithTimeout[*dto.MajorResponse](5*time.Second)(func(ctx context.Context) (*dto.MajorResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting major by ID",
			logging.FieldOperation, "get_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, id,
		)

		// Convert ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid major ID format", err,
				logging.FieldOperation, "get_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, id,
			)
			return nil, exceptions.InvalidInput("invalid major ID format", err)
		}

		// Get major
		major, err := s.majorRepository.GetByID(ctx, objectID)
		if err != nil {
			logger.Error("Failed to get major", err,
				logging.FieldOperation, "get_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		// Enrich with school data if school client is available
		if s.schoolClient != nil && major.SchoolId != "" {
			ctxWithTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
			defer cancel()
			
			schoolResp, err := s.schoolClient.GetSchool(ctxWithTimeout, &schoolPb.GetSchoolRequest{
				Id: major.SchoolId,
			})
			if err == nil && schoolResp != nil && schoolResp.School != nil {
				major.School = schoolResp.School
			} else {
				logger.Warn("Could not get school data for major",
					logging.FieldOperation, "get_major",
					logging.FieldEntity, "major",
					logging.FieldEntityID, id,
					"school_id", major.SchoolId,
				)
			}
		}

		// Convert to response
		return dto.ToMajorResponse(major), nil
	})(ctx)
}

// ListMajors retrieves all majors with pagination
func (s *majorService) ListMajors(ctx context.Context, page, limit int64) ([]*dto.MajorResponse, int64, error) {
	type Result struct {
		Majors []*dto.MajorResponse
		Total  int64
	}
	
	result, err := decorator.WithTimeout[Result](10*time.Second)(func(ctx context.Context) (Result, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Listing majors",
			logging.FieldOperation, "list_majors",
			logging.FieldEntity, "major",
			"page", page,
			"limit", limit,
		)

		// Get majors
		majors, total, err := s.majorRepository.List(ctx, page, limit)
		if err != nil {
			logger.Error("Failed to list majors", err,
				logging.FieldOperation, "list_majors",
				logging.FieldEntity, "major",
			)
			return Result{}, err
		}

		// Enrich with school data if school client is available
		if s.schoolClient != nil {
			for _, major := range majors {
				if major.SchoolId != "" {
					ctxWithTimeout, cancel := context.WithTimeout(ctx, 2*time.Second)
					schoolResp, err := s.schoolClient.GetSchool(ctxWithTimeout, &schoolPb.GetSchoolRequest{
						Id: major.SchoolId,
					})
					cancel()
					
					if err == nil && schoolResp != nil && schoolResp.School != nil {
						major.School = schoolResp.School
					}
				}
			}
		}

		// Convert to response
		return Result{
			Majors: dto.ToMajorResponses(majors),
			Total:  total,
		}, nil
	})(ctx)
	
	if err != nil {
		return nil, 0, err
	}
	
	return result.Majors, result.Total, nil
}

// ListMajorsBySchool retrieves majors for a specific school with pagination
func (s *majorService) ListMajorsBySchool(ctx context.Context, schoolID string, page, limit int64) ([]*dto.MajorResponse, int64, error) {
	type Result struct {
		Majors []*dto.MajorResponse
		Total  int64
	}
	
	result, err := decorator.WithTimeout[Result](10*time.Second)(func(ctx context.Context) (Result, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Listing majors by school",
			logging.FieldOperation, "list_majors_by_school",
			logging.FieldEntity, "major",
			"school_id", schoolID,
			"page", page,
			"limit", limit,
		)

		// Convert school ID to ObjectID
		schoolObjectID, err := primitive.ObjectIDFromHex(schoolID)
		if err != nil {
			logger.Error("Invalid school ID format", err,
				logging.FieldOperation, "list_majors_by_school",
				logging.FieldEntity, "major",
				"school_id", schoolID,
			)
			return Result{}, exceptions.InvalidInput("invalid school ID format", err)
		}

		// Check if school exists if school client is available
		var school *schoolPb.School
		if s.schoolClient != nil {
			ctxWithTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
			defer cancel()
			
			schoolResp, err := s.schoolClient.GetSchool(ctxWithTimeout, &schoolPb.GetSchoolRequest{
				Id: schoolID,
			})
			if err != nil {
				logger.Warn("School not found or service unavailable",
					logging.FieldOperation, "list_majors_by_school",
					logging.FieldEntity, "major",
					"school_id", schoolID,
				)
			} else if schoolResp != nil {
				school = schoolResp.School
			}
		}

		// Get majors by school
		majors, total, err := s.majorRepository.ListBySchool(ctx, schoolObjectID, page, limit)
		if err != nil {
			logger.Error("Failed to list majors by school", err,
				logging.FieldOperation, "list_majors_by_school",
				logging.FieldEntity, "major",
				"school_id", schoolID,
			)
			return Result{}, err
		}

		// Add school data to majors
		if school != nil {
			for _, major := range majors {
				major.School = school
			}
		}

		// Convert to response
		return Result{
			Majors: dto.ToMajorResponses(majors),
			Total:  total,
		}, nil
	})(ctx)
	
	if err != nil {
		return nil, 0, err
	}
	
	return result.Majors, result.Total, nil
}

// UpdateMajor updates an existing major
func (s *majorService) UpdateMajor(ctx context.Context, id string, req *dto.UpdateMajorRequest) (*dto.MajorResponse, error) {
	return decorator.WithTimeout[*dto.MajorResponse](10*time.Second)(func(ctx context.Context) (*dto.MajorResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Updating major",
			logging.FieldOperation, "update_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, id,
		)

		// Convert ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid major ID format", err,
				logging.FieldOperation, "update_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, id,
			)
			return nil, exceptions.InvalidInput("invalid major ID format", err)
		}

		// Get existing major
		existingMajor, err := s.majorRepository.GetByID(ctx, objectID)
		if err != nil {
			logger.Error("Failed to get existing major", err,
				logging.FieldOperation, "update_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		// Update fields
		existingMajor.Name.Th = req.Name.ThName
		existingMajor.Name.En = req.Name.EnName
		existingMajor.Acronym.Th = req.Acronym.ThAcronym
		existingMajor.Acronym.En = req.Acronym.EnAcronym
		existingMajor.Details.Th = req.Details.ThDetails
		existingMajor.Details.En = req.Details.EnDetails
		
		// Update photos
		existingMajor.Photos.CoverPhoto = req.Photos.CoverPhoto
		existingMajor.Photos.BannerPhoto = req.Photos.BannerPhoto
		existingMajor.Photos.ThumbnailPhoto = req.Photos.ThumbnailPhoto
		existingMajor.Photos.LogoPhoto = req.Photos.LogoPhoto
		
		// Update timestamp
		existingMajor.UpdatedAt = timestamppb.Now()

		// Update major
		if err := s.majorRepository.Update(ctx, existingMajor); err != nil {
			logger.Error("Failed to update major", err,
				logging.FieldOperation, "update_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		logger.Info("Major updated successfully",
			logging.FieldOperation, "update_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, id,
		)

		// Get school data if available
		if s.schoolClient != nil && existingMajor.SchoolId != "" {
			ctxWithTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
			defer cancel()
			
			schoolResp, err := s.schoolClient.GetSchool(ctxWithTimeout, &schoolPb.GetSchoolRequest{
				Id: existingMajor.SchoolId,
			})
			if err == nil && schoolResp != nil && schoolResp.School != nil {
				existingMajor.School = schoolResp.School
			}
		}

		// Convert to response
		return dto.ToMajorResponse(existingMajor), nil
	})(ctx)
}

// DeleteMajor deletes a major
func (s *majorService) DeleteMajor(ctx context.Context, id string) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deleting major",
			logging.FieldOperation, "delete_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, id,
		)

		// Convert ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid major ID format", err,
				logging.FieldOperation, "delete_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, id,
			)
			return struct{}{}, exceptions.InvalidInput("invalid major ID format", err)
		}

		// Delete major
		if err := s.majorRepository.Delete(ctx, objectID); err != nil {
			logger.Error("Failed to delete major", err,
				logging.FieldOperation, "delete_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, id,
			)
			return struct{}{}, err
		}

		logger.Info("Major deleted successfully",
			logging.FieldOperation, "delete_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, id,
		)

		return struct{}{}, nil
	})(ctx)
	
	return err
} 