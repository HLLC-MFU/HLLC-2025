package service

import (
	"chat/module/chat/model"
	"context"
	"fmt"
	"log"
)

// SendMessage sends a chat message
func (s *ChatService) SendMessage(ctx context.Context, msg *model.ChatMessage) error {
	log.Printf("[ChatService] SendMessage called for room %s by user %s", msg.RoomID.Hex(), msg.UserID.Hex())

	// Validate foreign keys
	if err := s.fkValidator.ValidateForeignKeys(ctx, map[string]interface{}{
		"users": msg.UserID,
		"rooms": msg.RoomID,
	}); err != nil {
		return fmt.Errorf("foreign key validation failed: %w", err)
	}

	// Create message in database
	result, err := s.Create(ctx, *msg)
	if err != nil {
		return fmt.Errorf("failed to save message: %w", err)
	}
	msg.ID = result.Data[0].ID

	log.Printf("[ChatService] Message saved to database with ID: %s", msg.ID.Hex())
	
	// Cache the message
	enriched := model.ChatMessageEnriched{
		ChatMessage: *msg,
	}
	if err := s.cache.SaveMessage(ctx, msg.RoomID.Hex(), &enriched); err != nil {
		log.Printf("[ChatService] Failed to cache message: %v", err)
	}

	// Emit message to WebSocket and Kafka
	if err := s.emitter.EmitMessage(ctx, msg); err != nil {
		log.Printf("[ChatService] Failed to emit message: %v", err)
	} else {
		log.Printf("[ChatService] Successfully emitted message ID=%s to WebSocket and Kafka", msg.ID.Hex())
	}

	// **NEW: Notify all users in room using NotificationService**
	onlineUsers := s.hub.GetOnlineUsersInRoom(msg.RoomID.Hex())
	s.notificationService.NotifyUsersInRoom(ctx, msg, onlineUsers)

	return nil
} 