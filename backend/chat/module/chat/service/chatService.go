package service

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	"chat/pkg/helpers/service"
	"context"
	"encoding/json"
	"fmt"
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
	emitter     *utils.ChatEventEmitter
	kafkaBus    *kafka.Bus
}

// GetHub returns the hub instance for WebSocket management
func (s *ChatService) GetHub() *utils.Hub {
	return s.hub
}

func NewChatService(
	db *mongo.Database,
	redis *redis.Client,
	kafkaBus *kafka.Bus,
) *ChatService {
	collection := db.Collection("chat_messages")
	
	// Start Kafka bus
	if err := kafkaBus.Start(); err != nil {
		log.Printf("[ERROR] Failed to start Kafka bus: %v", err)
	}
	
	// Create hub
	hub := utils.NewHub()

	// Create emitter with hub and kafka bus
	emitter := utils.NewChatEventEmitter(hub, kafkaBus)

	return &ChatService{
		BaseService:  queries.NewBaseService[model.ChatMessage](collection),
		cache:       utils.NewChatCacheService(redis),
		hub:         hub,
		fkValidator: service.NewForeignKeyValidator(db),
		collection:  collection,
		emitter:     emitter,
		kafkaBus:    kafkaBus,
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

	// Create chat event
	event := utils.ChatEvent{
		Type:      "message",
		RoomID:    msg.RoomID.Hex(),
		UserID:    msg.UserID.Hex(),
		Message:   msg.Message,
		Timestamp: time.Now(),
	}

	// Add additional data if present
	if msg.FileURL != "" {
		event.Payload, _ = json.Marshal(map[string]string{
			"fileUrl":  msg.FileURL,
			"fileType": msg.FileType,
			"fileName": msg.FileName,
		})
	}

	if msg.StickerID != nil {
		event.Payload, _ = json.Marshal(map[string]string{
			"stickerId": msg.StickerID.Hex(),
			"image":     msg.Image,
		})
	}

	// Let emitter handle both WebSocket and Kafka broadcasting
	if err := s.emitter.EmitMessage(ctx, msg); err != nil {
		log.Printf("[WARN] Failed to emit message: %v", err)
	}

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

	// Emit reaction event
	if err := s.emitter.EmitReaction(ctx, reaction, msg.Data[0].RoomID); err != nil {
		log.Printf("[WARN] Failed to emit reaction: %v", err)
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

func (s *ChatService) SubscribeToRoom(ctx context.Context, roomID string) error {
	topic := utils.RoomTopicPrefix + roomID

	// Ensure topic exists
	if err := kafka.EnsureTopic("localhost:9092", topic, 1); err != nil {
		return fmt.Errorf("failed to create topic: %w", err)
	}

	// Subscribe to room topic using kafkaBus
	s.kafkaBus.On(topic, func(ctx context.Context, msg *kafka.Message) error {
		// Log received message
		log.Printf("[Kafka] Received message from topic %s", topic)
		
		// Handle message
		if err := s.hub.HandleKafkaMessage(topic, msg.Value); err != nil {
			log.Printf("[ERROR] Failed to handle Kafka message: %v", err)
			return err
		}
		
		return nil
	})

	return nil
}

func (s *ChatService) UnsubscribeFromRoom(ctx context.Context, roomID string) error {
	topic := utils.RoomTopicPrefix + roomID
	
	// Stop consuming messages (implementation depends on your Kafka setup)
	// This is a placeholder - implement based on your needs
	log.Printf("[INFO] Unsubscribed from topic: %s", topic)
	
	return nil
}