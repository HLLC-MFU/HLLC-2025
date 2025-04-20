package controller

import (
	"context"
	"errors"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/dto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/service"
)

// ActivityController handles the business logic and coordinates between handlers and services
type ActivityController interface {
	CreateActivity(ctx context.Context, req *dto.CreateActivityRequest) (*dto.ActivityResponse, error)
	GetActivityByID(ctx context.Context, id string) (*dto.ActivityResponse, error)
	GetActivityByCode(ctx context.Context, code string) (*dto.ActivityResponse, error)
	GetAllActivities(ctx context.Context) ([]*dto.ActivityResponse, error)
	UpdateActivity(ctx context.Context, id string, req *dto.UpdateActivityRequest) (*dto.ActivityResponse, error)
	DeleteActivity(ctx context.Context, id string) error
}

// activityController implements the ActivityController interface
type activityController struct {
	activityService service.ActivityService
}

// NewActivityController creates a new instance of ActivityController
func NewActivityController(activityService service.ActivityService) ActivityController {
	return &activityController{
		activityService: activityService,
	}
}

// CreateActivity handles the creation of a new activity
func (c *activityController) CreateActivity(ctx context.Context, req *dto.CreateActivityRequest) (*dto.ActivityResponse, error) {
	log.Printf("ActivityController: Creating new activity with code %s, type %d", req.Code, req.Type)
	
	// Validate required fields
	if req.Name.ThName == "" || req.Name.EnName == "" {
		return nil, errors.New("activity name is required in both Thai and English")
	}
	
	if req.ShortName.ThName == "" || req.ShortName.EnName == "" {
		return nil, errors.New("activity short name is required in both Thai and English")
	}
	
	if req.Code == "" {
		return nil, errors.New("activity code is required")
	}
	
	// req.Type is already validated via UnmarshalJSON in dto.CreateActivityRequest
	
	// Call service to create activity
	activity, err := c.activityService.CreateActivity(ctx, req)
	if err != nil {
		log.Printf("ActivityController: Error creating activity: %v", err)
		return nil, err
	}
	
	log.Printf("ActivityController: Successfully created activity with ID: %s", activity.ID)
	return activity, nil
}

// GetActivityByID retrieves an activity by ID
func (c *activityController) GetActivityByID(ctx context.Context, id string) (*dto.ActivityResponse, error) {
	log.Printf("ActivityController: Retrieving activity with ID: %s", id)
	
	activity, err := c.activityService.GetActivityByID(ctx, id)
	if err != nil {
		log.Printf("ActivityController: Error retrieving activity: %v", err)
		return nil, err
	}
	
	log.Printf("ActivityController: Successfully retrieved activity: %s", activity.Name.EnName)
	return activity, nil
}

// GetActivityByCode retrieves an activity by code
func (c *activityController) GetActivityByCode(ctx context.Context, code string) (*dto.ActivityResponse, error) {
	log.Printf("ActivityController: Retrieving activity with code: %s", code)
	
	activity, err := c.activityService.GetActivityByCode(ctx, code)
	if err != nil {
		log.Printf("ActivityController: Error retrieving activity: %v", err)
		return nil, err
	}
	
	log.Printf("ActivityController: Successfully retrieved activity: %s", activity.Name.EnName)
	return activity, nil
}

// GetAllActivities retrieves all activities
func (c *activityController) GetAllActivities(ctx context.Context) ([]*dto.ActivityResponse, error) {
	log.Printf("ActivityController: Retrieving all activities")
	
	activities, err := c.activityService.GetAllActivities(ctx)
	if err != nil {
		log.Printf("ActivityController: Error retrieving activities: %v", err)
		return nil, err
	}
	
	log.Printf("ActivityController: Successfully retrieved %d activities", len(activities))
	return activities, nil
}

// UpdateActivity updates an existing activity
func (c *activityController) UpdateActivity(ctx context.Context, id string, req *dto.UpdateActivityRequest) (*dto.ActivityResponse, error) {
	log.Printf("ActivityController: Updating activity with ID: %s", id)
	
	// Validate type if provided
	if req.Type != nil && (*req.Type < 0 || *req.Type > 1) {
		return nil, errors.New("activity type must be 0 (How To Live) or 1 (How To Learn)")
	}
	
	// Call service to update activity
	activity, err := c.activityService.UpdateActivity(ctx, id, req)
	if err != nil {
		log.Printf("ActivityController: Error updating activity: %v", err)
		return nil, err
	}
	
	log.Printf("ActivityController: Successfully updated activity: %s", activity.Name.EnName)
	return activity, nil
}

// DeleteActivity deletes an activity
func (c *activityController) DeleteActivity(ctx context.Context, id string) error {
	log.Printf("ActivityController: Deleting activity with ID: %s", id)
	
	err := c.activityService.DeleteActivity(ctx, id)
	if err != nil {
		log.Printf("ActivityController: Error deleting activity: %v", err)
		return err
	}
	
	log.Printf("ActivityController: Successfully deleted activity with ID: %s", id)
	return nil
} 