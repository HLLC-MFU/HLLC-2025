package model

import (
	"chat/pkg/common"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	User struct {
		ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
		Username  string              `bson:"username" json:"username"`
		Name      common.Name         `bson:"name" json:"name"`	
		Password  string              `bson:"password" json:"password"`
		Role       primitive.ObjectID  `bson:"role" json:"role"`
		RefreshToken string            `bson:"refresh_token" json:"refresh_token"`
		Metadata       map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"`
	}
)