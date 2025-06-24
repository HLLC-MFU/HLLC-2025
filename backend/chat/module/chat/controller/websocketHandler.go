package controller

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	"context"
	"encoding/json"
	"fmt"
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
			// Convert history message to regular message format
			event := utils.ChatEvent{
				Type:      "message",
				RoomID:    msg.ChatMessage.RoomID.Hex(),
				Message:   msg.ChatMessage.Message,
				Timestamp: msg.ChatMessage.Timestamp,
			}

			// Get user details using the service's GetUserById method
			if user, err := h.chatService.GetUserById(ctx, msg.ChatMessage.UserID.Hex()); err == nil {
				event.UserID = map[string]interface{}{
					"_id":      user.ID.Hex(),
					"username": user.Username,
					"name":     user.Name,
				}
			} else {
				event.UserID = msg.ChatMessage.UserID.Hex()
			}

			// Add reactions if any
			if len(msg.Reactions) > 0 {
				event.Payload = map[string]interface{}{
					"reactions": msg.Reactions,
				}
			}

			// Add reply info if exists
			if msg.ReplyTo != nil {
				event.Payload = map[string]interface{}{
					"replyTo": msg.ReplyTo,
				}
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

	// Subscribe to room's Kafka topic
	if err := h.chatService.SubscribeToRoom(ctx, roomID); err != nil {
		log.Printf("[WARN] Failed to subscribe to room topic: %v", err)
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

	// Send join event to the new connection itself
	joinSelfEvent := model.ChatEvent{
		EventType: "notice",
		Payload: map[string]interface{}{
			"userId": userObjID.Hex(),
			"message": "You have joined the chat room",
			"timestamp": time.Now(),
		},
	}
	if eventBytes, err := json.Marshal(joinSelfEvent); err == nil {
		log.Printf("[DEBUG] Sending self join notification to user %s", userObjID.Hex())
		conn.WriteMessage(websocket.TextMessage, eventBytes)
	}

	// Then broadcast join event to all other clients
	joinOthersEvent := model.ChatEvent{
		EventType: "user_joined",
		Payload: map[string]interface{}{
			"userId": userObjID.Hex(),
			"message": fmt.Sprintf("User %s has joined the chat room", userObjID.Hex()),
			"timestamp": time.Now(),
		},
	}
	if eventBytes, err := json.Marshal(joinOthersEvent); err == nil {
		log.Printf("[DEBUG] Broadcasting join notification about user %s to others", userObjID.Hex())
		h.chatService.GetHub().BroadcastToRoomExcept(roomID, userObjID.Hex(), eventBytes)
	}
	
	defer func() {
		// First broadcast leave event to all other clients
		leaveOthersEvent := model.ChatEvent{
			EventType: "user_left",
			Payload: map[string]interface{}{
				"userId": userObjID.Hex(),
				"message": fmt.Sprintf("User %s has left the chat room", userObjID.Hex()),
				"timestamp": time.Now(),
			},
		}
		if eventBytes, err := json.Marshal(leaveOthersEvent); err == nil {
			log.Printf("[DEBUG] Broadcasting leave notification about user %s to others", userObjID.Hex())
			h.chatService.GetHub().BroadcastToRoomExcept(roomID, userObjID.Hex(), eventBytes)
		}

		// Send leave event to the user's own connection
		leaveSelfEvent := model.ChatEvent{
			EventType: "notice",
			Payload: map[string]interface{}{
				"userId": userObjID.Hex(),
				"message": "You have left the chat room",
				"timestamp": time.Now(),
			},
		}
		if eventBytes, err := json.Marshal(leaveSelfEvent); err == nil {
			log.Printf("[DEBUG] Sending self leave notification to user %s", userObjID.Hex())
			conn.WriteMessage(websocket.TextMessage, eventBytes)
		}

		// Then unregister and cleanup
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
			h.handleLeaveMessage(ctx, messageText, *client)
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

func (h *WebSocketHandler) handleLeaveMessage(ctx context.Context, messageText string, client model.ClientObject) {
	if _, err := h.roomService.RemoveUserFromRoom(ctx, client.RoomID, client.UserID.Hex()); err != nil {
		log.Printf("[ERROR] Failed to remove user from room: %v", err)
	}
} 