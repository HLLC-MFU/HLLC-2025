package dto

import (
	"encoding/json"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/entity"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// LocalizedNameRequest represents content in multiple languages for requests
type LocalizedNameRequest struct {
	ThName string `json:"thName" validate:"required"`
	EnName string `json:"enName" validate:"required"`
}

// LocalizedDetailsRequest represents details in multiple languages for requests
type LocalizedDetailsRequest struct {
	ThDetails string `json:"thDetails" validate:"required"`
	EnDetails string `json:"enDetails" validate:"required"`
}

// CreateActivityRequest represents the request to create a new activity
type CreateActivityRequest struct {
	Name        LocalizedNameRequest    `json:"name" validate:"required"`
	ShortName   LocalizedNameRequest    `json:"shortName" validate:"required"`
	Code        string                  `json:"code" validate:"required"`
	Type        int                     `json:"type" validate:"oneof=0 1"`
	Description LocalizedDetailsRequest `json:"description"`
	ShortDesc   LocalizedDetailsRequest `json:"shortDesc"`
	Open        bool                    `json:"open"`
	Progress    bool                    `json:"progress"`
	Show        bool                    `json:"show"`
	Icon        string                  `json:"icon"`
	Banner      string                  `json:"banner"`
}

// UnmarshalJSON implements custom unmarshaling to handle both "type" and "Type" fields
func (c *CreateActivityRequest) UnmarshalJSON(data []byte) error {
	type Alias CreateActivityRequest
	aux := &struct {
		Type *int `json:"Type"`
		*Alias
	}{
		Alias: (*Alias)(c),
	}
	if err := json.Unmarshal(data, aux); err != nil {
		return err
	}
	// If Type with capital T was provided, use it
	if aux.Type != nil {
		c.Type = *aux.Type
	}
	return nil
}

// UpdateActivityRequest represents the request to update an activity
type UpdateActivityRequest struct {
	Name        *LocalizedNameRequest    `json:"name"`
	ShortName   *LocalizedNameRequest    `json:"shortName"`
	Code        *string                  `json:"code"`
	Type        *int                     `json:"type" validate:"omitempty,oneof=0 1"`
	Description *LocalizedDetailsRequest `json:"description"`
	ShortDesc   *LocalizedDetailsRequest `json:"shortDesc"`
	Open        *bool                    `json:"open"`
	Progress    *bool                    `json:"progress"`
	Show        *bool                    `json:"show"`
	Icon        *string                  `json:"icon"`
	Banner      *string                  `json:"banner"`
}

// UnmarshalJSON implements custom unmarshaling to handle both "type" and "Type" fields
func (u *UpdateActivityRequest) UnmarshalJSON(data []byte) error {
	type Alias UpdateActivityRequest
	aux := &struct {
		Type *int `json:"Type"`
		*Alias
	}{
		Alias: (*Alias)(u),
	}
	if err := json.Unmarshal(data, aux); err != nil {
		return err
	}
	// If Type with capital T was provided and type with lowercase t wasn't
	if aux.Type != nil && u.Type == nil {
		u.Type = aux.Type
	}
	return nil
}

// ActivityResponse represents the response for an activity
type ActivityResponse struct {
	ID          string                 `json:"id"`
	Name        model.LocalizedName    `json:"name"`
	ShortName   model.LocalizedName    `json:"shortName"`
	Code        string                 `json:"code"`
	Type        int                    `json:"type"`
	Description model.LocalizedDetails `json:"description"`
	ShortDesc   model.LocalizedDetails `json:"shortDesc"`
	Open        bool                   `json:"open"`
	Progress    bool                   `json:"progress"`
	Show        bool                   `json:"show"`
	Icon        string                 `json:"icon"`
	Banner      string                 `json:"banner"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
}

// ConvertToEntity converts a CreateActivityRequest to an Activity entity
func (req *CreateActivityRequest) ConvertToEntity() *entity.Activity {
	return &entity.Activity{
		ID:        primitive.NewObjectID(),
		Name:      model.LocalizedName{ThName: req.Name.ThName, EnName: req.Name.EnName},
		ShortName: model.LocalizedName{ThName: req.ShortName.ThName, EnName: req.ShortName.EnName},
		Code:      req.Code,
		Type:      entity.ActivityType(req.Type),
		Description: model.LocalizedDetails{
			ThDetails: req.Description.ThDetails,
			EnDetails: req.Description.EnDetails,
		},
		ShortDesc: model.LocalizedDetails{
			ThDetails: req.ShortDesc.ThDetails,
			EnDetails: req.ShortDesc.EnDetails,
		},
		Open:      req.Open,
		Progress:  req.Progress,
		Show:      req.Show,
		Icon:      req.Icon,
		Banner:    req.Banner,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// ConvertEntityToResponse converts an Activity entity to an ActivityResponse
func ConvertEntityToResponse(activity *entity.Activity) *ActivityResponse {
	return &ActivityResponse{
		ID:          activity.ID.Hex(),
		Name:        activity.Name,
		ShortName:   activity.ShortName,
		Code:        activity.Code,
		Type:        int(activity.Type),
		Description: activity.Description,
		ShortDesc:   activity.ShortDesc,
		Open:        activity.Open,
		Progress:    activity.Progress,
		Show:        activity.Show,
		Icon:        activity.Icon,
		Banner:      activity.Banner,
		CreatedAt:   activity.CreatedAt,
		UpdatedAt:   activity.UpdatedAt,
	}
} 