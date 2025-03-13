package model

import (
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// @Collection("schools")
// @Indexes([
//   { Key: "acronym", Unique: true },
//   { Key: "name.en_name", Unique: true },
//   { Key: "name.th_name", Unique: true }
// ])
type School struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      model.LocalizedName `bson:"name" json:"name" validate:"required"`
	Acronym   string `bson:"acronym" json:"acronym" validate:"required"`
	Details   model.LocalizedDetails `bson:"details" json:"details" validate:"required"`
	Photos    model.Photos `bson:"photos" json:"photos"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
} 