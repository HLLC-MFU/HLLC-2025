package model

import (
	"chat/pkg/common"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (


	User struct {
		ID           primitive.ObjectID `bson:"_id" json:"_id"`
		Name         common.Name        `bson:"name" json:"name"`
		Username     string            `bson:"username" json:"username"`
		Password     string            `bson:"password,omitempty" json:"password,omitempty"`
		Role         primitive.ObjectID `bson:"role" json:"role"`
		RefreshToken string            `bson:"refreshToken,omitempty" json:"refreshToken,omitempty"`
		Metadata       map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"`
		CreatedAt    time.Time         `bson:"createdAt" json:"createdAt"`
		UpdatedAt    time.Time         `bson:"updatedAt" json:"updatedAt"`
	}
)