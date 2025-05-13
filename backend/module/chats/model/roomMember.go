package model

import "go.mongodb.org/mongo-driver/bson/primitive"

type RoomMember struct {
	ID      primitive.ObjectID   `bson:"_id,omitempty"`
	RoomID  primitive.ObjectID   `bson:"room_id"`
	UserIDs []primitive.ObjectID `bson:"user_ids"`
}
