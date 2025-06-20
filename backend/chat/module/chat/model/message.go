package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MessageType string

const (
	TextMessage    MessageType = "text"
	StickerMessage MessageType = "sticker"
	FileMessage    MessageType = "file"
)

type Message struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	RoomID    primitive.ObjectID `bson:"roomId" json:"roomId"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	Type      MessageType       `bson:"type" json:"type"`
	Content   string           `bson:"content" json:"content"`
	FileURL   string           `bson:"fileUrl,omitempty" json:"fileUrl,omitempty"`
	CreatedAt time.Time        `bson:"createdAt" json:"createdAt"`
} 