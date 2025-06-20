package utils

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Message struct {
	RoomID    primitive.ObjectID `json:"roomId"`
	UserID    primitive.ObjectID `json:"userId"`
	Message   string             `json:"message"`
	Timestamp time.Time          `json:"timestamp"`
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
	payload, _ := json.Marshal(msg)
	topic := "chat-room-" + msg.RoomID.Hex()
	_ = h.publish(topic, msg.UserID.Hex(), payload)

	if clients, ok := h.clients.Load(msg.RoomID.Hex()); ok {
		clients.(*sync.Map).Range(func(uid, conn any) bool {
			ws := conn.(*websocket.Conn)
			if err := ws.WriteMessage(websocket.TextMessage, payload); err != nil {
				log.Printf("[WS] Failed to send to %s: %v", uid, err)
				_ = ws.Close()
				clients.(*sync.Map).Delete(uid)
			}
			return true
		})
	}
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
