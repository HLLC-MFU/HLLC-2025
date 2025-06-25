package controller

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	"context"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type WebSocketHandler struct {
	chatService    ChatService
	roomService    RoomService
}

func NewWebSocketHandler(
	chatService ChatService,
	roomService RoomService,
) *WebSocketHandler {
	return &WebSocketHandler{
		chatService:    chatService,
		roomService:    roomService,
	}
}

// Send chat history
func (h *WebSocketHandler) sendChatHistory(ctx context.Context, conn *websocket.Conn, roomID string) {
	messages, err := h.chatService.GetChatHistoryByRoom(ctx, roomID, 50)
	if err == nil {
		for _, msg := range messages {
					// Get user details with role populated
		var userData map[string]interface{}
		if user, err := h.chatService.GetUserById(ctx, msg.ChatMessage.UserID.Hex()); err == nil {
			userData = map[string]interface{}{
				"_id":      user.ID.Hex(),
				"username": user.Username,
				"name": map[string]interface{}{
					"first":  user.Name.First,
					"middle": user.Name.Middle,
					"last":   user.Name.Last,
				},
			}
			
			// Add role information (excluding permissions)
			if user.Role != primitive.NilObjectID {
				// This would need role service, but for now use basic structure
				userData["role"] = map[string]interface{}{
					"_id": user.Role.Hex(),
					// Note: role name would need additional query
				}
			}
		} else {
			userData = map[string]interface{}{
				"_id": msg.ChatMessage.UserID.Hex(),
			}
		}

		// Determine message type
		var messageType string
		if msg.ChatMessage.StickerID != nil {
			messageType = model.MessageTypeSticker
		} else if msg.ChatMessage.ReplyToID != nil {
			messageType = model.MessageTypeReply
		} else {
			messageType = model.MessageTypeText
		}

		// Create comprehensive payload structure
		payload := map[string]interface{}{
			"room": map[string]interface{}{
				"_id": roomID,
			},
			"message": map[string]interface{}{
				"_id":       msg.ChatMessage.ID.Hex(),
				"type":      messageType,
				"message":   msg.ChatMessage.Message,
				"timestamp": msg.ChatMessage.Timestamp,
			},
			"user":      userData,
			"timestamp": msg.ChatMessage.Timestamp,
		}

			// Add reactions if any
			if len(msg.Reactions) > 0 {
				payload["reactions"] = msg.Reactions
			}

			// Add reply info if exists
			if msg.ReplyTo != nil {
				// Get reply user data
				var replyUserData map[string]interface{}
				if replyUser, err := h.chatService.GetUserById(ctx, msg.ReplyTo.UserID.Hex()); err == nil {
					replyUserData = map[string]interface{}{
						"_id":      replyUser.ID.Hex(),
						"username": replyUser.Username,
						"name":     replyUser.Name,
					}
					
					if replyUser.Role != primitive.NilObjectID {
						replyUserData["role"] = map[string]interface{}{
							"_id": replyUser.Role.Hex(),
						}
					}
				} else {
					replyUserData = map[string]interface{}{
						"_id": msg.ReplyTo.UserID.Hex(),
					}
				}

				payload["replyTo"] = map[string]interface{}{
					"message": map[string]interface{}{
						"_id":       msg.ReplyTo.ID.Hex(),
						"message":   msg.ReplyTo.Message,
						"timestamp": msg.ReplyTo.Timestamp,
					},
					"user": replyUserData,
				}
			}

			// Add sticker info if exists
			if msg.ChatMessage.StickerID != nil {
				payload["sticker"] = map[string]interface{}{
					"_id":   msg.ChatMessage.StickerID.Hex(),
					"image": msg.ChatMessage.Image,
				}
			}

			// Convert to proper Event structure
			event := model.Event{
				Type:      model.EventTypeHistory,
				Payload:   payload,
				Timestamp: msg.ChatMessage.Timestamp,
			}

			if data, err := json.Marshal(event); err == nil {
				conn.WriteMessage(websocket.TextMessage, data)
			}
		}
	}
}

func (h *WebSocketHandler) HandleWebSocket(conn *websocket.Conn) {
	roomID := conn.Params("roomId")
	userID := conn.Params("userId")

	if userID == "" || roomID == "" {
		conn.WriteMessage(websocket.TextMessage, []byte("Missing roomID or userID"))
		conn.Close()
		return
	}

	ctx := context.Background()
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Invalid room ID"))
		conn.Close()
		return
	}

	// Validate and track connection using RoomService
	if err := h.roomService.ValidateAndTrackConnection(ctx, roomObjID, userID); err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte(err.Error()))
		conn.Close()
		return
	}

	// Subscribe to room's Kafka topic (non-blocking)
	if err := h.chatService.SubscribeToRoom(ctx, roomID); err != nil {
		log.Printf("[WARN] Failed to subscribe to room topic (continuing without Kafka): %v", err)
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		h.roomService.RemoveConnection(ctx, roomObjID, userID)
		conn.WriteMessage(websocket.TextMessage, []byte("Invalid user ID"))
		conn.Close()
		return
	}

	// Send room status
	if status, err := h.roomService.GetRoomStatus(ctx, roomObjID); err == nil {
		if statusBytes, err := json.Marshal(map[string]interface{}{
			"type": "room_status",
			"data": status,
		}); err == nil {
			conn.WriteMessage(websocket.TextMessage, statusBytes)
		}
	}

	// Send chat history
	h.sendChatHistory(ctx, conn, roomID)

	// Create client object
	client := &model.ClientObject{
		RoomID: roomObjID,
		UserID: userObjID,
		Conn:   conn,
	}

	// Register client with hub first
	h.chatService.GetHub().Register(utils.Client{
		Conn:   conn,
		RoomID: roomObjID,
		UserID: userObjID,
	})

	// WebSocket connection established - no notification needed
	log.Printf("[DEBUG] User %s connected to WebSocket for room %s", userObjID.Hex(), roomID)
	
	defer func() {
		// WebSocket disconnection - no notification needed
		log.Printf("[DEBUG] User %s disconnected from WebSocket for room %s", userObjID.Hex(), roomID)

		// Unregister and cleanup
		h.chatService.GetHub().Unregister(utils.Client{
			Conn:   conn,
			RoomID: roomObjID,
			UserID: userObjID,
		})
		h.roomService.RemoveConnection(ctx, roomObjID, userID)
		
		// Unsubscribe from room's Kafka topic if no more clients
		if count, err := h.roomService.GetActiveConnectionsCount(ctx, roomObjID); err == nil && count == 0 {
			if err := h.chatService.UnsubscribeFromRoom(ctx, roomID); err != nil {
				log.Printf("[WARN] Failed to unsubscribe from room topic: %v", err)
			}
		}
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}

		messageText := strings.TrimSpace(string(msg))

		// Handle different message types
		switch {
		case strings.HasPrefix(messageText, "/reply"):
			h.handleReplyMessage(messageText, *client)
		case strings.HasPrefix(messageText, "/react"):
			h.handleReactionMessage(messageText, *client)
		case messageText == "/leave":
			h.handleLeaveMessage(ctx, *client)
			return
		default:
			// Create message and send it once
			chatMsg := &model.ChatMessage{
				RoomID:    roomObjID,
				UserID:    userObjID,
				Message:   messageText,
				Timestamp: time.Now(),
			}
			
			// Send message through single channel
			if err := h.chatService.SendMessage(ctx, chatMsg); err != nil {
				log.Printf("[ERROR] Failed to send message: %v", err)
				continue
			}
		}
	}
}

// Helper methods for WebSocket message handling
func (h *WebSocketHandler) handleReplyMessage(messageText string, client model.ClientObject) {
	parts := strings.SplitN(messageText, " ", 3)
	if len(parts) < 3 {
		return
	}

	replyToID, err := primitive.ObjectIDFromHex(parts[1])
	if err != nil {
		return
	}

	msg := &model.ChatMessage{
		RoomID:    client.RoomID,
		UserID:    client.UserID,
		Message:   parts[2],
		ReplyToID: &replyToID,
		Timestamp: time.Now(),
	}

	// Send reply message through single channel
	if err := h.chatService.SendMessage(context.Background(), msg); err != nil {
		log.Printf("[ERROR] Failed to send reply message: %v", err)
	}
}

func (h *WebSocketHandler) handleReactionMessage(messageText string, client model.ClientObject) {
	parts := strings.Split(messageText, " ")
	if len(parts) != 3 {
		return
	}

	messageID, err := primitive.ObjectIDFromHex(parts[1])
	if err != nil {
		return
	}

	reaction := &model.MessageReaction{
		MessageID: messageID,
		UserID:    client.UserID,
		Reaction:  parts[2],
		Timestamp: time.Now(),
	}

	if err := h.chatService.HandleReaction(context.Background(), reaction); err != nil {
		log.Printf("[ERROR] Failed to handle reaction: %v", err)
	}
}

func (h *WebSocketHandler) handleLeaveMessage(ctx context.Context, client model.ClientObject) {
	if _, err := h.roomService.RemoveUserFromRoom(ctx, client.RoomID, client.UserID.Hex()); err != nil {
		log.Printf("[ERROR] Failed to remove user from room: %v", err)
	}
} 