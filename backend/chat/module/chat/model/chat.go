package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (

	ChatMessage struct {
		ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
		RoomID    string             `bson:"room_id" json:"room_id"`
		SenderID  string             `bson:"sender_id" json:"sender_id"`
		Content   string             `bson:"content" json:"content"`
		Type      string             `bson:"type" json:"type"`         // text, image, file, etc.
		Mentions  []string           `bson:"mentions" json:"mentions"` // List of mentioned user IDs
		Reactions []MessageReaction  `bson:"reactions" json:"reactions"`
		ReplyTo   *primitive.ObjectID `bson:"reply_to,omitempty" json:"reply_to,omitempty"`
		Metadata  map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"` // For additional data like file info
		IsDeleted bool               `bson:"is_deleted" json:"is_deleted"`
		IsEdited  bool               `bson:"is_edited" json:"is_edited"`
		CreatedAt time.Time          `bson:"created_at" json:"created_at"`
		UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
	}
	
	ChatMessageEnriched struct {
		ChatMessage ChatMessage       `json:"chat"`
		Reactions   []MessageReaction `json:"reactions"`
		ReplyTo     *ChatMessage      `json:"replyTo,omitempty"`
	}

	MessageReaction struct {
		MessageID primitive.ObjectID `json:"message_id"`
		UserID    primitive.ObjectID `json:"user_id"`
		Reaction  string             `json:"reaction"`
		Timestamp time.Time          `json:"timestamp"`
	}
)
