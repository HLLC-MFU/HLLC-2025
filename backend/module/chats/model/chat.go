package model

import (
	"log"
	"time"

	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Room struct {
	coreModel.Base `bson:",inline"`
	ID             primitive.ObjectID      `bson:"_id" json:"id"`
	Name           coreModel.LocalizedName `bson:"name" json:"name"`
	Capacity       int                     `bson:"capacity" json:"capacity"`
}

var _ = coreModel.Collection("rooms")

type ChatMessage struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	RoomID    string             `bson:"room_id" json:"room_id"`
	UserID    string             `bson:"user_id" json:"user_id"`
	Message   string             `bson:"message" json:"message"`
	Timestamp time.Time          `bson:"timestamp" json:"timestamp"`
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
	UserID string
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
	Clients[client.RoomID][client.UserID] = client.Conn
	Register <- client

	// Start Heartbeat
	go func() {
		for {
			err := client.Conn.WriteMessage(websocket.PingMessage, nil)
			if err != nil {
				log.Printf("[HEARTBEAT] Disconnected: %s in room %s", client.UserID, client.RoomID)
				UnregisterClient(client)
				break
			}
			time.Sleep(30 * time.Second) // Heartbeat interval
		}
	}()

	log.Printf("[JOIN] %s joined room %s\n", client.UserID, client.RoomID)
}

func UnregisterClient(client ClientObject) {
	roomClients := Clients[client.RoomID]
	if roomClients != nil {
		delete(roomClients, client.UserID)
		log.Printf("[UNREGISTER] %s left room %s", client.UserID, client.RoomID)
	}
}

func BroadcastMessage(b BroadcastObject) {
	Broadcast <- b
}
