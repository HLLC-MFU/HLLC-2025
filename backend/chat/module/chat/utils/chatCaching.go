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

const (
	MessageTTL = 24 * time.Hour
	MaxMessages = 1000
)

type ChatCacheService struct {
	redis *redis.Client
}

func NewChatCacheService(redis *redis.Client) *ChatCacheService {
	return &ChatCacheService{
		redis: redis,
	}
}

// Key generators
func (s *ChatCacheService) roomMessagesKey(roomID string) string {
	return fmt.Sprintf("chat:room:%s:messages", roomID)
}

func (s *ChatCacheService) roomReactionsKey(roomID, messageID string) string {
	return fmt.Sprintf("chat:room:%s:reactions:%s", roomID, messageID)
}

// GetRoomMessages gets messages from cache
func (s *ChatCacheService) GetRoomMessages(ctx context.Context, roomID string, limit int) ([]model.ChatMessageEnriched, error) {
	key := s.roomMessagesKey(roomID)
	
	// Get messages using ZREVRANGE (newest first)
	data, err := s.redis.ZRevRange(ctx, key, 0, int64(limit-1)).Result()
	if err == redis.Nil {
		return []model.ChatMessageEnriched{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("redis get error: %w", err)
	}

	messages := make([]model.ChatMessageEnriched, 0, len(data))
	for _, item := range data {
		var msg model.ChatMessageEnriched
		if err := json.Unmarshal([]byte(item), &msg); err != nil {
			log.Printf("Warning: Failed to unmarshal message: %v", err)
			continue
		}
		messages = append(messages, msg)
	}

	// Refresh TTL on successful read
	s.redis.Expire(ctx, key, MessageTTL)

	return messages, nil
}

// SaveMessage saves a message to cache
func (s *ChatCacheService) SaveMessage(ctx context.Context, roomID string, msg *model.ChatMessageEnriched) error {
	key := s.roomMessagesKey(roomID)
	
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	pipe := s.redis.Pipeline()

	// Save message with timestamp as score
	score := float64(msg.ChatMessage.Timestamp.Unix())
	pipe.ZAdd(ctx, key, redis.Z{
		Score:  score,
		Member: data,
	})

	// Set TTL
	pipe.Expire(ctx, key, MessageTTL)

	// Trim old messages
	pipe.ZRemRangeByRank(ctx, key, 0, -MaxMessages-1)

	_, err = pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("redis save error: %w", err)
	}

	return nil
}

// SaveReaction saves a reaction to cache
func (s *ChatCacheService) SaveReaction(ctx context.Context, roomID string, messageID string, reaction *model.MessageReaction) error {
	key := s.roomReactionsKey(roomID, messageID)
	
	// Get existing reactions
	reactions, err := s.GetReactions(ctx, roomID, messageID)
	if err != nil && err != redis.Nil {
		return err
	}

	// Add new reaction
	reactions = append(reactions, *reaction)

	// Save back to Redis
	data, err := json.Marshal(reactions)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	return s.redis.SetEx(ctx, key, data, MessageTTL).Err()
}

// GetReactions gets reactions for a message
func (s *ChatCacheService) GetReactions(ctx context.Context, roomID string, messageID string) ([]model.MessageReaction, error) {
	key := s.roomReactionsKey(roomID, messageID)
	
	data, err := s.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return []model.MessageReaction{}, nil
	}
	if err != nil {
		return nil, err
	}

	var reactions []model.MessageReaction
	if err := json.Unmarshal([]byte(data), &reactions); err != nil {
		return nil, fmt.Errorf("unmarshal error: %w", err)
	}

	return reactions, nil
}

// DeleteRoomMessages deletes all messages for a room
func (s *ChatCacheService) DeleteRoomMessages(ctx context.Context, roomID string) error {
	key := s.roomMessagesKey(roomID)
	return s.redis.Del(ctx, key).Err()
}
