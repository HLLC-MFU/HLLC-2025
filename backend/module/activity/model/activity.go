package entity

import (
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ActivityType represents the type of activity
type ActivityType int

const (
	HowToLive  ActivityType = 0
	HowToLearn ActivityType = 1
)

// Activity represents the activity model in MongoDB
type Activity struct {
	ID          primitive.ObjectID  `json:"id" bson:"_id,omitempty"`
	Name        model.LocalizedName `json:"name" bson:"name"`
	ShortName   model.LocalizedName `json:"shortName" bson:"short_name"`
	Code        string              `json:"code" bson:"code"`
	Type        ActivityType        `json:"type" bson:"type"`
	Description model.LocalizedDetails `json:"description" bson:"description"`
	ShortDesc   model.LocalizedDetails `json:"shortDesc" bson:"short_desc"`
	Open        bool                `json:"open" bson:"open"`
	Progress    bool                `json:"progress" bson:"progress"`
	Show        bool                `json:"show" bson:"show"`
	Icon        string              `json:"icon" bson:"icon"`
	Banner      string              `json:"banner" bson:"banner"`
	CreatedAt   time.Time           `json:"createdAt" bson:"created_at"`
	UpdatedAt   time.Time           `json:"updatedAt" bson:"updated_at"`
} 