package service

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	"chat/pkg/database/queries"
	"chat/pkg/helpers/service"
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
)

type ChatService struct {
	*queries.BaseService[model.ChatMessage]
	cache       *utils.ChatCacheService
	hub         *utils.Hub
	fkValidator *service.ForeignKeyValidator
	collection  *mongo.Collection
}

// GetHub returns the hub instance for WebSocket management
func (s *ChatService) GetHub() *utils.Hub {
	return s.hub
}

func NewChatService(
	db *mongo.Database,
	redis *redis.Client,
	hub *utils.Hub,
) *ChatService {
	collection := db.Collection("chat_messages")
	return &ChatService{
		BaseService:  queries.NewBaseService[model.ChatMessage](collection),
		cache:       utils.NewChatCacheService(redis),
		hub:         hub,
		fkValidator: service.NewForeignKeyValidator(db),
		collection:  collection,
	}
}

func (s *ChatService) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error) {
	// Try cache first
	messages, err := s.cache.GetRoomMessages(ctx, roomID, int(limit))
	if err == nil && len(messages) > 0 {
		return messages, nil
	}

	// Fallback to MongoDB
	opts := queries.QueryOptions{
		Filter: map[string]interface{}{"room_id": roomID},
		Sort:   "-timestamp",
		Limit:  int(limit),
	}

	result, err := s.FindAll(ctx, opts)
	if err != nil {
		return nil, err
	}

	// Enrich messages and cache them
	enriched := make([]model.ChatMessageEnriched, len(result.Data))
	for i, msg := range result.Data {
		enriched[i] = model.ChatMessageEnriched{
			ChatMessage: msg,
		}
		// Cache each message
		if err := s.cache.SaveMessage(ctx, roomID, &enriched[i]); err != nil {
			log.Printf("Failed to cache message: %v", err)
		}
	}

	return enriched, nil
}

func (s *ChatService) SaveMessage(ctx context.Context, msg *model.ChatMessage) error {
	// Validate foreign keys
	if err := s.fkValidator.ValidateForeignKeys(ctx, map[string]interface{}{
		"rooms": msg.RoomID,
		"users": msg.UserID,
	}); err != nil {
		return err
	}

	// Set timestamp
	if msg.Timestamp.IsZero() {
		msg.Timestamp = time.Now()
	}

	// Save to MongoDB
	result, err := s.Create(ctx, *msg)
	if err != nil {
		return err
	}
	msg.ID = result.Data[0].ID

	// Cache the message
	enriched := model.ChatMessageEnriched{
		ChatMessage: *msg,
	}
	if err := s.cache.SaveMessage(ctx, msg.RoomID.Hex(), &enriched); err != nil {
		log.Printf("Failed to cache message: %v", err)
	}

	// Create chat event for broadcasting
	event := utils.ChatEvent{
		Type:      "message",
		RoomID:    msg.RoomID.Hex(),
		UserID:    msg.UserID.Hex(),
		Message:   msg.Message,
		Timestamp: msg.Timestamp,
	}

	// Marshal event to JSON
	eventBytes, err := json.Marshal(event)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal chat event: %v", err)
		return err
	}

	// Broadcast to all clients in the room
	s.hub.BroadcastRaw(msg.RoomID.Hex(), eventBytes)

	return nil
}

func (s *ChatService) HandleReaction(ctx context.Context, reaction *model.MessageReaction) error {
	// Get message first to get roomID
	msg, err := s.FindOneById(ctx, reaction.MessageID.Hex())
	if err != nil {
		return err
	}

	// Update message with reaction
	update := map[string]interface{}{
		"$push": map[string]interface{}{
			"reactions": reaction,
		},
	}
	
	if _, err := s.UpdateById(ctx, reaction.MessageID.Hex(), update); err != nil {
		return err
	}

	// Cache the reaction
	if err := s.cache.SaveReaction(ctx, msg.Data[0].RoomID.Hex(), reaction.MessageID.Hex(), reaction); err != nil {
		log.Printf("Failed to cache reaction: %v", err)
	}

	return nil
}

func (s *ChatService) DeleteRoomMessages(ctx context.Context, roomID string) error {
	// Delete from MongoDB
	filter := map[string]interface{}{
		"room_id": roomID,
	}
	if _, err := s.collection.DeleteMany(ctx, filter); err != nil {
		return err
	}

	// Delete from cache
	if err := s.cache.DeleteRoomMessages(ctx, roomID); err != nil {
		log.Printf("Failed to delete messages from cache: %v", err)
	}

	return nil
}