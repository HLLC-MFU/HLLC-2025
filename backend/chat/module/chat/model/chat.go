package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ( 
	ChatMessage struct {
		ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
		RoomID    primitive.ObjectID  `bson:"room_id" json:"room_id"`
		UserID    primitive.ObjectID  `bson:"user_id" json:"user_id"` // Will be populated with user data
		Message   string              `bson:"message" json:"message"`
		Mentions  []string            `bson:"mentions,omitempty"`
		ReplyToID *primitive.ObjectID `bson:"reply_to_id,omitempty" json:"reply_to_id,omitempty"`
		FileURL   string              `bson:"file_url,omitempty" json:"file_url,omitempty"`
		FileType  string              `bson:"file_type,omitempty" json:"file_type,omitempty"`
		FileName  string              `bson:"file_name,omitempty" json:"file_name,omitempty"`
		Timestamp time.Time           `bson:"timestamp" json:"timestamp"`
		StickerID *primitive.ObjectID `bson:"sticker_id,omitempty" json:"stickerId,omitempty"`
		Image     string              `bson:"image,omitempty" json:"image,omitempty"`
		
		// Reactions field - NOT stored in database, only for response aggregation
		Reactions []MessageReaction `bson:"-" json:"reactions,omitempty"`
	}

	MessageReaction struct {
		MessageID primitive.ObjectID `bson:"message_id" json:"message_id"`
		UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
		Reaction  string             `bson:"reaction" json:"reaction"`
		Timestamp time.Time          `bson:"timestamp" json:"timestamp"`
		
		// User data - populated when needed, not stored in database
		User interface{} `bson:"-" json:"user,omitempty"`
	}

	ChatMessageEnriched struct {
		ChatMessage ChatMessage       `bson:"chat"`
		Reactions   []MessageReaction `bson:"reactions"`
		ReplyTo     *ChatMessage      `bson:"replyTo,omitempty"`
		Username    string            `bson:"username,omitempty"`
	}
)
