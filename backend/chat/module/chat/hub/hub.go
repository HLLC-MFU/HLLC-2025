// hub/hub.go
package hub

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/gofiber/websocket/v2"
)

// ClientState represents a connected client's state
type ClientState struct {
	UserID    string
	RoomID    string
	Conn      *websocket.Conn
	LastSeen  time.Time
	IsOnline  bool
}

// Hub manages WebSocket connections and event distribution
type Hub struct {
	// Protects clients map
	mu sync.RWMutex

	// Maps: roomID -> userID -> client state
	clients map[string]map[string]*ClientState

	// Event bus for message distribution
	eventBus EventBus

	// Channels for client registration/messaging
	Register   chan *ClientState
	Unregister chan *ClientState
	Broadcast  chan Event

	// Context for cleanup
	ctx    context.Context
	cancel context.CancelFunc
}

// NewHub creates a new Hub instance
func NewHub(eventBus EventBus) *Hub {
	ctx, cancel := context.WithCancel(context.Background())
	h := &Hub{
		clients:    make(map[string]map[string]*ClientState),
		eventBus:   eventBus,
		Register:   make(chan *ClientState),
		Unregister: make(chan *ClientState),
		Broadcast:  make(chan Event),
		ctx:        ctx,
		cancel:     cancel,
	}

	// Subscribe to events from the event bus
	_ = eventBus.Subscribe("chat", h)

	return h
}

// Start begins processing hub events
func (h *Hub) Start() {
	go h.run()
}

// Stop gracefully shuts down the hub
func (h *Hub) Stop() {
	h.cancel()
	h.eventBus.Close()
}

// HandleEvent implements EventHandler interface
func (h *Hub) HandleEvent(ctx context.Context, event Event) error {
	// Handle events from the event bus
	switch event.Type {
	case MessageEvent:
		return h.broadcastToRoom(event.RoomID, event)
	case NotificationEvent:
		return h.notifyUser(event.UserID, event)
	case PresenceEvent:
		return h.updatePresence(event)
	default:
		log.Printf("Unknown event type: %s", event.Type)
	}
	return nil
}

func (h *Hub) run() {
	for {
		select {
		case <-h.ctx.Done():
			return

		case client := <-h.Register:
			h.registerClient(client)

		case client := <-h.Unregister:
			h.unregisterClient(client)

		case event := <-h.Broadcast:
			if err := h.broadcastToRoom(event.RoomID, event); err != nil {
				log.Printf("Error broadcasting event: %v", err)
			}
		}
	}
}

func (h *Hub) registerClient(client *ClientState) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.clients[client.RoomID] == nil {
		h.clients[client.RoomID] = make(map[string]*ClientState)
	}

	client.IsOnline = true
	client.LastSeen = time.Now()
	h.clients[client.RoomID][client.UserID] = client

	// Notify others about new presence
	h.Broadcast <- Event{
		Type:    PresenceEvent,
		RoomID:  client.RoomID,
		UserID:  client.UserID,
		Payload: map[string]interface{}{"status": "online"},
	}

	log.Printf("Client registered: user=%s room=%s", client.UserID, client.RoomID)
}

func (h *Hub) unregisterClient(client *ClientState) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if roomClients, exists := h.clients[client.RoomID]; exists {
		if existingClient, ok := roomClients[client.UserID]; ok {
			existingClient.IsOnline = false
			existingClient.LastSeen = time.Now()
			if existingClient.Conn != nil {
				existingClient.Conn.Close()
				existingClient.Conn = nil
			}
		}
		delete(roomClients, client.UserID)
	}

	// Notify others about offline presence
	h.Broadcast <- Event{
		Type:    PresenceEvent,
		RoomID:  client.RoomID,
		UserID:  client.UserID,
		Payload: map[string]interface{}{"status": "offline"},
	}

	log.Printf("Client unregistered: user=%s room=%s", client.UserID, client.RoomID)
}

func (h *Hub) broadcastToRoom(roomID string, event Event) error {
	h.mu.RLock()
	defer h.mu.RUnlock()

	roomClients, exists := h.clients[roomID]
	if !exists {
		return nil
	}

	for userID, client := range roomClients {
		if client.IsOnline && client.Conn != nil {
			if err := client.Conn.WriteJSON(event); err != nil {
				log.Printf("Error sending to client %s: %v", userID, err)
				client.IsOnline = false
				client.LastSeen = time.Now()
				// Fallback to notification for failed delivery
				go h.notifyUser(userID, event)
			}
		} else {
			// Client is offline, send notification
			go h.notifyUser(userID, event)
		}
	}

	return nil
}

func (h *Hub) notifyUser(userID string, event Event) error {
	// Convert chat event to notification
	notifyEvent := Event{
		Type:   NotificationEvent,
		UserID: userID,
		Payload: map[string]interface{}{
			"originalEvent": event,
			"timestamp":    time.Now(),
		},
	}

	return h.eventBus.PublishDirect(context.Background(), userID, notifyEvent)
}

func (h *Hub) updatePresence(event Event) error {
	h.mu.Lock()
	defer h.mu.Unlock()

	if status, ok := event.Payload.(map[string]interface{})["status"].(string); ok {
		if client, exists := h.clients[event.RoomID][event.UserID]; exists {
			client.IsOnline = (status == "online")
			client.LastSeen = time.Now()
		}
	}

	return nil
}

// IsUserOnline checks if a user is currently online in a room
func (h *Hub) IsUserOnline(roomID, userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if roomClients, exists := h.clients[roomID]; exists {
		if client, ok := roomClients[userID]; ok {
			return client.IsOnline
		}
	}
	return false
}

// GetOnlineUsers returns a list of online users in a room
func (h *Hub) GetOnlineUsers(roomID string) []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	var onlineUsers []string
	if roomClients, exists := h.clients[roomID]; exists {
		for userID, client := range roomClients {
			if client.IsOnline {
				onlineUsers = append(onlineUsers, userID)
			}
		}
	}
	return onlineUsers
}
