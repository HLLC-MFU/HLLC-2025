package model

import (
	"chat/pkg/common"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	School struct {
		ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
		Name      common.LocalizedName              `bson:"name" json:"name"`
		Acronym   string              `bson:"acronym" json:"acronym"`
		Detail    common.LocalizedName `bson:"detail" json:"detail"`
		Photo     common.Photo         `bson:"photo" json:"photo"`
	}
)

