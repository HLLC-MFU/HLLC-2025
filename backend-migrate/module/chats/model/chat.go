package model

import (
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/pkg/types"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Room struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name      types.LocalizedName      `json:"name" bson:"name"`
	Capacity  int               `json:"capacity" bson:"capacity"`
	Image     string            `json:"image" bson:"image"`
	Creator   primitive.ObjectID `json:"creator" bson:"creator"`
	CreatedAt time.Time         `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time         `json:"updated_at" bson:"updated_at"`
}


type ChatMessage struct {
	ID        primitive.ObjectID  `json:"id" bson:"_id,omitempty"`
	RoomID    string             `json:"roomId" bson:"roomId"`
	UserID    string             `json:"userId" bson:"userId"`
	Message   string             `json:"message,omitempty" bson:"message,omitempty"`
	FileURL   string             `json:"fileUrl,omitempty" bson:"fileUrl,omitempty"`
	FileName  string             `json:"fileName,omitempty" bson:"fileName,omitempty"`
	FileType  string             `json:"fileType,omitempty" bson:"fileType,omitempty"`
	StickerID *primitive.ObjectID `json:"stickerId,omitempty" bson:"stickerId,omitempty"`
	Image     string             `json:"image,omitempty" bson:"image,omitempty"`
	Timestamp time.Time          `json:"timestamp" bson:"timestamp"`
}

type MessageReadReceipt struct {
	MessageID primitive.ObjectID `json:"messageId" bson:"messageId"`
	UserID    string            `json:"userId" bson:"userId"`
	Timestamp time.Time         `json:"timestamp" bson:"timestamp"`
}

type MessageReaction struct {
	MessageID primitive.ObjectID `json:"messageId" bson:"messageId"`
	UserID    string            `json:"userId" bson:"userId"`
	Reaction  string            `json:"reaction" bson:"reaction"`
	Timestamp time.Time         `json:"timestamp" bson:"timestamp"`
}

type ClientObject struct {
	RoomID string
	UserID string
	Conn   interface{}
}

type BroadcastObject struct {
	MSG  string
	FROM ClientObject
}

// Global map to store connected clients
var Clients = make(map[string]map[string]interface{})

// BroadcastMessage sends a message to all clients in a room
func BroadcastMessage(obj BroadcastObject) {
	if clients, ok := Clients[obj.FROM.RoomID]; ok {
		for userID, conn := range clients {
			if wsConn, ok := conn.(*websocket.Conn); ok {
				if err := wsConn.WriteJSON(obj); err != nil {
					wsConn.Close()
					delete(clients, userID)
				}
			}
		}
	}
} 