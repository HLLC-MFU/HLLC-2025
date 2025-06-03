package service

import (
	"context"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/redis"
)

type ChatMessageHandler struct {
	service *service
}

func NewChatMessageHandler(s *service) *ChatMessageHandler {
	return &ChatMessageHandler{
		service: s,
	}
}

func (h *ChatMessageHandler) HandleMessage(ctx context.Context, msg *model.ChatMessage) error {
	// Save to MongoDB
	if err := h.service.SaveChatMessage(ctx, msg); err != nil {
		log.Printf("[Message Handler] Failed to save message to MongoDB: %v", err)
		return err
	}

	// Cache in Redis
	if err := redis.SaveChatMessageToRoom(msg.RoomID, msg); err != nil {
		log.Printf("[Message Handler] Failed to cache message in Redis: %v", err)
		// Don't return error here as the message is already saved in MongoDB
	}

	// Broadcast to WebSocket clients
	payload := model.MessagePayload{
		UserID:   msg.UserID,
		RoomID:   msg.RoomID,
		Message:  msg.Message,
		Mentions: msg.Mentions,
	}
	event := model.ChatEvent{
		EventType: "message",
		Payload:   payload,
	}

	// Send to all clients in the room except sender
	for userID, conn := range model.Clients[msg.RoomID] {
		if userID == msg.UserID {
			continue // Skip sender
		}

		if conn == nil {
			// Notify offline users
			h.service.notifyOfflineUser(userID, msg.RoomID, msg.UserID, msg.Message)
			continue
		}

		if err := sendJSONMessage(conn, event); err != nil {
			log.Printf("[Message Handler] Failed to send to WebSocket client %s: %v", userID, err)
			conn.Close()
			model.Clients[msg.RoomID][userID] = nil
			h.service.notifyOfflineUser(userID, msg.RoomID, msg.UserID, msg.Message)
		}
	}

	return nil
}
