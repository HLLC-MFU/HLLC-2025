package model

import "go.mongodb.org/mongo-driver/bson/primitive"

type RoomMember struct {
	ID      primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	RoomID  primitive.ObjectID   `bson:"room_id" json:"room_id"`
	UserIDs []primitive.ObjectID `bson:"user_ids"`
}
