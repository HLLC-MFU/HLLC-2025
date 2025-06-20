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
	redis       *redis.Client
	hub         *utils.Hub
	fkValidator *service.ForeignKeyValidator
	collection  *mongo.Collection
}

func NewChatService(
	db *mongo.Database,
	redis *redis.Client,
	hub *utils.Hub,
) *ChatService {
	collection := db.Collection("chat_messages")
	return &ChatService{
		BaseService:  queries.NewBaseService[model.ChatMessage](collection),
		redis:       redis,
		hub:         hub,
		fkValidator: service.NewForeignKeyValidator(db),
		collection:  collection,
	}
}

func (s *ChatService) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error) {
	// Try Redis first
	key := "room:" + roomID + ":messages"
	messages, err := s.getCachedMessages(ctx, key, int(limit))
	if err == nil {
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

	enriched := make([]model.ChatMessageEnriched, len(result.Data))
	for i, msg := range result.Data {
		enriched[i] = model.ChatMessageEnriched{
			ChatMessage: msg,
		}
		// Cache message
		s.cacheMessage(ctx, &msg)
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

	// Cache in Redis
	if err := s.cacheMessage(ctx, msg); err != nil {
		log.Printf("[WARN] Failed to cache message: %v", err)
	}

	// Broadcast via Hub
	s.hub.Broadcast(utils.Message{
		RoomID:    msg.RoomID,
		UserID:    msg.UserID,
		Message:   msg.Message,
		Timestamp: msg.Timestamp,
	})

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
	
	_, err = s.UpdateById(ctx, reaction.MessageID.Hex(), update)
	if err != nil {
		return err
	}

	// Update cache
	key := "room:" + msg.Data[0].RoomID.Hex() + ":messages"
	s.redis.Del(ctx, key)

	return nil
}

func (s *ChatService) DeleteRoomMessages(ctx context.Context, roomID string) error {
	// Delete from MongoDB using direct collection access
	filter := map[string]interface{}{
		"room_id": roomID,
	}
	_, err := s.collection.DeleteMany(ctx, filter)
	if err != nil {
		return err
	}

	// Delete from Redis
	key := "room:" + roomID + ":messages"
	s.redis.Del(ctx, key)

	return nil
}

// Helper methods for Redis caching
func (s *ChatService) cacheMessage(ctx context.Context, msg *model.ChatMessage) error {
	key := "room:" + msg.RoomID.Hex() + ":messages"
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	return s.redis.ZAdd(ctx, key, redis.Z{
		Score:  float64(msg.Timestamp.Unix()),
		Member: data,
	}).Err()
}

func (s *ChatService) getCachedMessages(ctx context.Context, key string, limit int) ([]model.ChatMessageEnriched, error) {
	results, err := s.redis.ZRevRange(ctx, key, 0, int64(limit-1)).Result()
	if err != nil {
		return nil, err
	}

	messages := make([]model.ChatMessageEnriched, 0, len(results))
	for _, data := range results {
		var msg model.ChatMessage
		if err := json.Unmarshal([]byte(data), &msg); err != nil {
			continue
		}
		messages = append(messages, model.ChatMessageEnriched{
			ChatMessage: msg,
		})
	}

	return messages, nil
}