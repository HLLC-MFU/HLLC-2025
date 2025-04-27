package http

import (
	"context"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/dto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/proto/generated"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type (
	// SchoolService defines the interface for school business logic
	SchoolService interface {
		// Single operations
		CreateSchool(ctx context.Context, req *dto.CreateSchoolRequest) (*dto.SchoolResponse, error)
		GetSchoolByID(ctx context.Context, id string) (*dto.SchoolResponse, error)
		GetSchoolByAcronym(ctx context.Context, acronym string) (*dto.SchoolResponse, error)
		ListSchools(ctx context.Context, page, limit int64) ([]*dto.SchoolResponse, int64, error)
		UpdateSchool(ctx context.Context, id string, req *dto.UpdateSchoolRequest) (*dto.SchoolResponse, error)
		DeleteSchool(ctx context.Context, id string) error
		
		// Bulk operations
		// BulkCreateSchools(ctx context.Context, req *dto.BulkCreateSchoolsRequest) (*dto.BulkOperationResponse, error)
		// BulkUpdateSchools(ctx context.Context, req *dto.BulkUpdateSchoolsRequest) (*dto.BulkOperationResponse, error)
		// BulkDeleteSchools(ctx context.Context, req *dto.BulkDeleteSchoolsRequest) (*dto.BulkOperationResponse, error)
	}

	// schoolService implements SchoolService
	schoolService struct {
		schoolRepository repository.SchoolRepositoryService
	}
)

// NewSchoolService creates a new instance of SchoolService
func NewSchoolService(schoolRepository repository.SchoolRepositoryService) SchoolService {
	return &schoolService{
		schoolRepository: schoolRepository,
	}
}

// CreateSchool creates a new school
func (s *schoolService) CreateSchool(ctx context.Context, req *dto.CreateSchoolRequest) (*dto.SchoolResponse, error) {
	return decorator.WithTimeout[*dto.SchoolResponse](10*time.Second)(func(ctx context.Context) (*dto.SchoolResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating new school",
			logging.FieldOperation, "create_school",
			logging.FieldEntity, "school",
			"acronym", req.Acronym.ThAcronym,
		)

		// Convert DTO to proto
		school := req.ToProto()
		school.Id = primitive.NewObjectID().Hex()

		// Save school
		if err := s.schoolRepository.Create(ctx, school); err != nil {
			logger.Error("Failed to create school", err,
				logging.FieldOperation, "create_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, school.Id,
			)
			return nil, err
		}

		logger.Info("School created successfully",
			logging.FieldOperation, "create_school",
			logging.FieldEntity, "school",
			logging.FieldEntityID, school.Id,
		)

		// Convert to response
		return dto.ToSchoolResponse(school), nil
	})(ctx)
}

// GetSchoolByID retrieves a school by ID
func (s *schoolService) GetSchoolByID(ctx context.Context, id string) (*dto.SchoolResponse, error) {
	return decorator.WithTimeout[*dto.SchoolResponse](5*time.Second)(func(ctx context.Context) (*dto.SchoolResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting school by ID",
			logging.FieldOperation, "get_school",
			logging.FieldEntity, "school",
			logging.FieldEntityID, id,
		)

		// Convert ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid school ID format", err,
				logging.FieldOperation, "get_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, id,
			)
			return nil, exceptions.InvalidInput("invalid school ID format", err)
		}

		// Get school
		school, err := s.schoolRepository.GetByID(ctx, objectID)
		if err != nil {
			logger.Error("Failed to get school", err,
				logging.FieldOperation, "get_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		// Convert to response
		return dto.ToSchoolResponse(school), nil
	})(ctx)
}

// GetSchoolByAcronym retrieves a school by acronym
func (s *schoolService) GetSchoolByAcronym(ctx context.Context, acronym string) (*dto.SchoolResponse, error) {
	return decorator.WithTimeout[*dto.SchoolResponse](5*time.Second)(func(ctx context.Context) (*dto.SchoolResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting school by acronym",
			logging.FieldOperation, "get_school_by_acronym",
			logging.FieldEntity, "school",
			"acronym", acronym,
		)

		// Get school
		school, err := s.schoolRepository.GetByAcronym(ctx, acronym)
		if err != nil {
			logger.Error("Failed to get school by acronym", err,
				logging.FieldOperation, "get_school_by_acronym",
				logging.FieldEntity, "school",
				"acronym", acronym,
			)
			return nil, err
		}

		// Convert to response
		return dto.ToSchoolResponse(school), nil
	})(ctx)
}

// ListSchools retrieves all schools with pagination
func (s *schoolService) ListSchools(ctx context.Context, page, limit int64) ([]*dto.SchoolResponse, int64, error) {
	type Result struct {
		Schools []*dto.SchoolResponse
		Total   int64
	}
	
	result, err := decorator.WithTimeout[Result](10*time.Second)(func(ctx context.Context) (Result, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Listing schools",
			logging.FieldOperation, "list_schools",
			logging.FieldEntity, "school",
			"page", page,
			"limit", limit,
		)

		// Get schools
		schools, total, err := s.schoolRepository.List(ctx, page, limit)
		if err != nil {
			logger.Error("Failed to list schools", err,
				logging.FieldOperation, "list_schools",
				logging.FieldEntity, "school",
			)
			return Result{}, err
		}

		// Convert to response
		return Result{
			Schools: dto.ToSchoolResponses(schools),
			Total:   total,
		}, nil
	})(ctx)
	
	if err != nil {
		return nil, 0, err
	}
	
	return result.Schools, result.Total, nil
}

// UpdateSchool updates an existing school
func (s *schoolService) UpdateSchool(ctx context.Context, id string, req *dto.UpdateSchoolRequest) (*dto.SchoolResponse, error) {
	return decorator.WithTimeout[*dto.SchoolResponse](10*time.Second)(func(ctx context.Context) (*dto.SchoolResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Updating school",
			logging.FieldOperation, "update_school",
			logging.FieldEntity, "school",
			logging.FieldEntityID, id,
		)

		// Convert ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid school ID format", err,
				logging.FieldOperation, "update_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, id,
			)
			return nil, exceptions.InvalidInput("invalid school ID format", err)
		}

		// Get existing school
		existingSchool, err := s.schoolRepository.GetByID(ctx, objectID)
		if err != nil {
			logger.Error("Failed to get existing school", err,
				logging.FieldOperation, "update_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		// Update fields
		existingSchool.Name.Th = req.Name.ThName
		existingSchool.Name.En = req.Name.EnName
		existingSchool.Acronym.Th = req.Acronym.ThAcronym
		existingSchool.Acronym.En = req.Acronym.EnAcronym
		existingSchool.Details.Th = req.Details.ThDetails
		existingSchool.Details.En = req.Details.EnDetails
		
		// Update photos
		if existingSchool.Photos == nil {
			existingSchool.Photos = &generated.Photos{}
		}
		existingSchool.Photos.CoverPhoto = req.Photos.CoverPhoto
		existingSchool.Photos.BannerPhoto = req.Photos.BannerPhoto
		existingSchool.Photos.ThumbnailPhoto = req.Photos.ThumbnailPhoto
		existingSchool.Photos.LogoPhoto = req.Photos.LogoPhoto
		
		// Update timestamp
		existingSchool.UpdatedAt = timestamppb.Now()

		// Update school
		if err := s.schoolRepository.Update(ctx, existingSchool); err != nil {
			logger.Error("Failed to update school", err,
				logging.FieldOperation, "update_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		logger.Info("School updated successfully",
			logging.FieldOperation, "update_school",
			logging.FieldEntity, "school",
			logging.FieldEntityID, id,
		)

		// Convert to response
		return dto.ToSchoolResponse(existingSchool), nil
	})(ctx)
}

// DeleteSchool deletes a school
func (s *schoolService) DeleteSchool(ctx context.Context, id string) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deleting school",
			logging.FieldOperation, "delete_school",
			logging.FieldEntity, "school",
			logging.FieldEntityID, id,
		)

		// Convert ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid school ID format", err,
				logging.FieldOperation, "delete_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, id,
			)
			return struct{}{}, exceptions.InvalidInput("invalid school ID format", err)
		}

		// Delete school
		if err := s.schoolRepository.Delete(ctx, objectID); err != nil {
			logger.Error("Failed to delete school", err,
				logging.FieldOperation, "delete_school",
				logging.FieldEntity, "school",
				logging.FieldEntityID, id,
			)
			return struct{}{}, err
		}

		logger.Info("School deleted successfully",
			logging.FieldOperation, "delete_school",
			logging.FieldEntity, "school",
			logging.FieldEntityID, id,
		)

		return struct{}{}, nil
	})(ctx)
	
	return err
}

// BulkCreateSchools creates multiple schools in one operation
// func (s *schoolService) BulkCreateSchools(ctx context.Context, req *dto.BulkCreateSchoolsRequest) (*dto.BulkOperationResponse, error) {
// 	return decorator.WithTimeout[*dto.BulkOperationResponse](30*time.Second)(func(ctx context.Context) (*dto.BulkOperationResponse, error) {
// 		logger := logging.DefaultLogger.WithContext(ctx)
// 		logger.Info("Bulk creating schools",
// 			logging.FieldOperation, "bulk_create_schools",
// 			logging.FieldEntity, "school",
// 			"count", len(req.Schools),
// 		)

// 		// Convert DTOs to protos
// 		schools := make([]*schoolPb.School, 0, len(req.Schools))
// 		for _, reqSchool := range req.Schools {
// 			school := reqSchool.ToProto()
// 			school.Id = primitive.NewObjectID().Hex()
// 			schools = append(schools, school)
// 		}

// 		// Save schools in bulk
// 		failedIDs, err := s.schoolRepository.BulkCreate(ctx, schools)
// 		if err != nil {
// 			logger.Error("Failed to bulk create schools", err,
// 				logging.FieldOperation, "bulk_create_schools",
// 				logging.FieldEntity, "school",
// 			)
			
// 			return &dto.BulkOperationResponse{
// 				Success:      false,
// 				Count:        0,
// 				FailedIDs:    failedIDs,
// 				ErrorMessage: err.Error(),
// 			}, nil
// 		}

// 		// Check if all succeeded
// 		successCount := len(schools) - len(failedIDs)
// 		success := len(failedIDs) == 0
		
// 		logger.Info("Bulk schools creation completed",
// 			logging.FieldOperation, "bulk_create_schools",
// 			logging.FieldEntity, "school",
// 			"success_count", successCount,
// 			"failed_count", len(failedIDs),
// 		)

// 		return &dto.BulkOperationResponse{
// 			Success:      success,
// 			Count:        successCount,
// 			FailedIDs:    failedIDs,
// 			ErrorMessage: "",
// 		}, nil
// 	})(ctx)
// }

// // BulkUpdateSchools updates multiple schools in one operation
// func (s *schoolService) BulkUpdateSchools(ctx context.Context, req *dto.BulkUpdateSchoolsRequest) (*dto.BulkOperationResponse, error) {
// 	return decorator.WithTimeout[*dto.BulkOperationResponse](30*time.Second)(func(ctx context.Context) (*dto.BulkOperationResponse, error) {
// 		logger := logging.DefaultLogger.WithContext(ctx)
// 		logger.Info("Bulk updating schools",
// 			logging.FieldOperation, "bulk_update_schools",
// 			logging.FieldEntity, "school",
// 			"count", len(req.Schools),
// 		)

// 		// Prepare updates
// 		var wg sync.WaitGroup
// 		var mu sync.Mutex
// 		updates := make([]*schoolPb.School, 0, len(req.Schools))
// 		failedIDs := make([]string, 0)

// 		// First fetch all schools to update
// 		for _, reqSchool := range req.Schools {
// 			wg.Add(1)
			
// 			// Create a copy of reqSchool to use in goroutine
// 			schoolReq := reqSchool
			
// 			go func() {
// 				defer wg.Done()
				
// 				objectID, err := primitive.ObjectIDFromHex(schoolReq.ID)
// 				if err != nil {
// 					mu.Lock()
// 					failedIDs = append(failedIDs, schoolReq.ID)
// 					mu.Unlock()
// 					return
// 				}
				
// 				// Get existing school
// 				existingSchool, err := s.schoolRepository.GetByID(ctx, objectID)
// 				if err != nil {
// 					mu.Lock()
// 					failedIDs = append(failedIDs, schoolReq.ID)
// 					mu.Unlock()
// 					return
// 				}
				
// 				// Update fields
// 				existingSchool.Name.Th = schoolReq.Name.ThName
// 				existingSchool.Name.En = schoolReq.Name.EnName
// 				existingSchool.Acronym.Th = schoolReq.Acronym.ThAcronym
// 				existingSchool.Acronym.En = schoolReq.Acronym.EnAcronym
// 				existingSchool.Details.Th = schoolReq.Details.ThDetails
// 				existingSchool.Details.En = schoolReq.Details.EnDetails
				
// 				// Update photos
// 				if existingSchool.Photos == nil {
// 					existingSchool.Photos = &generated.Photos{}
// 				}
// 				existingSchool.Photos.CoverPhoto = schoolReq.Photos.CoverPhoto
// 				existingSchool.Photos.BannerPhoto = schoolReq.Photos.BannerPhoto
// 				existingSchool.Photos.ThumbnailPhoto = schoolReq.Photos.ThumbnailPhoto
// 				existingSchool.Photos.LogoPhoto = schoolReq.Photos.LogoPhoto
				
// 				// Update timestamp
// 				existingSchool.UpdatedAt = timestamppb.Now()
				
// 				mu.Lock()
// 				updates = append(updates, existingSchool)
// 				mu.Unlock()
// 			}()
// 		}
		
// 		wg.Wait()

// 		// Check if any schools failed to be found
// 		if len(updates) == 0 {
// 			logger.Error("No schools could be updated", nil,
// 				logging.FieldOperation, "bulk_update_schools",
// 				logging.FieldEntity, "school",
// 			)
			
// 			return &dto.BulkOperationResponse{
// 				Success:      false,
// 				Count:        0,
// 				FailedIDs:    failedIDs,
// 				ErrorMessage: "No schools could be updated",
// 			}, nil
// 		}

// 		// Perform bulk update
// 		updateFailedIDs, err := s.schoolRepository.BulkUpdate(ctx, updates)
// 		if err != nil {
// 			logger.Error("Failed to bulk update schools", err,
// 				logging.FieldOperation, "bulk_update_schools",
// 				logging.FieldEntity, "school",
// 			)
			
// 			// Combine failed IDs
// 			failedIDs = append(failedIDs, updateFailedIDs...)
			
// 			return &dto.BulkOperationResponse{
// 				Success:      false,
// 				Count:        len(updates) - len(updateFailedIDs),
// 				FailedIDs:    failedIDs,
// 				ErrorMessage: err.Error(),
// 			}, nil
// 		}

// 		// Check if all succeeded
// 		successCount := len(updates) - len(updateFailedIDs)
// 		success := len(failedIDs) == 0 && len(updateFailedIDs) == 0
		
// 		// Combine failed IDs
// 		failedIDs = append(failedIDs, updateFailedIDs...)
		
// 		logger.Info("Bulk schools update completed",
// 			logging.FieldOperation, "bulk_update_schools",
// 			logging.FieldEntity, "school",
// 			"success_count", successCount,
// 			"failed_count", len(failedIDs),
// 		)

// 		return &dto.BulkOperationResponse{
// 			Success:      success,
// 			Count:        successCount,
// 			FailedIDs:    failedIDs,
// 			ErrorMessage: "",
// 		}, nil
// 	})(ctx)
// }

// // BulkDeleteSchools deletes multiple schools in one operation
// func (s *schoolService) BulkDeleteSchools(ctx context.Context, req *dto.BulkDeleteSchoolsRequest) (*dto.BulkOperationResponse, error) {
// 	return decorator.WithTimeout[*dto.BulkOperationResponse](30*time.Second)(func(ctx context.Context) (*dto.BulkOperationResponse, error) {
// 		logger := logging.DefaultLogger.WithContext(ctx)
// 		logger.Info("Bulk deleting schools",
// 			logging.FieldOperation, "bulk_delete_schools",
// 			logging.FieldEntity, "school",
// 			"count", len(req.IDs),
// 		)

// 		// Convert IDs to ObjectIDs
// 		objectIDs := make([]primitive.ObjectID, 0, len(req.IDs))
// 		invalidIDs := make([]string, 0)
		
// 		for _, id := range req.IDs {
// 			objectID, err := primitive.ObjectIDFromHex(id)
// 			if err != nil {
// 				invalidIDs = append(invalidIDs, id)
// 				continue
// 			}
// 			objectIDs = append(objectIDs, objectID)
// 		}

// 		// Check if any IDs were invalid
// 		if len(objectIDs) == 0 {
// 			logger.Error("No valid IDs provided for deletion", nil,
// 				logging.FieldOperation, "bulk_delete_schools",
// 				logging.FieldEntity, "school",
// 			)
			
// 			return &dto.BulkOperationResponse{
// 				Success:      false,
// 				Count:        0,
// 				FailedIDs:    invalidIDs,
// 				ErrorMessage: "No valid IDs provided for deletion",
// 			}, nil
// 		}

// 		// Delete schools in bulk
// 		failedIDs, err := s.schoolRepository.BulkDelete(ctx, objectIDs)
// 		if err != nil {
// 			logger.Error("Failed to bulk delete schools", err,
// 				logging.FieldOperation, "bulk_delete_schools",
// 				logging.FieldEntity, "school",
// 			)
			
// 			// Combine invalid and failed IDs
// 			failedIDs = append(invalidIDs, failedIDs...)
			
// 			return &dto.BulkOperationResponse{
// 				Success:      false,
// 				Count:        len(objectIDs) - len(failedIDs),
// 				FailedIDs:    failedIDs,
// 				ErrorMessage: err.Error(),
// 			}, nil
// 		}

// 		// Check if all succeeded
// 		successCount := len(objectIDs) - len(failedIDs)
// 		success := len(invalidIDs) == 0 && len(failedIDs) == 0
		
// 		// Combine invalid and failed IDs
// 		failedIDs = append(invalidIDs, failedIDs...)
		
// 		logger.Info("Bulk schools deletion completed",
// 			logging.FieldOperation, "bulk_delete_schools",
// 			logging.FieldEntity, "school",
// 			"success_count", successCount,
// 			"failed_count", len(failedIDs),
// 		)

// 		return &dto.BulkOperationResponse{
// 			Success:      success,
// 			Count:        successCount,
// 			FailedIDs:    failedIDs,
// 			ErrorMessage: "",
// 		}, nil
// 	})(ctx)
// } 