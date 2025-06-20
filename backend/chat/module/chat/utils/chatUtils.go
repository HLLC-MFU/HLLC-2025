package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	ChatMessagesTopic = "chat-messages"
)

type ChatEvent struct {
	Type      string          `json:"type"`
	RoomID    string          `json:"roomId"`
	UserID    string          `json:"userId"`
	Message   string          `json:"message"`
	Timestamp time.Time       `json:"timestamp"`
	Payload   json.RawMessage `json:"payload,omitempty"`
}

type Message struct {
	RoomID    primitive.ObjectID `json:"roomId"`
	UserID    primitive.ObjectID `json:"userId"`
	Message   string            `json:"message"`
	Timestamp time.Time         `json:"timestamp"`
}

type Client struct {
	Conn   *websocket.Conn
	RoomID primitive.ObjectID
	UserID primitive.ObjectID
}

type Hub struct {
	// Map structure: roomID -> userID -> []connection
	clients sync.Map // key: roomId string, value: *sync.Map[userID string]*sync.Map[connID string]*websocket.Conn
	publish func(topic string, key string, payload []byte) error
}

func NewHub(publisher func(topic string, key string, payload []byte) error) *Hub {
	return &Hub{publish: publisher}
}

func (h *Hub) Register(c Client) {
	roomKey := c.RoomID.Hex()
	userKey := c.UserID.Hex()
	connID := fmt.Sprintf("%p", c.Conn) // Use pointer address as unique connection ID

	// Get or create room map
	roomMap, _ := h.clients.LoadOrStore(roomKey, &sync.Map{})

	// Get or create user connections map
	userConns, _ := roomMap.(*sync.Map).LoadOrStore(userKey, &sync.Map{})

	// Store connection
	userConns.(*sync.Map).Store(connID, c.Conn)

	// Count users and connections
	users, conns := h.countRoomStats(roomKey)
	log.Printf("[WS] User %s joined room %s (connection: %s) - Users: %d, Connections: %d", 
		userKey, roomKey, connID, users, conns)
}

func (h *Hub) Unregister(c Client) {
	roomKey := c.RoomID.Hex()
	userKey := c.UserID.Hex()
	connID := fmt.Sprintf("%p", c.Conn)

	if roomMap, ok := h.clients.Load(roomKey); ok {
		if userConns, ok := roomMap.(*sync.Map).Load(userKey); ok {
			userConns.(*sync.Map).Delete(connID)

			// Check if user has no more connections
			hasConnections := false
			userConns.(*sync.Map).Range(func(_, _ interface{}) bool {
				hasConnections = true
				return false
			})

			if !hasConnections {
				roomMap.(*sync.Map).Delete(userKey)
			}

			// Count users and connections after removal
			users, conns := h.countRoomStats(roomKey)
			log.Printf("[WS] User %s left room %s (connection: %s) - Users: %d, Connections: %d", 
				userKey, roomKey, connID, users, conns)
		}
	}
}

func (h *Hub) countRoomStats(roomID string) (users int, connections int) {
	if roomMap, ok := h.clients.Load(roomID); ok {
		roomMap.(*sync.Map).Range(func(_, userConns interface{}) bool {
			users++
			userConns.(*sync.Map).Range(func(_, _ interface{}) bool {
				connections++
				return true
			})
			return true
		})
	}
	return
}

func (h *Hub) BroadcastRaw(roomID string, payload []byte) {
	// Publish to Kafka first
	if err := h.publish(ChatMessagesTopic, roomID, payload); err != nil {
		log.Printf("[ERROR] Failed to publish to Kafka: %v", err)
	} else {
		log.Printf("[ChatMessage] Successfully published message to Kafka topic %s", ChatMessagesTopic)
	}

	// Count users and connections
	users, conns := h.countRoomStats(roomID)
	log.Printf("[ChatMessage] Room %s stats - Users: %d, Connections: %d", roomID, users, conns)

	// Broadcast to WebSocket clients in the room
	h.broadcastToRoom(roomID, payload)
}

func (h *Hub) BroadcastEvent(event ChatEvent) {
	log.Printf("[ChatMessage] Broadcasting message from user %s to room %s", event.UserID, event.RoomID)

	// Marshal event for broadcasting
	payload, err := json.Marshal(event)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal message: %v", err)
		return
	}

	h.BroadcastRaw(event.RoomID, payload)
}

func (h *Hub) broadcastToRoom(roomID string, payload []byte) {
	successCount := 0
	failCount := 0

	if roomMap, ok := h.clients.Load(roomID); ok {
		roomMap.(*sync.Map).Range(func(userID, userConns interface{}) bool {
			userConns.(*sync.Map).Range(func(connID, conn interface{}) bool {
				ws := conn.(*websocket.Conn)
				if err := ws.WriteMessage(websocket.TextMessage, payload); err != nil {
					log.Printf("[WS] Failed to send to user %s (connection: %s): %v", userID, connID, err)
					_ = ws.Close()
					userConns.(*sync.Map).Delete(connID)
					failCount++
				} else {
					successCount++
				}
				return true
			})
			return true
		})
	}

	log.Printf("[ChatMessage] Broadcast results for room %s: %d successful, %d failed", 
		roomID, successCount, failCount)
}

// HandleKafkaMessage processes messages from Kafka and broadcasts them to WebSocket clients
func (h *Hub) HandleKafkaMessage(topic string, payload []byte) {
	// Try to unmarshal as ChatEvent
	var event ChatEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		log.Printf("[ERROR] Failed to unmarshal Kafka message: %v", err)
		return
	}

	log.Printf("[ChatMessage] Received Kafka message: type=%s, room=%s, user=%s", 
		event.Type, event.RoomID, event.UserID)

	// Broadcast the message to all clients in the room
	h.broadcastToRoom(event.RoomID, payload)
}

func (h *Hub) HandleSocket(conn *websocket.Conn, roomID, userID string) {
	rid, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		_ = conn.WriteMessage(websocket.TextMessage, []byte("Invalid room ID"))
		_ = conn.Close()
		return
	}
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		_ = conn.WriteMessage(websocket.TextMessage, []byte("Invalid user ID"))
		_ = conn.Close()
		return
	}

	client := Client{Conn: conn, RoomID: rid, UserID: uid}
	h.Register(client)
	defer h.Unregister(client)

	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			log.Printf("[WS] Read error: %v", err)
			break
		}

		// Create chat event
		event := ChatEvent{
			Type:      "message",
			RoomID:    rid.Hex(),
			UserID:    uid.Hex(),
			Message:   string(data),
			Timestamp: time.Now(),
		}

		// Broadcast event
		h.BroadcastEvent(event)
	}
}
