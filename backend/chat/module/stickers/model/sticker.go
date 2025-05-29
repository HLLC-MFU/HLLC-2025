package model

import (
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Sticker struct {
	ID    primitive.ObjectID      `bson:"_id,omitempty" json:"id"`
	Name  coreModel.LocalizedName `bson:"name" json:"name"`
	Image string                  `bson:"image,omitempty" json:"image,omitempty"`
}
