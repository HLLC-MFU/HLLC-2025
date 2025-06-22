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
		CreatedBy   primitive.ObjectID            `bson:"createdBy" json:"createdBy"`
		CreatedAt   time.Time         `bson:"createdAt" json:"createdAt"`
		UpdatedAt   time.Time         `bson:"updatedAt" json:"updatedAt"`
	}

	RoomMember struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		RoomID    primitive.ObjectID `bson:"roomId" json:"roomId"`
		UserIDs   []primitive.ObjectID `bson:"userIds" json:"userIds"`
	}

	RoomEvent struct {
		ID string `json:"id"`
		Type string `json:"type"`
		RoomID string `json:"roomId"`
		Payload json.RawMessage `json:"payload"`
	}

)