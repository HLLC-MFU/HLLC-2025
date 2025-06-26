package model

import (
	"chat/pkg/common"
	"encoding/json"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	Room struct {
		ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		Name        common.LocalizedName            `bson:"name" json:"name"`
		Capacity    int            `bson:"capacity" json:"capacity"`
		Members     []primitive.ObjectID `bson:"members" json:"members"`
		CreatedBy   primitive.ObjectID            `bson:"createdBy" json:"createdBy"`
		CreatedAt   time.Time         `bson:"createdAt" json:"createdAt"`
		UpdatedAt   time.Time         `bson:"updatedAt" json:"updatedAt"`
		Image       string             `bson:"image,omitempty" json:"image,omitempty"`
	}

	RoomEvent struct {
		Type string `json:"type"`
		RoomID string `json:"roomId"`
		Payload json.RawMessage `json:"payload"`
	}
)	