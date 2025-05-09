package model

import "go.mongodb.org/mongo-driver/bson/primitive"

type RoomMember struct {
	RoomID  primitive.ObjectID `bson:"room_id"`
	UserIDs []string           `bson:"user_ids"`
}
