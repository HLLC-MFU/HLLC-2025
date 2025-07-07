package model

import (
	"chat/pkg/common"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	School struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
		Name      common.LocalizedName        `bson:"name" json:"name"`
		Acronym   string            `bson:"acronym" json:"acronym"`
		Detail    common.LocalizedName        `bson:"detail" json:"detail"`
		CreatedAt time.Time         `bson:"createdAt" json:"createdAt"`
		UpdatedAt time.Time         `bson:"updatedAt" json:"updatedAt"`
	}
)

