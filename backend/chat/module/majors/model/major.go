package model

import (
	"time"

	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Major struct {
	coreModel.Base `bson:",inline"`
	ID             primitive.ObjectID      `bson:"_id,omitempty" json:"id"`
	Name           coreModel.LocalizedName `bson:"name" json:"name"`
	Acronym        string                  `bson:"acronym" json:"acronym"`
	Detail         coreModel.LocalizedName `bson:"detail" json:"detail"`
	School         primitive.ObjectID      `bson:"school" json:"school"`

	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}