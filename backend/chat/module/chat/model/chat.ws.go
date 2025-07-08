package model

import (
	"log"

	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var Clients = make(map[primitive.ObjectID]map[string]*websocket.Conn)
var Register = make(chan ClientObject)
var Broadcast = make(chan BroadcastObject)
var Unregister = make(chan ClientObject)

type(
	ClientObject struct {
		RoomID primitive.ObjectID
		UserID primitive.ObjectID
		Conn   *websocket.Conn
	}

	BroadcastObject struct {
		MSG  interface{}
		FROM ClientObject
	}
) 

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
		log.Printf("[UNREGISTER] %s left room %s", client.UserID.Hex(), client.RoomID.Hex())
	}
}

func BroadcastMessage(b BroadcastObject) {
	Broadcast <- b
}
