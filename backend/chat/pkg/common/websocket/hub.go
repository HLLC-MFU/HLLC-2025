package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gofiber/websocket/v2"
)

// Hub manages WebSocket connections and message broadcasting
type Hub[T any] struct {
	// Registered clients
	clients    map[string]map[string]*Client
	// Register requests
	register   chan *Client
	// Unregister requests
	unregister chan *Client
	// Inbound messages
	broadcast  chan *Message[T]
	// Connection events
	OnConnect    func(client *Client)
	OnDisconnect func(client *Client)
	OnMessage    func(client *Client, msg *Message[T])
	mu           sync.RWMutex
}

type Client struct {
	ID       string
	RoomID   string
	Conn     *websocket.Conn
	Metadata map[string]interface{}
}

type Message[T any] struct {
	Type    string
	RoomID  string
	From    string
	Payload T
}

func NewHub[T any]() *Hub[T] {
	return &Hub[T]{
		clients:    make(map[string]map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message[T]),
	}
}

func (h *Hub[T]) Run() {
	for {
		select {
		case client := <-h.register:
			h.handleRegister(client)

		case client := <-h.unregister:
			h.handleUnregister(client)

		case msg := <-h.broadcast:
			h.handleBroadcast(msg)
		}
	}
}

func (h *Hub[T]) handleRegister(client *Client) {
	h.mu.Lock()
	if h.clients[client.RoomID] == nil {
		h.clients[client.RoomID] = make(map[string]*Client)
	}
	h.clients[client.RoomID][client.ID] = client
	h.mu.Unlock()

	if h.OnConnect != nil {
		h.OnConnect(client)
	}
}

func (h *Hub[T]) handleUnregister(client *Client) {
	h.mu.Lock()
	if _, ok := h.clients[client.RoomID]; ok {
		if h.OnDisconnect != nil {
			h.OnDisconnect(client)
		}
		delete(h.clients[client.RoomID], client.ID)
		client.Conn.Close()
	}
	h.mu.Unlock()
}

func (h *Hub[T]) handleBroadcast(msg *Message[T]) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, client := range h.clients[msg.RoomID] {
		if client.ID == msg.From {
			continue // Skip sender
		}

		if err := h.sendJSON(client.Conn, msg); err != nil {
			log.Printf("[WebSocket] Failed to send message to %s: %v", client.ID, err)
			client.Conn.Close()
			h.unregister <- client
		}
	}

	if h.OnMessage != nil {
		if client, ok := h.clients[msg.RoomID][msg.From]; ok {
			h.OnMessage(client, msg)
		}
	}
}

func (h *Hub[T]) Register(client *Client) {
	h.register <- client
}

func (h *Hub[T]) Unregister(client *Client) {
	h.unregister <- client
}

func (h *Hub[T]) Broadcast(msg *Message[T]) {
	h.broadcast <- msg
}

func (h *Hub[T]) GetRoomClients(roomID string) []*Client {
	h.mu.RLock()
	defer h.mu.RUnlock()

	clients := make([]*Client, 0)
	for _, client := range h.clients[roomID] {
		clients = append(clients, client)
	}
	return clients
}

func (h *Hub[T]) GetClient(roomID, clientID string) (*Client, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if room, ok := h.clients[roomID]; ok {
		if client, ok := room[clientID]; ok {
			return client, true
		}
	}
	return nil, false
}

func (h *Hub[T]) sendJSON(conn *websocket.Conn, v interface{}) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return conn.WriteMessage(websocket.TextMessage, data)
} 