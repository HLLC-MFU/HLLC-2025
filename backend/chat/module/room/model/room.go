package model

import (
	"chat/module/user/model"
	"chat/pkg/common"
	"encoding/json"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	Room struct {
		ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		Name        common.LocalizedName `bson:"name" json:"name"`
		Capacity    int               `bson:"capacity" json:"capacity"`
		CreatedAt   time.Time         `bson:"createdAt" json:"createdAt"`
		UpdatedAt   time.Time         `bson:"updatedAt" json:"updatedAt"`
		Image       string            `bson:"image,omitempty" json:"image,omitempty"` // Base64 encoded image, max 256KB
		CreatedBy   *model.User       `bson:"createdBy,omitempty" json:"createdBy"`
		Members     []*model.User     `bson:"members,omitempty" json:"members"`
	}

	RoomEvent struct {
		Type    string          `json:"type"`
		RoomID  string          `json:"roomId"`
		Payload json.RawMessage `json:"payload"`
	}
)	