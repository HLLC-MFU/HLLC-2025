package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MessageReaction struct {
	MessageID primitive.ObjectID `bson:"message_id"`
	UserID    string             `bson:"user_id"`
	Reaction  string             `bson:"reaction"`
	Timestamp time.Time          `bson:"timestamp"`
}
