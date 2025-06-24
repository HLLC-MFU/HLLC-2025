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
	RoomTopicPrefix = "chat-room-"
)

type(
	ChatEvent struct {
		Type      string      `json:"type"`
		RoomID    string      `json:"roomId"`
		UserID    interface{} `json:"userId"` // Can be either string or populated User object
		Message   string      `json:"message"`
		Timestamp time.Time   `json:"timestamp"`
		Payload   interface{} `json:"payload,omitempty"`
	}

	Client struct {
		Conn   *websocket.Conn
		RoomID primitive.ObjectID
		UserID primitive.ObjectID
	}

	Hub struct {
		clients sync.Map
	}
) 

func NewHub() *Hub {
	return &Hub{}
}

func getRoomTopic(roomID string) string {
	return fmt.Sprintf("%s%s", RoomTopicPrefix, roomID)
}

func (h *Hub) Register(c Client) {
	roomKey := c.RoomID.Hex()
	userKey := c.UserID.Hex()
	connID := fmt.Sprintf("%p", c.Conn)

	log.Printf("[DEBUG] Registering user with ID=%s in room=%s", userKey, roomKey)

	roomMap, _ := h.clients.LoadOrStore(roomKey, &sync.Map{})
	userConns, _ := roomMap.(*sync.Map).LoadOrStore(userKey, &sync.Map{})
	userConns.(*sync.Map).Store(connID, c.Conn)

	// Log all registered users in the room
	log.Printf("[DEBUG] Current users in room %s:", roomKey)
	roomMap.(*sync.Map).Range(func(uid, _ interface{}) bool {
		log.Printf("[DEBUG] - User: %v", uid)
		return true
	})

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

			hasConnections := false
			userConns.(*sync.Map).Range(func(_, _ interface{}) bool {
				hasConnections = true
				return false
			})

			if !hasConnections {
				roomMap.(*sync.Map).Delete(userKey)
			}

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

func (h *Hub) BroadcastEvent(event ChatEvent) {
	log.Printf("[ChatMessage] Broadcasting event type=%s from user %s to room %s", 
		event.Type, event.UserID, event.RoomID)

	payload, err := json.Marshal(event)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal event: %v", err)
		return
	}

	h.BroadcastToRoom(event.RoomID, payload)
}

func (h *Hub) BroadcastToRoom(roomID string, payload []byte) {
	successCount := 0
	failCount := 0

	if roomMap, ok := h.clients.Load(roomID); ok {
		log.Printf("[WS] Broadcasting to room %s", roomID)
		
		roomMap.(*sync.Map).Range(func(userID, userConns interface{}) bool {
			log.Printf("[WS] Broadcasting to user %s in room %s", userID, roomID)
			
			activeConns := 0
			userConns.(*sync.Map).Range(func(connID, conn interface{}) bool {
				ws := conn.(*websocket.Conn)
				if err := ws.WriteMessage(websocket.TextMessage, payload); err != nil {
					log.Printf("[WS] Failed to send to user %s (connection: %s): %v", userID, connID, err)
					_ = ws.Close()
					userConns.(*sync.Map).Delete(connID)
					failCount++
				} else {
					log.Printf("[WS] Successfully sent message to user %s (connection: %s)", userID, connID)
					successCount++
					activeConns++
				}
				return true
			})
			
			if activeConns == 0 {
				log.Printf("[WS] Removing user %s from room %s (no active connections)", userID, roomID)
				roomMap.(*sync.Map).Delete(userID)
			}
			
			return true
		})

		log.Printf("[WS] Broadcast complete for room %s: %d successful, %d failed", 
			roomID, successCount, failCount)
	} else {
		log.Printf("[WS] No clients found for room %s", roomID)
	}
}

func (h *Hub) BroadcastToRoomExcept(roomID string, excludeUserID string, payload []byte) {
	successCount := 0
	failCount := 0

	if roomMap, ok := h.clients.Load(roomID); ok {
		log.Printf("[DEBUG] Broadcasting to room %s (excluding user %s)", roomID, excludeUserID)
		
		// Log all users in the room before broadcasting
		log.Printf("[DEBUG] Current users in room %s before broadcast:", roomID)
		roomMap.(*sync.Map).Range(func(uid, _ interface{}) bool {
			log.Printf("[DEBUG] - Found user: %v", uid)
			return true
		})
		
		roomMap.(*sync.Map).Range(func(userID, userConns interface{}) bool {
			uidStr, ok := userID.(string)
			if !ok {
				log.Printf("[ERROR] Invalid userID type in sync.Map: %T", userID)
				return true
			}

			// Skip the excluded user - using exact string comparison
			if uidStr == excludeUserID {
				log.Printf("[DEBUG] Skipping excluded user: %s", uidStr)
				return true
			}

			log.Printf("[WS] Broadcasting to user %s in room %s", uidStr, roomID)
			
			activeConns := 0
			userConns.(*sync.Map).Range(func(connID, conn interface{}) bool {
				ws := conn.(*websocket.Conn)
				if err := ws.WriteMessage(websocket.TextMessage, payload); err != nil {
					log.Printf("[WS] Failed to send to user %s (connection: %s): %v", uidStr, connID, err)
					_ = ws.Close()
					userConns.(*sync.Map).Delete(connID)
					failCount++
				} else {
					log.Printf("[WS] Successfully sent message to user %s (connection: %s)", uidStr, connID)
					successCount++
					activeConns++
				}
				return true
			})
			
			if activeConns == 0 {
				log.Printf("[WS] Removing user %s from room %s (no active connections)", uidStr, roomID)
				roomMap.(*sync.Map).Delete(userID)
			}
			
			return true
		})

		log.Printf("[WS] Broadcast complete for room %s (except user %s): %d successful, %d failed", 
			roomID, excludeUserID, successCount, failCount)
	} else {
		log.Printf("[WS] No clients found for room %s", roomID)
	}
}

func (h *Hub) HandleKafkaMessage(topic string, payload []byte) error {
	roomID := topic[len(RoomTopicPrefix):]
	if roomID == "" {
		log.Printf("[ERROR] Invalid topic format: %s", topic)
		return fmt.Errorf("invalid topic format: %s", topic)
	}

	var event ChatEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		log.Printf("[ERROR] Failed to unmarshal Kafka message: %v", err)
		return fmt.Errorf("failed to unmarshal Kafka message: %w", err)
	}

	log.Printf("[ChatMessage] Received Kafka message from topic %s: type=%s, room=%s, user=%s", 
		topic, event.Type, event.RoomID, event.UserID)

	h.BroadcastToRoom(roomID, payload)
	
	return nil
}
