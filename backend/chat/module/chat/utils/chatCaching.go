package utils

import (
	"chat/module/chat/model"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

type ChatCacheService struct {
	redis *redis.Client
}

func NewChatCacheService(redis *redis.Client) *ChatCacheService {
	return &ChatCacheService{
		redis: redis,
	}
}

// GetRoomMessages gets messages from cache
func (s *ChatCacheService) GetRoomMessages(ctx context.Context, roomID string, limit int) ([]model.ChatMessage, error) {
	key := fmt.Sprintf("chat:room:%s:messages", roomID)
	
	// Get messages using ZREVRANGE (newest first)
	data, err := s.redis.ZRevRange(ctx, key, 0, int64(limit-1)).Result()
	if err == redis.Nil {
		return []model.ChatMessage{}, nil
	}
	if err != nil {
		return nil, err
	}

	messages := make([]model.ChatMessage, 0, len(data))
	for _, item := range data {
		var msg model.ChatMessage
		if err := json.Unmarshal([]byte(item), &msg); err != nil {
			log.Printf("Warning: Failed to unmarshal message: %v", err)
			continue
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

// SaveMessage saves a message to cache
func (s *ChatCacheService) SaveMessage(ctx context.Context, roomID string, msg *model.ChatMessage) error {
	key := fmt.Sprintf("chat:room:%s:messages", roomID)
	
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	// Add to sorted set with timestamp as score
	score := float64(msg.Timestamp.Unix())
	if err := s.redis.ZAdd(ctx, key, redis.Z{
		Score:  score,
		Member: data,
	}).Err(); err != nil {
		return fmt.Errorf("failed to save message: %w", err)
	}

	// Set expiration (24 hours)
	s.redis.Expire(ctx, key, 24*time.Hour)

	// Trim to 1000 messages
	s.redis.ZRemRangeByRank(ctx, key, 0, -1001)

	return nil
}

// DeleteRoomMessages deletes all messages for a room
func (s *ChatCacheService) DeleteRoomMessages(ctx context.Context, roomID string) error {
	key := fmt.Sprintf("chat:room:%s:messages", roomID)
	return s.redis.Del(ctx, key).Err()
}

// SaveReaction saves a reaction to cache
func (s *ChatCacheService) SaveReaction(ctx context.Context, roomID string, reaction *model.MessageReaction) error {
	key := fmt.Sprintf("chat:room:%s:reactions:%s", roomID, reaction.MessageID.Hex())
	
	data, err := json.Marshal(reaction)
	if err != nil {
		return fmt.Errorf("failed to marshal reaction: %w", err)
	}

	// Save reaction with expiration
	if err := s.redis.Set(ctx, key, data, 24*time.Hour).Err(); err != nil {
		return fmt.Errorf("failed to save reaction: %w", err)
	}

	return nil
}

// GetReactions gets reactions for a message
func (s *ChatCacheService) GetReactions(ctx context.Context, roomID string, messageID string) ([]model.MessageReaction, error) {
	key := fmt.Sprintf("chat:room:%s:reactions:%s", roomID, messageID)
	
	data, err := s.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return []model.MessageReaction{}, nil
	}
	if err != nil {
		return nil, err
	}

	var reactions []model.MessageReaction
	if err := json.Unmarshal([]byte(data), &reactions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal reactions: %w", err)
	}

	return reactions, nil
} 