package model

import (
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Room struct {
	coreModel.Base `bson:",inline"`
	ID             primitive.ObjectID      `bson:"_id" json:"id"`
	Name           coreModel.LocalizedName `bson:"name" json:"name"`
	Capacity       int                     `bson:"capacity" json:"capacity"`
	Image          string                  `bson:"image,omitempty" json:"image,omitempty"`
	Creator        primitive.ObjectID      `bson:"user_id" json:"user_id"`
}
