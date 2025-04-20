package controller

import (
	"context"
	"errors"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/dto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
)

// CheckInController defines the interface for check-in controller operations
type CheckInController interface {
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

// checkInController implements CheckInController
type checkInController struct {
	checkInService service.CheckInService
}

// NewCheckInController creates a new instance of CheckInController
func NewCheckInController(checkInService service.CheckInService) CheckInController {
	return &checkInController{
		checkInService: checkInService,
	}
}

// CreateCheckIn handles the creation of a new check-in
func (c *checkInController) CreateCheckIn(ctx context.Context, req *dto.CreateCheckInRequest) (*dto.CheckInResponse, error) {
	return decorator.WithGenericLogging[*dto.CheckInResponse](
		func(ctx context.Context) (*dto.CheckInResponse, error) {
			// Validate request
			if req.UserID == "" {
				return nil, errors.New("user ID is required")
			}
			if req.ActivityID == "" {
				return nil, errors.New("activity ID is required")
			}
			if req.StaffID == "" {
				return nil, errors.New("staff ID is required")
			}

			// Call service
			return c.checkInService.CreateCheckIn(ctx, req)
		},
		"CheckInController.CreateCheckIn",
	)(ctx)
}

// GetCheckInByID retrieves a check-in by ID
func (c *checkInController) GetCheckInByID(ctx context.Context, id string) (*dto.CheckInResponse, error) {
	return decorator.WithGenericLogging[*dto.CheckInResponse](
		func(ctx context.Context) (*dto.CheckInResponse, error) {
			// Validate ID
			if id == "" {
				return nil, errors.New("check-in ID is required")
			}

			// Call service
			return c.checkInService.GetCheckInByID(ctx, id)
		},
		"CheckInController.GetCheckInByID",
	)(ctx)
}

// GetCheckInsByUserID retrieves all check-ins for a user
func (c *checkInController) GetCheckInsByUserID(ctx context.Context, userID string) ([]*dto.CheckInResponse, error) {
	return decorator.WithGenericLogging[[]*dto.CheckInResponse](
		func(ctx context.Context) ([]*dto.CheckInResponse, error) {
			// Validate user ID
			if userID == "" {
				return nil, errors.New("user ID is required")
			}

			// Call service
			return c.checkInService.GetCheckInsByUserID(ctx, userID)
		},
		"CheckInController.GetCheckInsByUserID",
	)(ctx)
}

// GetCheckInsByActivityID retrieves all check-ins for an activity
func (c *checkInController) GetCheckInsByActivityID(ctx context.Context, activityID string) ([]*dto.CheckInResponse, error) {
	return decorator.WithGenericLogging[[]*dto.CheckInResponse](
		func(ctx context.Context) ([]*dto.CheckInResponse, error) {
			// Validate activity ID
			if activityID == "" {
				return nil, errors.New("activity ID is required")
			}

			// Call service
			return c.checkInService.GetCheckInsByActivityID(ctx, activityID)
		},
		"CheckInController.GetCheckInsByActivityID",
	)(ctx)
}

// GetActivityStats retrieves statistics for an activity
func (c *checkInController) GetActivityStats(ctx context.Context, activityID string) (*dto.CheckInStatsResponse, error) {
	return decorator.WithGenericLogging[*dto.CheckInStatsResponse](
		func(ctx context.Context) (*dto.CheckInStatsResponse, error) {
			// Validate activity ID
			if activityID == "" {
				return nil, errors.New("activity ID is required")
			}

			// Call service
			return c.checkInService.GetActivityStats(ctx, activityID)
		},
		"CheckInController.GetActivityStats",
	)(ctx)
}

// GetAllCheckIns retrieves all check-ins
func (c *checkInController) GetAllCheckIns(ctx context.Context) ([]*dto.CheckInResponse, error) {
	return decorator.WithGenericLogging[[]*dto.CheckInResponse](
		func(ctx context.Context) ([]*dto.CheckInResponse, error) {
			// Call service
			return c.checkInService.GetAllCheckIns(ctx)
		},
		"CheckInController.GetAllCheckIns",
	)(ctx)
}

// DeleteCheckIn deletes a check-in
func (c *checkInController) DeleteCheckIn(ctx context.Context, id string) error {
	_, err := decorator.WithGenericLogging[struct{}](
		func(ctx context.Context) (struct{}, error) {
			// Validate ID
			if id == "" {
				return struct{}{}, errors.New("check-in ID is required")
			}

			// Call service
			err := c.checkInService.DeleteCheckIn(ctx, id)
			return struct{}{}, err
		},
		"CheckInController.DeleteCheckIn",
	)(ctx)

	return err
}

// BulkCheckIn performs bulk check-in for multiple users
func (c *checkInController) BulkCheckIn(ctx context.Context, req *dto.BulkCheckInRequest) (*dto.BulkCheckInResponse, error) {
	return decorator.WithGenericLogging[*dto.BulkCheckInResponse](
		func(ctx context.Context) (*dto.BulkCheckInResponse, error) {
			// Validate request
			if len(req.UserIDs) == 0 {
				return nil, errors.New("at least one user ID is required")
			}
			if req.ActivityID == "" {
				return nil, errors.New("activity ID is required")
			}
			if req.StaffID == "" {
				return nil, errors.New("staff ID is required")
			}

			// Call service
			return c.checkInService.BulkCheckIn(ctx, req)
		},
		"CheckInController.BulkCheckIn",
	)(ctx)
}

// GetUserActivityStatus retrieves the status of a user for an activity
func (c *checkInController) GetUserActivityStatus(ctx context.Context, userID, activityID string) (*dto.UserActivityStatusResponse, error) {
	return decorator.WithGenericLogging[*dto.UserActivityStatusResponse](
		func(ctx context.Context) (*dto.UserActivityStatusResponse, error) {
			// Validate IDs
			if userID == "" {
				return nil, errors.New("user ID is required")
			}
			if activityID == "" {
				return nil, errors.New("activity ID is required")
			}

			// Call service
			return c.checkInService.GetUserActivityStatus(ctx, userID, activityID)
		},
		"CheckInController.GetUserActivityStatus",
	)(ctx)
} 