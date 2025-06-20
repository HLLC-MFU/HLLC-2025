package utils

import (
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ChatMessage struct {
	RoomID    primitive.ObjectID
	UserID    primitive.ObjectID
	Message   string
	Timestamp time.Time
}

type ChatHub struct {
	// Registered clients using sync.Map for concurrent access
	clients sync.Map

	// Channels for communication
	broadcastChan chan ChatMessage
	registerChan   chan interface{}
	unregisterChan chan interface{}
}

func NewChatHub() *ChatHub {
	return &ChatHub{
		clients:       sync.Map{},
		broadcastChan: make(chan ChatMessage),
		registerChan:   make(chan interface{}),
		unregisterChan: make(chan interface{}),
	}
}

func (h *ChatHub) Run() {
	for {
		select {
		case client := <-h.registerChan:
			// Handle registration
			_ = client // Placeholder

		case client := <-h.unregisterChan:
			// Handle unregistration
			_ = client // Placeholder

		case message := <-h.broadcastChan:
			// Broadcast message to all clients in the room
			if clientsInterface, ok := h.clients.Load(message.RoomID.Hex()); ok {
				if clients, ok := clientsInterface.(map[string]interface{}); ok {
					for _, client := range clients {
						// Send message to client
						_ = client // Placeholder
					}
				}
			}
		}
	}
}

func (h *ChatHub) Broadcast(message ChatMessage) {
	h.broadcastChan <- message
} 