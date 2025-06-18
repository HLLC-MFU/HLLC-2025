package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"chat/module/chat/model"
	"chat/pkg/core"
	"chat/pkg/kafka"
)

type MessageService struct {
	redis     *core.RedisCache
	publisher kafka.Publisher
}

func NewMessageService(redis *core.RedisCache) *MessageService {
	return &MessageService{
		redis:     redis,
		publisher: kafka.GetPublisher(),
	}
}

// PublishMessage publishes a message to Kafka and notifies Redis subscribers
func (s *MessageService) PublishMessage(ctx context.Context, roomID string, senderID string, msg *model.ChatMessage) error {
	// Convert message to JSON
	msgJSON, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	// Publish to Kafka
	// topicName := fmt.Sprintf("chat-room-%s", roomID)
	if err := s.publisher.SendMessage(roomID, senderID, string(msgJSON)); err != nil {
		log.Printf("[MessageService] Failed to publish message to Kafka: %v", err)
		return err
	}

	// Store in Redis for recent messages
	redisKey := fmt.Sprintf("chat:room:%s:messages", roomID)
	if err := s.redis.HSet(ctx, redisKey, msg.ID.Hex(), string(msgJSON)); err != nil {
		log.Printf("[MessageService] Failed to store message in Redis: %v", err)
	}

	// Set expiration for Redis key
	if err := s.redis.Expire(ctx, redisKey, 24*time.Hour); err != nil {
		log.Printf("[MessageService] Failed to set Redis expiration: %v", err)
	}

	return nil
}

// GetRecentMessages gets recent messages from Redis
func (s *MessageService) GetRecentMessages(ctx context.Context, roomID string) ([]*model.ChatMessage, error) {
	redisKey := fmt.Sprintf("chat:room:%s:messages", roomID)
	
	// Get all messages from hash
	result, err := s.redis.Client.HGetAll(ctx, redisKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get recent messages: %w", err)
	}

	messages := make([]*model.ChatMessage, 0, len(result))
	for _, msgJSON := range result {
		var msg model.ChatMessage
		if err := json.Unmarshal([]byte(msgJSON), &msg); err != nil {
			log.Printf("[MessageService] Failed to unmarshal message: %v", err)
			continue
		}
		messages = append(messages, &msg)
	}

	return messages, nil
}
