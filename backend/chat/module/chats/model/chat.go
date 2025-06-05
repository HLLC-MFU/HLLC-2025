package model

import (
	"log"
	"time"

	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var _ = coreModel.Collection("rooms")

type ChatMessage struct {
	ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	RoomID    string              `bson:"room_id" json:"room_id"`
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

type ChatEvent struct {
	EventType string      `json:"eventType"`
	Payload   interface{} `json:"payload"`
}

type MessagePayload struct {
	UserID   primitive.ObjectID `json:"userId"`
	RoomID   string             `json:"roomId"`
	Message  string             `json:"message"`
	Mentions []string           `json:"mentions"`
}

var _ = coreModel.Collection("chat_messages")

var _ = []interface{}{
	coreModel.Index("room_id"),
	coreModel.Index("name"),
	coreModel.Index("capacity"),
}

type mappedConns map[string]map[string]*websocket.Conn

var Clients = make(mappedConns)
var Register = make(chan ClientObject)
var Broadcast = make(chan BroadcastObject)
var Unregister = make(chan ClientObject)

type ClientObject struct {
	RoomID string
	UserID primitive.ObjectID
	Conn   *websocket.Conn
}

type BroadcastObject struct {
	MSG  string
	FROM ClientObject
}

func RegisterClient(client ClientObject) {
	if Clients[client.RoomID] == nil {
		Clients[client.RoomID] = make(map[string]*websocket.Conn)
	}
	Clients[client.RoomID][client.UserID.Hex()] = client.Conn
	Register <- client
}

func UnregisterClient(client ClientObject) {
	roomClients := Clients[client.RoomID]
	if roomClients != nil {
		roomClients[client.UserID.Hex()] = nil
		log.Printf("[UNREGISTER] %s left room %s", client.UserID.Hex(), client.RoomID)
	}
}

func BroadcastMessage(b BroadcastObject) {
	Broadcast <- b
}

// KafkaMessage represents a message format specifically for Kafka, without MongoDB-specific fields
type KafkaMessage struct {
	RoomID    string             `json:"room_id"`
	UserID    primitive.ObjectID `json:"user_id"`
	Message   string             `json:"message"`
	Mentions  []string           `json:"mentions,omitempty"`
	FileURL   string             `json:"file_url,omitempty"`
	FileType  string             `json:"file_type,omitempty"`
	FileName  string             `json:"file_name,omitempty"`
	Timestamp time.Time          `json:"timestamp"`
	Image     string             `json:"image,omitempty"`
}

// ToKafkaMessage converts a ChatMessage to KafkaMessage format
func (m *ChatMessage) ToKafkaMessage() *KafkaMessage {
	return &KafkaMessage{
		RoomID:    m.RoomID,
		UserID:    m.UserID,
		Message:   m.Message,
		Mentions:  m.Mentions,
		FileURL:   m.FileURL,
		FileType:  m.FileType,
		FileName:  m.FileName,
		Timestamp: m.Timestamp,
		Image:     m.Image,
	}
}
