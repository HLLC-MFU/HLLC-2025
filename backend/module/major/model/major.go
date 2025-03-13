package model

import (
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/model"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Major represents a major entity
type Major struct {
	coreModel.Base  `bson:",inline"`
	ID             primitive.ObjectID     `bson:"_id,omitempty" json:"id"`
	SchoolID       primitive.ObjectID     `bson:"school_id" json:"school_id" validate:"required"`
	Name           coreModel.LocalizedName    `bson:"name" json:"name" validate:"required"`
	Acronym        string                `bson:"acronym" json:"acronym" validate:"required"`
	Details        coreModel.LocalizedDetails `bson:"details" json:"details" validate:"required"`
	Photos         coreModel.Photos          `bson:"photos" json:"photos"`
	School         *model.School         `bson:"-" json:"school,omitempty"`
	CreatedAt      time.Time             `bson:"created_at" json:"created_at"`
	UpdatedAt      time.Time             `bson:"updated_at" json:"updated_at"`
}

// Collection name decorator
var _ = coreModel.Collection("majors")

// Indexes decorator
var _ = []interface{}{
	coreModel.Index("school_id"),
	coreModel.Index("acronym"),
	coreModel.Index("name.th_name"),
	coreModel.Index("name.en_name"),
} 