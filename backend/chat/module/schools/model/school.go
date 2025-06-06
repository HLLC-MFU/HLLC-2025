package model

import (
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type School struct {
	coreModel.Base `bson:",inline"`
	ID             primitive.ObjectID      `bson:"_id,omitempty" json:"id"`
	Name           coreModel.LocalizedName `bson:"name" json:"name"`
	Acronym        string                  `bson:"acronym" json:"acronym"`
	Detail         coreModel.LocalizedName `bson:"detail" json:"detail"`
	Photo          coreModel.Photo         `bson:"photo" json:"photo"`
}
