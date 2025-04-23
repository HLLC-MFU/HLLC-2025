package model

import (
	"log"

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

type mappedConns map[string]map[string]*websocket.Conn

type ClientObject struct {
	RoomID string
	UserID string
	Conn   *websocket.Conn
}

type BroadcastObject struct {
	MSG  string
	FROM ClientObject
}

var Clients = make(mappedConns)
var Register = make(chan ClientObject)
var Broadcast = make(chan BroadcastObject)
var Unregister = make(chan ClientObject)

func RegisterClient(client ClientObject) {
	if Clients[client.RoomID] == nil {
		Clients[client.RoomID] = make(map[string]*websocket.Conn)
	}
	Clients[client.RoomID][client.UserID] = client.Conn
	Register <- client
	log.Printf("[JOIN] %s joined room %s\n", client.UserID, client.RoomID)
}

func UnregisterClient(client ClientObject) {
	if roomClients, ok := Clients[client.RoomID]; ok {
		if _, ok := roomClients[client.UserID]; ok {
			delete(roomClients, client.UserID)
			Unregister <- client
			log.Printf("[LEAVE] %s left room %s\n", client.UserID, client.RoomID)
		}
	}
}

func BroadcastMessage(b BroadcastObject) {
	Broadcast <- b
}
