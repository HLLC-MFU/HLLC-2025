package model

import "go.mongodb.org/mongo-driver/bson/primitive"

type(
	
	MessagePayload struct {
		UserID   primitive.ObjectID `json:"userId"`
		RoomID   primitive.ObjectID `json:"roomId"`
		Message  string             `json:"message"`
		Mentions []string           `json:"mentions"`
	}

	ChatEvent struct {
		EventType string      `json:"eventType"`
		Payload   interface{} `json:"payload"`
	}
)
