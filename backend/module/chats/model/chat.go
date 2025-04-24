package model

import (
	"context"
	"log"
	"sync"
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

// MessageEntry represents a single chat message
type MessageEntry struct {
	UserID    string    `bson:"user_id" json:"user_id"`
	Text      string    `bson:"text" json:"text"`
	Timestamp time.Time `bson:"timestamp" json:"timestamp"`
}

// ChatHistories stores buffered messages per room
type ChatHistories struct {
	coreModel.Base `bson:",inline"`
	ID             primitive.ObjectID `bson:"_id" json:"id"`
	RoomID         string             `bson:"room_id" json:"room_id"`
	Messages       []MessageEntry     `bson:"messages" json:"messages"`
}

var _ = coreModel.Collection("chat_histories")

// Index definitions (optional - adjust if your system uses them)
var _ = []interface{}{
	coreModel.Index("room_id"),
	coreModel.Index("name"),
	coreModel.Index("capacity"),
}

// In-memory WebSocket client management

var Clients = make(mappedConns)
type mappedConns map[string]map[string]*websocket.Conn

var Register = make(chan ClientObject)
var Broadcast = make(chan BroadcastObject)
var Unregister = make(chan ClientObject)

// WebSocket client struct

type ClientObject struct {
	RoomID string
	UserID string
	Conn   *websocket.Conn
}

type BroadcastObject struct {
	MSG  string
	FROM ClientObject
}

// RegisterClient handles in-memory join
func RegisterClient(client ClientObject) {
	if Clients[client.RoomID] == nil {
		Clients[client.RoomID] = make(map[string]*websocket.Conn)
	}
	Clients[client.RoomID][client.UserID] = client.Conn
	Register <- client
	log.Printf("[JOIN] %s joined room %s\n", client.UserID, client.RoomID)
}

// UnregisterClient handles disconnect
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

// In-memory message buffer for each room (limited to last N messages)
var ChatBuffer = make(map[string][]MessageEntry)
var chatBufferLock sync.Mutex

const MaxMessagesPerRoom = 100

// AppendMessageToBuffer safely adds a message and optionally truncates
func AppendMessageToBuffer(roomID string, msg MessageEntry) {
	chatBufferLock.Lock()
	defer chatBufferLock.Unlock()

	ChatBuffer[roomID] = append(ChatBuffer[roomID], msg)
	if len(ChatBuffer[roomID]) > MaxMessagesPerRoom {
		ChatBuffer[roomID] = ChatBuffer[roomID][len(ChatBuffer[roomID])-MaxMessagesPerRoom:]
	}
}

// FlushChatBufferToDatabase should be run in background goroutine
func FlushChatBufferToDatabase(saveFunc func(ctx context.Context, roomID string, messages []MessageEntry) error) {
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			chatBufferLock.Lock()
			for roomID, messages := range ChatBuffer {
				if len(messages) == 0 {
					continue
				}

				// Save and clear buffer
				err := saveFunc(context.TODO(), roomID, messages)
				if err == nil {
					ChatBuffer[roomID] = nil
				} else {
					log.Printf("[FLUSH ERROR] Could not save chat history for room %s: %v\n", roomID, err)
				}
			}
			chatBufferLock.Unlock()
		}
	}()
}
