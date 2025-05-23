package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Sticker struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name        string            `json:"name" bson:"name"`
	Image       string            `json:"image" bson:"image"`
	Category    string            `json:"category" bson:"category"`
	CreatedAt   time.Time         `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at" bson:"updated_at"`
}

type StickerCategory struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name      string            `json:"name" bson:"name"`
	CreatedAt time.Time         `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time         `json:"updated_at" bson:"updated_at"`
} 