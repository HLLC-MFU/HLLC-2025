package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ( 
	ChatMessage struct {
		ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
		RoomID    primitive.ObjectID  `bson:"room_id" json:"room_id"`
		UserID    primitive.ObjectID  `bson:"user_id" json:"user_id"`
		Message   string              `bson:"message" json:"message"`
		Mentions  []string            `bson:"mentions,omitempty"`
		ReplyToID *primitive.ObjectID `bson:"reply_to_id,omitempty" json:"reply_to_id,omitempty"`
		FileURL   string              `bson:"file_url,omitempty" json:"file_url,omitempty"`
		FileType  string              `bson:"file_type,omitempty" json:"file_type,omitempty"`
		FileName  string              `bson:"file_name,omitempty" json:"file_name,omitempty"`
		Timestamp time.Time           `bson:"timestamp" json:"timestamp"`
		StickerID *primitive.ObjectID `bson:"sticker_id,omitempty" json:"stickerId,omitempty"`
		Image     string              `bson:"image,omitempty" json:"image,omitempty"`
	}

	MessageReaction struct {
		MessageID primitive.ObjectID `bson:"message_id"`
		UserID    primitive.ObjectID `bson:"user_id"`
		Reaction  string             `bson:"reaction"`
		Timestamp time.Time          `bson:"timestamp"`
	}

	ChatMessageEnriched struct {
		ChatMessage ChatMessage       `bson:"chat"`
		Reactions   []MessageReaction `bson:"reactions"`
		ReplyTo     *ChatMessage      `bson:"replyTo,omitempty"`
		Username    string            `bson:"username,omitempty"`
	}
)
