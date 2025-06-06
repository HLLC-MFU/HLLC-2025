package model

import (
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Name struct {
	First  string `bson:"first" json:"first"`
	Middle string `bson:"middle,omitempty" json:"middle,omitempty"`
	Last   string `bson:"last,omitempty" json:"last,omitempty"`
}

type User struct {
	coreModel.Base `bson:",inline"`
	ID             primitive.ObjectID     `bson:"_id,omitempty" json:"id"`
	Name           Name                   `bson:"name" json:"name"`
	Username       string                 `bson:"username" json:"username"`
	Password       string                 `bson:"password,omitempty" json:"-"`
	Role           primitive.ObjectID     `bson:"role" json:"role"`
	RefreshToken   *string                `bson:"refreshToken,omitempty" json:"-"`
	Metadata       map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"`
}
