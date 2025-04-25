package service

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/dto"
	entity "github.com/HLLC-MFU/HLLC-2025/backend/module/activity/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	ErrNotFound      = errors.New("activity not found")
	ErrInvalidID     = errors.New("invalid activity ID")
	ErrActivityExists = errors.New("activity with this code already exists")
)

// ActivityService defines the interface for activity service operations
type ActivityService interface {
	CreateActivity(ctx context.Context, req *dto.CreateActivityRequest) (*dto.ActivityResponse, error)
	GetActivityByID(ctx context.Context, id string) (*dto.ActivityResponse, error)
	GetActivityByCode(ctx context.Context, code string) (*dto.ActivityResponse, error)
	GetAllActivities(ctx context.Context) ([]*dto.ActivityResponse, error)
	UpdateActivity(ctx context.Context, id string, req *dto.UpdateActivityRequest) (*dto.ActivityResponse, error)
	DeleteActivity(ctx context.Context, id string) error
}

// activityService implements ActivityService
type activityService struct {
	cfg      *config.Config
	activityRepo repository.ActivityRepositoryService
}

// NewActivityService creates a new instance of ActivityService
func NewActivityService(cfg *config.Config, activityRepo repository.ActivityRepositoryService) ActivityService {
	return &activityService{
		cfg:      cfg,
		activityRepo: activityRepo,
	}
}

// CreateActivity handles the creation of a new activity
func (s *activityService) CreateActivity(ctx context.Context, req *dto.CreateActivityRequest) (*dto.ActivityResponse, error) {
	return decorator.WithTimeout[*dto.ActivityResponse](10*time.Second)(func(ctx context.Context) (*dto.ActivityResponse, error) {
		log.Printf("Creating new activity with code %s", req.Code)
		
		// Convert request to entity
		activity := req.ConvertToEntity()
		
		// Save activity to repository
		if err := s.activityRepo.CreateActivity(ctx, activity); err != nil {
			if errors.Is(err, repository.ErrDuplicate) {
				log.Printf("Activity with code %s already exists", req.Code)
				return nil, ErrActivityExists
			}
			log.Printf("Error creating activity: %v", err)
			return nil, err
		}
		
		log.Printf("Successfully created activity with ID: %s", activity.ID.Hex())
		
		// Convert entity to response
		return dto.ConvertEntityToResponse(activity), nil
	})(ctx)
}

// GetActivityByID retrieves an activity by ID
func (s *activityService) GetActivityByID(ctx context.Context, id string) (*dto.ActivityResponse, error) {
	return decorator.WithTimeout[*dto.ActivityResponse](5*time.Second)(func(ctx context.Context) (*dto.ActivityResponse, error) {
		log.Printf("Retrieving activity with ID: %s", id)
		
		// Convert string ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("Invalid activity ID format: %s", id)
			return nil, ErrInvalidID
		}
		
		// Find activity by ID
		activity, err := s.activityRepo.FindByID(ctx, objectID)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				log.Printf("Activity with ID %s not found", id)
				return nil, ErrNotFound
			}
			log.Printf("Error retrieving activity: %v", err)
			return nil, err
		}
		
		log.Printf("Successfully retrieved activity: %s", activity.Name.EnName)
		
		// Convert entity to response
		return dto.ConvertEntityToResponse(activity), nil
	})(ctx)
}

// GetActivityByCode retrieves an activity by code
func (s *activityService) GetActivityByCode(ctx context.Context, code string) (*dto.ActivityResponse, error) {
	return decorator.WithTimeout[*dto.ActivityResponse](5*time.Second)(func(ctx context.Context) (*dto.ActivityResponse, error) {
		log.Printf("Retrieving activity with code: %s", code)
		
		// Find activity by code
		activity, err := s.activityRepo.FindByCode(ctx, code)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				log.Printf("Activity with code %s not found", code)
				return nil, ErrNotFound
			}
			log.Printf("Error retrieving activity: %v", err)
			return nil, err
		}
		
		log.Printf("Successfully retrieved activity: %s", activity.Name.EnName)
		
		// Convert entity to response
		return dto.ConvertEntityToResponse(activity), nil
	})(ctx)
}

// GetAllActivities retrieves all activities
func (s *activityService) GetAllActivities(ctx context.Context) ([]*dto.ActivityResponse, error) {
	return decorator.WithTimeout[[]*dto.ActivityResponse](10*time.Second)(func(ctx context.Context) ([]*dto.ActivityResponse, error) {
		log.Printf("Retrieving all activities")
		
		// Find all activities
		activities, err := s.activityRepo.FindAll(ctx)
		if err != nil {
			log.Printf("Error retrieving activities: %v", err)
			return nil, err
		}
		
		log.Printf("Successfully retrieved %d activities", len(activities))
		
		// Convert entities to responses
		responses := make([]*dto.ActivityResponse, len(activities))
		for i, activity := range activities {
			responses[i] = dto.ConvertEntityToResponse(activity)
		}
		
		return responses, nil
	})(ctx)
}

// UpdateActivity updates an existing activity
func (s *activityService) UpdateActivity(ctx context.Context, id string, req *dto.UpdateActivityRequest) (*dto.ActivityResponse, error) {
	return decorator.WithTimeout[*dto.ActivityResponse](10*time.Second)(func(ctx context.Context) (*dto.ActivityResponse, error) {
		log.Printf("Updating activity with ID: %s", id)
		
		// Convert string ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("Invalid activity ID format: %s", id)
			return nil, ErrInvalidID
		}
		
		// Find the existing activity
		activity, err := s.activityRepo.FindByID(ctx, objectID)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				log.Printf("Activity with ID %s not found", id)
				return nil, ErrNotFound
			}
			log.Printf("Error retrieving activity: %v", err)
			return nil, err
		}
		
		// Update activity fields if provided in the request
		if req.Name != nil {
			activity.Name.ThName = req.Name.ThName
			activity.Name.EnName = req.Name.EnName
		}
		
		if req.ShortName != nil {
			activity.ShortName.ThName = req.ShortName.ThName
			activity.ShortName.EnName = req.ShortName.EnName
		}
		
		if req.Code != nil {
			activity.Code = *req.Code
		}
		
		if req.Type != nil {
			activity.Type = entity.ActivityType(*req.Type)
		}
		
		if req.Description != nil {
			activity.Description.ThDetails = req.Description.ThDetails
			activity.Description.EnDetails = req.Description.EnDetails
		}
		
		if req.ShortDesc != nil {
			activity.ShortDesc.ThDetails = req.ShortDesc.ThDetails
			activity.ShortDesc.EnDetails = req.ShortDesc.EnDetails
		}
		
		if req.Open != nil {
			activity.Open = *req.Open
		}
		
		if req.Progress != nil {
			activity.Progress = *req.Progress
		}
		
		if req.Show != nil {
			activity.Show = *req.Show
		}
		
		if req.Icon != nil {
			activity.Icon = *req.Icon
		}
		
		if req.Banner != nil {
			activity.Banner = *req.Banner
		}
		
		// Update timestamp
		activity.UpdatedAt = time.Now()
		
		// Save updated activity
		if err := s.activityRepo.UpdateActivity(ctx, activity); err != nil {
			if errors.Is(err, repository.ErrDuplicate) {
				log.Printf("Activity code already exists")
				return nil, ErrActivityExists
			}
			log.Printf("Error updating activity: %v", err)
			return nil, err
		}
		
		log.Printf("Successfully updated activity: %s", activity.Name.EnName)
		
		// Convert entity to response
		return dto.ConvertEntityToResponse(activity), nil
	})(ctx)
}

// DeleteActivity deletes an activity
func (s *activityService) DeleteActivity(ctx context.Context, id string) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		log.Printf("Deleting activity with ID: %s", id)
		
		// Convert string ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("Invalid activity ID format: %s", id)
			return struct{}{}, ErrInvalidID
		}
		
		// Delete activity
		if err := s.activityRepo.DeleteActivity(ctx, objectID); err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				log.Printf("Activity with ID %s not found", id)
				return struct{}{}, ErrNotFound
			}
			log.Printf("Error deleting activity: %v", err)
			return struct{}{}, err
		}
		
		log.Printf("Successfully deleted activity with ID: %s", id)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
} 