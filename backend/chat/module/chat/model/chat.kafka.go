package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type KafkaMessage struct {
	RoomID    primitive.ObjectID `json:"room_id"`
	UserID    primitive.ObjectID `json:"user_id"`
	Message   string             `json:"message"`
	Mentions  []string           `json:"mentions,omitempty"`
	FileURL   string             `json:"file_url,omitempty"`
	FileType  string             `json:"file_type,omitempty"`
	FileName  string             `json:"file_name,omitempty"`
	Timestamp time.Time          `json:"timestamp"`
	Image     string             `json:"image,omitempty"`
}