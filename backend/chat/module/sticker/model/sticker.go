package model

import (
	"chat/pkg/common"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	Sticker struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		Name      common.LocalizedName `bson:"name" json:"name"`
		Image       string             `bson:"image,omitempty" json:"image,omitempty"`
	}
)