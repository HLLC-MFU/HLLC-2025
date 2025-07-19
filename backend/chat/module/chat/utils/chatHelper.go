package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	RoomTopicPrefix = "chat-room-"
)

type(
	ChatEvent struct {
		Type    string      `json:"type"`
		Payload interface{} `json:"payload"`
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

func isEmptyMessage(payload interface{}) bool {
    switch msg := payload.(type) {
    case map[string]interface{}:
        // ตรวจสอบ fields ใน map
        if msg["Message"] == "" &&
            (msg["StickerID"] == nil || msg["StickerID"] == "") &&
            msg["FileName"] == "" &&
            msg["EvoucherInfo"] == nil &&
            msg["MentionInfo"] == nil &&
            msg["ModerationInfo"] == nil {
            return true
        }
    default:
        // ใช้ reflection หรือแปลงเป็น map เพื่อตรวจสอบ (ถ้าจำเป็น)
        // หรือถ้า payload เป็น struct type ที่คุณรู้จัก ก็แปลงและเช็คตรงๆได้
    }
    return false
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
	log.Printf("[ChatMessage] Broadcasting event type=%s", event.Type)

	// Check if the event payload is empty
	if isEmptyMessage(event.Payload) {
		log.Printf("[DEBUG] Skipping broadcast: empty chat message detected")
		return
	}


	payload, err := json.Marshal(event)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal event: %v", err)
		return
	}

	// Log the payload structure for debugging
	log.Printf("[DEBUG] Event payload structure: %+v", event.Payload)

	// Extract roomID from payload - handle different payload types
	var roomID string
	
	// Try to extract roomID using reflection for struct types
	switch payload := event.Payload.(type) {
	case map[string]interface{}:
		// Handle map payload (old format)
		if room, exists := payload["room"]; exists {
			if roomData, ok := room.(map[string]interface{}); ok {
				if roomIDVal, exists := roomData["_id"]; exists {
					roomID = fmt.Sprintf("%v", roomIDVal)
				} else if roomIDVal, exists := roomData["id"]; exists {
					roomID = fmt.Sprintf("%v", roomIDVal)
				}
			}
		}
		// Fallback: try direct roomId field
		if roomID == "" {
			if roomIDVal, exists := payload["roomId"]; exists {
				roomID = fmt.Sprintf("%v", roomIDVal)
			}
		}
	default:
		// Handle struct payload (new format) - convert to JSON then back to map
		jsonBytes, err := json.Marshal(event.Payload)
		if err == nil {
			var payloadMap map[string]interface{}
			if err := json.Unmarshal(jsonBytes, &payloadMap); err == nil {
				if room, exists := payloadMap["room"]; exists {
					if roomData, ok := room.(map[string]interface{}); ok {
						if roomIDVal, exists := roomData["_id"]; exists {
							roomID = fmt.Sprintf("%v", roomIDVal)
						} else if roomIDVal, exists := roomData["id"]; exists {
							roomID = fmt.Sprintf("%v", roomIDVal)
						}
					}
				}
				// Fallback: try direct roomId field
				if roomID == "" {
					if roomIDVal, exists := payloadMap["roomId"]; exists {
						roomID = fmt.Sprintf("%v", roomIDVal)
					}
				}
			}
		}
	}

	if roomID != "" {
		log.Printf("[DEBUG] Found room ID: %s, broadcasting to room", roomID)
		h.BroadcastToRoom(roomID, payload)
	} else {
		log.Printf("[WARN] Cannot broadcast event - no room ID found in payload")
	}
}

func (h *Hub) BroadcastToRoom(roomID string, payload []byte) {
	successCount := 0
	failCount := 0
	// Check if the event payload is empty
	if isEmptyMessage(payload) {
		log.Printf("[DEBUG] Skipping broadcast: empty chat message detected")
		return
	}
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
		// Check if the event payload is empty
	if isEmptyMessage(payload) {
		log.Printf("[DEBUG] Skipping broadcast: empty chat message detected")
		return
	}
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

// IsUserOnlineInRoom checks if a user is currently connected to a specific room
func (h *Hub) IsUserOnlineInRoom(roomID string, userID string) bool {
	if roomMap, ok := h.clients.Load(roomID); ok {
		if userConns, ok := roomMap.(*sync.Map).Load(userID); ok {
			// Check if user has any active connections
			hasActiveConnection := false
			userConns.(*sync.Map).Range(func(_, _ interface{}) bool {
				hasActiveConnection = true
				return false // Stop iteration once we find one connection
			})
			return hasActiveConnection
		}
	}
	return false
}

// GetOnlineUsersInRoom returns a list of users currently online in a specific room
func (h *Hub) GetOnlineUsersInRoom(roomID string) []string {
	var onlineUsers []string
	
	if roomMap, ok := h.clients.Load(roomID); ok {
		roomMap.(*sync.Map).Range(func(userID, userConns interface{}) bool {
			if userIDStr, ok := userID.(string); ok {
				// Check if user has any active connections
				hasActiveConnection := false
				userConns.(*sync.Map).Range(func(_, _ interface{}) bool {
					hasActiveConnection = true
					return false // Stop iteration once we find one connection
				})
				
				if hasActiveConnection {
					onlineUsers = append(onlineUsers, userIDStr)
				}
			}
			return true
		})
	}
	
	return onlineUsers
}

// GetConnectedRooms returns a map of room IDs that have active connections
func (h *Hub) GetConnectedRooms() map[string]bool {
	connectedRooms := make(map[string]bool)
	
	// Iterate through all rooms in the hub
	h.clients.Range(func(roomID, roomMap interface{}) bool {
		if roomIDStr, ok := roomID.(string); ok {
			// Check if the room has any active users
			if roomMapSync, ok := roomMap.(*sync.Map); ok {
				hasActiveUsers := false
				roomMapSync.Range(func(userID, userConns interface{}) bool {
					if userConnsSync, ok := userConns.(*sync.Map); ok {
						userConnsSync.Range(func(connID, conn interface{}) bool {
							hasActiveUsers = true
							return false // Stop after finding one active connection
						})
					}
					return !hasActiveUsers // Stop if we found active users
				})
				
				if hasActiveUsers {
					connectedRooms[roomIDStr] = true
				}
			}
		}
		return true
	})
	
	return connectedRooms
}

// BroadcastToUser ส่งข้อความไปยัง user เฉพาะ (ทุกห้องที่ user นั้นอยู่)
func (h *Hub) BroadcastToUser(targetUserID string, payload []byte) {
	successCount := 0
	failCount := 0
		// Check if the event payload is empty
	if isEmptyMessage(payload) {
		log.Printf("[DEBUG] Skipping broadcast: empty chat message detected")
		return
	}
	log.Printf("[WS] Broadcasting to user %s across all rooms", targetUserID)
	
	// วนลูปทุก room เพื่อหา user
	h.clients.Range(func(roomIDInterface, roomMapInterface interface{}) bool {
		roomID, ok := roomIDInterface.(string)
		if !ok {
			return true
		}
		
		roomMap := roomMapInterface.(*sync.Map)
		
		// ตรวจสอบว่า user อยู่ใน room นี้หรือไม่
		if userConns, exists := roomMap.Load(targetUserID); exists {
			log.Printf("[WS] Found user %s in room %s, sending message", targetUserID, roomID)
			
			// ส่งข้อความไปยังทุก connection ของ user ใน room นี้
			userConns.(*sync.Map).Range(func(connID, conn interface{}) bool {
				ws := conn.(*websocket.Conn)
				if err := ws.WriteMessage(websocket.TextMessage, payload); err != nil {
					log.Printf("[WS] Failed to send to user %s (connection: %s): %v", targetUserID, connID, err)
					_ = ws.Close()
					userConns.(*sync.Map).Delete(connID)
					failCount++
				} else {
					log.Printf("[WS] Successfully sent message to user %s (connection: %s) in room %s", targetUserID, connID, roomID)
					successCount++
				}
				return true
			})
		}
		return true
	})
	
	log.Printf("[WS] Broadcast to user %s complete: %d successful, %d failed", targetUserID, successCount, failCount)
}

// ForceDisconnectAllUsersFromRoom forcefully disconnects all users from a specific room
func (h *Hub) ForceDisconnectAllUsersFromRoom(roomID string) int {
	disconnectedCount := 0
	
	if roomMap, ok := h.clients.Load(roomID); ok {
		log.Printf("[WS] Force disconnecting all users from room %s", roomID)
		
		roomMap.(*sync.Map).Range(func(userID, userConns interface{}) bool {
			userIDStr, ok := userID.(string)
			if !ok {
				return true
			}
			
			log.Printf("[WS] Force disconnecting user %s from room %s", userIDStr, roomID)
			
			// Close all connections for this user in this room
			userConns.(*sync.Map).Range(func(connID, conn interface{}) bool {
				ws := conn.(*websocket.Conn)
				log.Printf("[WS] Closing WebSocket connection %s for user %s in room %s", connID, userIDStr, roomID)
				
				// Send a close message before closing
				closeMsg := websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Room deactivated")
				_ = ws.WriteMessage(websocket.CloseMessage, closeMsg)
				
				// Close the connection
				_ = ws.Close()
				
				// Remove from the map
				userConns.(*sync.Map).Delete(connID)
				disconnectedCount++
				
				return true
			})
			
			// Remove the user from the room map since all connections are closed
			roomMap.(*sync.Map).Delete(userID)
			
			return true
		})
		
		log.Printf("[WS] Force disconnected %d connections from room %s", disconnectedCount, roomID)
	} else {
		log.Printf("[WS] No users found in room %s to disconnect", roomID)
	}
	
	return disconnectedCount
}

// ForceDisconnectUserFromRoom forcefully disconnects a specific user from a specific room
func (h *Hub) ForceDisconnectUserFromRoom(roomID string, userID string) int {
	disconnectedCount := 0
	
	if roomMap, ok := h.clients.Load(roomID); ok {
		if userConns, ok := roomMap.(*sync.Map).Load(userID); ok {
			log.Printf("[WS] Force disconnecting user %s from room %s", userID, roomID)
			
			// Close all connections for this user in this room
			userConns.(*sync.Map).Range(func(connID, conn interface{}) bool {
				ws := conn.(*websocket.Conn)
				log.Printf("[WS] Closing WebSocket connection %s for user %s in room %s", connID, userID, roomID)
				
				// Send a close message before closing
				closeMsg := websocket.FormatCloseMessage(websocket.CloseNormalClosure, "You have been kicked from this room")
				_ = ws.WriteMessage(websocket.CloseMessage, closeMsg)
				
				// Close the connection
				_ = ws.Close()
				
				// Remove from the map
				userConns.(*sync.Map).Delete(connID)
				disconnectedCount++
				
				return true
			})
			
			// Remove the user from the room map since all connections are closed
			roomMap.(*sync.Map).Delete(userID)
			
			log.Printf("[WS] Force disconnected %d connections for user %s from room %s", disconnectedCount, userID, roomID)
		} else {
			log.Printf("[WS] User %s not found in room %s", userID, roomID)
		}
	} else {
		log.Printf("[WS] Room %s not found", roomID)
	}
	
	return disconnectedCount
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

	log.Printf("[ChatMessage] Received Kafka message from topic %s: type=%s", topic, event.Type)

	h.BroadcastToRoom(roomID, payload)
	
	return nil
}
