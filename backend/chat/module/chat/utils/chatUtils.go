package utils

import (
	"encoding/json"
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
	clients sync.Map // key: roomId string, value: map[userId string]*websocket.Conn
	publish func(topic string, key string, payload []byte) error
}

func NewHub(publisher func(topic string, key string, payload []byte) error) *Hub {
	return &Hub{publish: publisher}
}

func (h *Hub) Register(c Client) {
	roomKey := c.RoomID.Hex()
	userKey := c.UserID.Hex()

	clients, _ := h.clients.LoadOrStore(roomKey, &sync.Map{})
	clients.(*sync.Map).Store(userKey, c.Conn)
	log.Printf("[WS] User %s joined room %s", userKey, roomKey)
}

func (h *Hub) Unregister(c Client) {
	roomKey := c.RoomID.Hex()
	userKey := c.UserID.Hex()

	if clients, ok := h.clients.Load(roomKey); ok {
		clients.(*sync.Map).Delete(userKey)
		log.Printf("[WS] User %s left room %s", userKey, roomKey)
	}
}

func (h *Hub) Broadcast(msg Message) {
	// Create chat event
	event := ChatEvent{
		Type:      "message",
		RoomID:    msg.RoomID.Hex(),
		UserID:    msg.UserID.Hex(),
		Message:   msg.Message,
		Timestamp: msg.Timestamp,
	}

	log.Printf("[ChatMessage] Broadcasting message from user %s to room %s", event.UserID, event.RoomID)

	// Marshal event for broadcasting
	payload, err := json.Marshal(event)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal message: %v", err)
		return
	}

	// Publish to Kafka
	if err := h.publish(ChatMessagesTopic, msg.RoomID.Hex(), payload); err != nil {
		log.Printf("[ERROR] Failed to publish to Kafka: %v", err)
	} else {
		log.Printf("[ChatMessage] Successfully published message to Kafka topic %s", ChatMessagesTopic)
	}

	// Count online users in room
	onlineUsers := 0
	if clients, ok := h.clients.Load(msg.RoomID.Hex()); ok {
		clients.(*sync.Map).Range(func(_, _ interface{}) bool {
			onlineUsers++
			return true
		})
	}
	log.Printf("[ChatMessage] Room %s has %d online users", msg.RoomID.Hex(), onlineUsers)

	// Broadcast to WebSocket clients in the room
	h.broadcastToRoom(msg.RoomID.Hex(), payload)
}

func (h *Hub) broadcastToRoom(roomID string, payload []byte) {
	successCount := 0
	failCount := 0

	if clients, ok := h.clients.Load(roomID); ok {
		clients.(*sync.Map).Range(func(uid, conn any) bool {
			ws := conn.(*websocket.Conn)
			if err := ws.WriteMessage(websocket.TextMessage, payload); err != nil {
				log.Printf("[WS] Failed to send to user %s: %v", uid, err)
				_ = ws.Close()
				clients.(*sync.Map).Delete(uid)
				failCount++
			} else {
				successCount++
			}
			return true
		})
	}

	log.Printf("[ChatMessage] Broadcast results for room %s: %d successful, %d failed", 
		roomID, successCount, failCount)
}

// HandleKafkaMessage processes messages from Kafka and broadcasts them to WebSocket clients
func (h *Hub) HandleKafkaMessage(topic string, payload []byte) {
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

		msg := Message{
			RoomID:    rid,
			UserID:    uid,
			Message:   string(data),
			Timestamp: time.Now(),
		}
		h.Broadcast(msg)
	}
}
