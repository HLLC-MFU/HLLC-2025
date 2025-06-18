package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	Room struct {
		ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		Name        string            `bson:"name" json:"name"`
		Description string            `bson:"description" json:"description"`
		Type        string            `bson:"type" json:"type"` // private, group, public
		Members     []RoomMember      `bson:"members" json:"members"`
		CreatorID   string            `bson:"creator_id" json:"creator_id"`
		IsActive    bool              `bson:"is_active" json:"is_active"`
		CreatedAt   time.Time         `bson:"created_at" json:"created_at"`
		UpdatedAt   time.Time         `bson:"updated_at" json:"updated_at"`
	}

	RoomMember struct {
		UserID    string    `bson:"user_id" json:"user_id"`
		Role      string    `bson:"role" json:"role"` // admin, member
		JoinedAt  time.Time `bson:"joined_at" json:"joined_at"`
		LastRead  time.Time `bson:"last_read" json:"last_read"`
		IsActive  bool      `bson:"is_active" json:"is_active"`
	}

	RoomMembership struct {
		RoomID    string    `json:"room_id"`
		UserID    string    `json:"user_id"`
		JoinedAt  time.Time `json:"joined_at"`
		LastRead  time.Time `json:"last_read"`
		Role      string    `json:"role"`
	}
)
