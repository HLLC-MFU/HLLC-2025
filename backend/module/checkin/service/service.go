package service

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	activityRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/activity/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/dto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/entity"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/repository"
	userRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	ErrNotFound      = errors.New("check-in not found")
	ErrInvalidID     = errors.New("invalid ID format")
	ErrDuplicateCheckIn = errors.New("user already checked in to this activity")
	ErrUserNotFound  = errors.New("user not found")
	ErrActivityNotFound = errors.New("activity not found")
)

// CheckInService defines the interface for check-in service operations
type CheckInService interface {
	CreateCheckIn(ctx context.Context, req *dto.CreateCheckInRequest) (*dto.CheckInResponse, error)
	GetCheckInByID(ctx context.Context, id string) (*dto.CheckInResponse, error)
	GetCheckInsByUserID(ctx context.Context, userID string) ([]*dto.CheckInResponse, error)
	GetCheckInsByActivityID(ctx context.Context, activityID string) ([]*dto.CheckInResponse, error)
	GetActivityStats(ctx context.Context, activityID string) (*dto.CheckInStatsResponse, error)
	GetAllCheckIns(ctx context.Context) ([]*dto.CheckInResponse, error)
	DeleteCheckIn(ctx context.Context, id string) error
	BulkCheckIn(ctx context.Context, req *dto.BulkCheckInRequest) (*dto.BulkCheckInResponse, error)
	GetUserActivityStatus(ctx context.Context, userID, activityID string) (*dto.UserActivityStatusResponse, error)
}

// checkInService implements CheckInService
type checkInService struct {
	cfg            *config.Config
	checkInRepo    repository.CheckInRepositoryService
	userRepo       userRepo.UserRepositoryService
	activityRepo   activityRepo.ActivityRepositoryService
}

// NewCheckInService creates a new instance of CheckInService
func NewCheckInService(
	cfg *config.Config,
	checkInRepo repository.CheckInRepositoryService,
	userRepo userRepo.UserRepositoryService,
	activityRepo activityRepo.ActivityRepositoryService,
) CheckInService {
	return &checkInService{
		cfg:            cfg,
		checkInRepo:    checkInRepo,
		userRepo:       userRepo,
		activityRepo:   activityRepo,
	}
}

// CreateCheckIn handles the creation of a new check-in
func (s *checkInService) CreateCheckIn(ctx context.Context, req *dto.CreateCheckInRequest) (*dto.CheckInResponse, error) {
	return decorator.WithTimeout[*dto.CheckInResponse](10*time.Second)(func(ctx context.Context) (*dto.CheckInResponse, error) {
		log.Printf("Creating new check-in for user %s in activity %s", req.UserID, req.ActivityID)
		
		// Validate input IDs
		userObjID, err := primitive.ObjectIDFromHex(req.UserID)
		if err != nil {
			log.Printf("Invalid user ID format: %s", req.UserID)
			return nil, ErrInvalidID
		}

		activityObjID, err := primitive.ObjectIDFromHex(req.ActivityID)
		if err != nil {
			log.Printf("Invalid activity ID format: %s", req.ActivityID)
			return nil, ErrInvalidID
		}

		staffObjID, err := primitive.ObjectIDFromHex(req.StaffID)
		if err != nil {
			log.Printf("Invalid staff ID format: %s", req.StaffID)
			return nil, ErrInvalidID
		}

		// Check if user exists
		// Implementation depends on UserRepository interface
		
		// Check if activity exists
		// Implementation depends on ActivityRepository interface
		
		// Create check-in entity
		checkIn := entity.NewCheckIn(userObjID, activityObjID, staffObjID)
		
		// Save to repository
		err = s.checkInRepo.CreateCheckIn(ctx, checkIn)
		if err != nil {
			if errors.Is(err, repository.ErrDuplicate) {
				log.Printf("User %s already checked in to activity %s", req.UserID, req.ActivityID)
				return nil, ErrDuplicateCheckIn
			}
			log.Printf("Error creating check-in: %v", err)
			return nil, err
		}
		
		// Convert to response DTO
		response := &dto.CheckInResponse{
			ID:         checkIn.ID.Hex(),
			UserID:     checkIn.UserID.Hex(),
			ActivityID: checkIn.ActivityID.Hex(),
			StaffID:    checkIn.StaffID.Hex(),
			Timestamp:  checkIn.Timestamp,
			CreatedAt:  checkIn.CreatedAt,
			UpdatedAt:  checkIn.UpdatedAt,
		}
		
		log.Printf("Successfully created check-in with ID: %s", response.ID)
		return response, nil
	})(ctx)
}

// GetCheckInByID retrieves a check-in by ID
func (s *checkInService) GetCheckInByID(ctx context.Context, id string) (*dto.CheckInResponse, error) {
	return decorator.WithTimeout[*dto.CheckInResponse](5*time.Second)(func(ctx context.Context) (*dto.CheckInResponse, error) {
		log.Printf("Retrieving check-in with ID: %s", id)
		
		// Convert string ID to ObjectID
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("Invalid check-in ID format: %s", id)
			return nil, ErrInvalidID
		}
		
		// Find check-in by ID
		checkIn, err := s.checkInRepo.FindByID(ctx, objID)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				log.Printf("Check-in with ID %s not found", id)
				return nil, ErrNotFound
			}
			log.Printf("Error retrieving check-in: %v", err)
			return nil, err
		}
		
		// Convert to response DTO
		response := &dto.CheckInResponse{
			ID:         checkIn.ID.Hex(),
			UserID:     checkIn.UserID.Hex(),
			ActivityID: checkIn.ActivityID.Hex(),
			StaffID:    checkIn.StaffID.Hex(),
			Timestamp:  checkIn.Timestamp,
			CreatedAt:  checkIn.CreatedAt,
			UpdatedAt:  checkIn.UpdatedAt,
		}
		
		log.Printf("Successfully retrieved check-in with ID: %s", response.ID)
		return response, nil
	})(ctx)
}

// GetCheckInsByUserID retrieves all check-ins for a user
func (s *checkInService) GetCheckInsByUserID(ctx context.Context, userID string) ([]*dto.CheckInResponse, error) {
	return decorator.WithTimeout[[]*dto.CheckInResponse](10*time.Second)(func(ctx context.Context) ([]*dto.CheckInResponse, error) {
		log.Printf("Retrieving check-ins for user: %s", userID)
		
		// Convert string ID to ObjectID
		objID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			log.Printf("Invalid user ID format: %s", userID)
			return nil, ErrInvalidID
		}
		
		// Find check-ins by user ID
		checkIns, err := s.checkInRepo.FindByUserID(ctx, objID)
		if err != nil {
			log.Printf("Error retrieving check-ins for user: %v", err)
			return nil, err
		}
		
		// Convert to response DTOs
		responses := make([]*dto.CheckInResponse, len(checkIns))
		for i, checkIn := range checkIns {
			responses[i] = &dto.CheckInResponse{
				ID:         checkIn.ID.Hex(),
				UserID:     checkIn.UserID.Hex(),
				ActivityID: checkIn.ActivityID.Hex(),
				StaffID:    checkIn.StaffID.Hex(),
				Timestamp:  checkIn.Timestamp,
				CreatedAt:  checkIn.CreatedAt,
				UpdatedAt:  checkIn.UpdatedAt,
			}
		}
		
		log.Printf("Successfully retrieved %d check-ins for user %s", len(responses), userID)
		return responses, nil
	})(ctx)
}

// GetCheckInsByActivityID retrieves all check-ins for an activity
func (s *checkInService) GetCheckInsByActivityID(ctx context.Context, activityID string) ([]*dto.CheckInResponse, error) {
	return decorator.WithTimeout[[]*dto.CheckInResponse](10*time.Second)(func(ctx context.Context) ([]*dto.CheckInResponse, error) {
		log.Printf("Retrieving check-ins for activity: %s", activityID)
		
		// Convert string ID to ObjectID
		objID, err := primitive.ObjectIDFromHex(activityID)
		if err != nil {
			log.Printf("Invalid activity ID format: %s", activityID)
			return nil, ErrInvalidID
		}
		
		// Find check-ins by activity ID
		checkIns, err := s.checkInRepo.FindByActivityID(ctx, objID)
		if err != nil {
			log.Printf("Error retrieving check-ins for activity: %v", err)
			return nil, err
		}
		
		// Convert to response DTOs
		responses := make([]*dto.CheckInResponse, len(checkIns))
		for i, checkIn := range checkIns {
			responses[i] = &dto.CheckInResponse{
				ID:         checkIn.ID.Hex(),
				UserID:     checkIn.UserID.Hex(),
				ActivityID: checkIn.ActivityID.Hex(),
				StaffID:    checkIn.StaffID.Hex(),
				Timestamp:  checkIn.Timestamp,
				CreatedAt:  checkIn.CreatedAt,
				UpdatedAt:  checkIn.UpdatedAt,
			}
		}
		
		log.Printf("Successfully retrieved %d check-ins for activity %s", len(responses), activityID)
		return responses, nil
	})(ctx)
}

// GetActivityStats retrieves statistics for an activity
func (s *checkInService) GetActivityStats(ctx context.Context, activityID string) (*dto.CheckInStatsResponse, error) {
	return decorator.WithTimeout[*dto.CheckInStatsResponse](5*time.Second)(func(ctx context.Context) (*dto.CheckInStatsResponse, error) {
		log.Printf("Retrieving stats for activity: %s", activityID)
		
		// Convert string ID to ObjectID
		objID, err := primitive.ObjectIDFromHex(activityID)
		if err != nil {
			log.Printf("Invalid activity ID format: %s", activityID)
			return nil, ErrInvalidID
		}
		
		// Count check-ins for this activity
		count, err := s.checkInRepo.CountByActivityID(ctx, objID)
		if err != nil {
			log.Printf("Error retrieving activity stats: %v", err)
			return nil, err
		}
		
		// Create response
		// In a real application, you would calculate the total users and percentage
		// based on actual enrollment data for the activity
		totalUsers := int(count) + 10 // Example: add some non-checked-in users
		percentage := float64(0)
		if totalUsers > 0 {
			percentage = float64(count) / float64(totalUsers) * 100
		}
		
		response := &dto.CheckInStatsResponse{
			ActivityID: activityID,
			TotalUsers: totalUsers,
			CheckedIn:  int(count),
			Percentage: percentage,
		}
		
		log.Printf("Successfully retrieved stats for activity %s: %d/%d (%.2f%%)", 
			activityID, count, totalUsers, percentage)
		return response, nil
	})(ctx)
}

// GetAllCheckIns retrieves all check-ins
func (s *checkInService) GetAllCheckIns(ctx context.Context) ([]*dto.CheckInResponse, error) {
	return decorator.WithTimeout[[]*dto.CheckInResponse](15*time.Second)(func(ctx context.Context) ([]*dto.CheckInResponse, error) {
		log.Printf("Retrieving all check-ins")
		
		// Find all check-ins
		checkIns, err := s.checkInRepo.FindAll(ctx)
		if err != nil {
			log.Printf("Error retrieving all check-ins: %v", err)
			return nil, err
		}
		
		// Convert to response DTOs
		responses := make([]*dto.CheckInResponse, len(checkIns))
		for i, checkIn := range checkIns {
			responses[i] = &dto.CheckInResponse{
				ID:         checkIn.ID.Hex(),
				UserID:     checkIn.UserID.Hex(),
				ActivityID: checkIn.ActivityID.Hex(),
				StaffID:    checkIn.StaffID.Hex(),
				Timestamp:  checkIn.Timestamp,
				CreatedAt:  checkIn.CreatedAt,
				UpdatedAt:  checkIn.UpdatedAt,
			}
		}
		
		log.Printf("Successfully retrieved %d check-ins", len(responses))
		return responses, nil
	})(ctx)
}

// DeleteCheckIn deletes a check-in
func (s *checkInService) DeleteCheckIn(ctx context.Context, id string) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		log.Printf("Deleting check-in with ID: %s", id)
		
		// Convert string ID to ObjectID
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("Invalid check-in ID format: %s", id)
			return struct{}{}, ErrInvalidID
		}
		
		// Delete check-in
		err = s.checkInRepo.DeleteCheckIn(ctx, objID)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				log.Printf("Check-in with ID %s not found", id)
				return struct{}{}, ErrNotFound
			}
			log.Printf("Error deleting check-in: %v", err)
			return struct{}{}, err
		}
		
		log.Printf("Successfully deleted check-in with ID: %s", id)
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// BulkCheckIn performs bulk check-in for multiple users
func (s *checkInService) BulkCheckIn(ctx context.Context, req *dto.BulkCheckInRequest) (*dto.BulkCheckInResponse, error) {
	return decorator.WithTimeout[*dto.BulkCheckInResponse](20*time.Second)(func(ctx context.Context) (*dto.BulkCheckInResponse, error) {
		log.Printf("Performing bulk check-in for %d users in activity %s", len(req.UserIDs), req.ActivityID)
		
		// Validate activity ID
		activityObjID, err := primitive.ObjectIDFromHex(req.ActivityID)
		if err != nil {
			log.Printf("Invalid activity ID format: %s", req.ActivityID)
			return nil, ErrInvalidID
		}
		
		// Validate staff ID
		staffObjID, err := primitive.ObjectIDFromHex(req.StaffID)
		if err != nil {
			log.Printf("Invalid staff ID format: %s", req.StaffID)
			return nil, ErrInvalidID
		}
		
		// Check if activity exists
		// Implementation depends on ActivityRepository interface
		
		// Process each user ID
		successfulIDs := make([]string, 0, len(req.UserIDs))
		failedCheckIns := make([]dto.FailedCheckIn, 0)
		
		for _, userID := range req.UserIDs {
			// Convert user ID to ObjectID
			userObjID, err := primitive.ObjectIDFromHex(userID)
			if err != nil {
				log.Printf("Invalid user ID format: %s", userID)
				failedCheckIns = append(failedCheckIns, dto.FailedCheckIn{
					UserID: userID,
					Reason: "Invalid user ID format",
				})
				continue
			}
			
			// Check if user exists
			// Implementation depends on UserRepository interface
			
			// Create check-in entity
			checkIn := entity.NewCheckIn(userObjID, activityObjID, staffObjID)
			
			// Save to repository
			err = s.checkInRepo.CreateCheckIn(ctx, checkIn)
			if err != nil {
				if errors.Is(err, repository.ErrDuplicate) {
					log.Printf("User %s already checked in to activity %s", userID, req.ActivityID)
					failedCheckIns = append(failedCheckIns, dto.FailedCheckIn{
						UserID: userID,
						Reason: "User already checked in to this activity",
					})
				} else {
					log.Printf("Error creating check-in for user %s: %v", userID, err)
					failedCheckIns = append(failedCheckIns, dto.FailedCheckIn{
						UserID: userID,
						Reason: "Server error: " + err.Error(),
					})
				}
				continue
			}
			
			// Add to successful IDs
			successfulIDs = append(successfulIDs, userID)
		}
		
		// Create response
		response := &dto.BulkCheckInResponse{
			Successful: successfulIDs,
			Failed:     failedCheckIns,
		}
		
		log.Printf("Bulk check-in completed: %d successful, %d failed", 
			len(successfulIDs), len(failedCheckIns))
		return response, nil
	})(ctx)
}

// GetUserActivityStatus retrieves the status of a user for an activity
func (s *checkInService) GetUserActivityStatus(ctx context.Context, userID, activityID string) (*dto.UserActivityStatusResponse, error) {
	return decorator.WithTimeout[*dto.UserActivityStatusResponse](5*time.Second)(func(ctx context.Context) (*dto.UserActivityStatusResponse, error) {
		log.Printf("Retrieving status for user %s in activity %s", userID, activityID)
		
		// Convert string IDs to ObjectIDs
		userObjID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			log.Printf("Invalid user ID format: %s", userID)
			return nil, ErrInvalidID
		}
		
		activityObjID, err := primitive.ObjectIDFromHex(activityID)
		if err != nil {
			log.Printf("Invalid activity ID format: %s", activityID)
			return nil, ErrInvalidID
		}
		
		// Find check-in for this user and activity
		checkIn, err := s.checkInRepo.FindByUserAndActivity(ctx, userObjID, activityObjID)
		
		// Create response
		response := &dto.UserActivityStatusResponse{
			UserID:     userID,
			ActivityID: activityID,
			CheckedIn:  false,
			Status:     nil,
		}
		
		if err == nil && checkIn != nil {
			// User is checked in
			response.CheckedIn = true
			response.CheckInID = checkIn.ID.Hex()
			response.Timestamp = &checkIn.Timestamp
			
			// In a real application, you might fetch the actual progress status 
			// from a progress tracking service or database
			response.Status = &entity.ActivityProgress{
				Step:    1,
				Message: "User has checked in",
			}
		} else if errors.Is(err, repository.ErrNotFound) {
			// User is not checked in - this is a valid state, not an error
			log.Printf("User %s not checked in to activity %s", userID, activityID)
		} else {
			// Some other error occurred
			log.Printf("Error retrieving user activity status: %v", err)
			return nil, err
		}
		
		log.Printf("Successfully retrieved status for user %s in activity %s: checked in = %v", 
			userID, activityID, response.CheckedIn)
		return response, nil
	})(ctx)
} 