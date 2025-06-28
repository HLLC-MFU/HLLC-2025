package service

import (
	"chat/module/chat/model"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// SendEvoucherMessage sends an evoucher message to a room
func (s *ChatService) SendEvoucherMessage(ctx context.Context, userID, roomID primitive.ObjectID, evoucherInfo *model.EvoucherInfo) (*model.ChatMessage, error) {
	log.Printf("[ChatService] SendEvoucherMessage called for room %s by user %s, evoucher: %s", 
		roomID.Hex(), userID.Hex())

	// Validate foreign keys
	if err := s.fkValidator.ValidateForeignKeys(ctx, map[string]interface{}{
		"users": userID,
		"rooms": roomID,
	}); err != nil {
		return nil, fmt.Errorf("foreign key validation failed: %w", err)
	}

	// Create evoucher message with display text
	displayMessage := fmt.Sprintf("🎟️ %s\n💰 %s\n📝 %s", 
		evoucherInfo.Title, 
		evoucherInfo.Description)

	msg := &model.ChatMessage{
		RoomID:       roomID,
		UserID:       userID,
		Message:      displayMessage,
		EvoucherInfo: evoucherInfo,
		Timestamp:    time.Now(),
	}

	// Create message in database
	result, err := s.Create(ctx, *msg)
	if err != nil {
		return nil, fmt.Errorf("failed to save evoucher message: %w", err)
	}
	msg.ID = result.Data[0].ID

	log.Printf("[ChatService] Evoucher message saved to database with ID: %s", msg.ID.Hex())
	
	// Cache the message
	enriched := model.ChatMessageEnriched{
		ChatMessage: *msg,
	}
	if err := s.cache.SaveMessage(ctx, roomID.Hex(), &enriched); err != nil {
		log.Printf("[ChatService] Failed to cache evoucher message: %v", err)
	}

	// Emit evoucher message to WebSocket and Kafka
	if err := s.emitter.EmitEvoucherMessage(ctx, msg); err != nil {
		log.Printf("[ChatService] Failed to emit evoucher message: %v", err)
	} else {
		log.Printf("[ChatService] Successfully emitted evoucher message ID=%s to WebSocket and Kafka", msg.ID.Hex())
	}

	// **NEW: Notify all users in room using NotificationService**
	onlineUsers := s.hub.GetOnlineUsersInRoom(msg.RoomID.Hex())
	s.notificationService.NotifyUsersInRoom(ctx, msg, onlineUsers)

	return msg, nil
}

// Helper function to format currency
func formatCurrency(value float64, currency string) string {
	if currency == "" {
		currency = "THB"
	}
	if value == 0 {
		return "Free!"
	}
	return fmt.Sprintf("%.2f %s", value, currency)
} 