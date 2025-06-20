// // backend/pkg/core/redis.go
package core

import (
	"chat/module/chat/model"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisService struct {
	client *redis.Client
	ttl    time.Duration
	limit  int64
}

func NewRedisService(client *redis.Client) *RedisService {
	return &RedisService{
		client: client,
		ttl:    24 * time.Hour, // Default TTL
		limit:  1000,           // Default message limit
	}
}

func (s *RedisService) roomKey(roomID string) string {
	return fmt.Sprintf("chat:room:%s", roomID)
}

func (s *RedisService) SaveMessage(ctx context.Context, msg *model.ChatMessage) error {
	key := s.roomKey(msg.RoomID.Hex())
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	// Use ZADD with timestamp as score for automatic ordering
	score := float64(msg.Timestamp.Unix())
	if err := s.client.ZAdd(ctx, key, redis.Z{
		Score:  score,
		Member: data,
	}).Err(); err != nil {
		return fmt.Errorf("redis save error: %w", err)
	}

	// Trim old messages and refresh TTL in a pipeline
	pipe := s.client.Pipeline()
	pipe.ZRemRangeByRank(ctx, key, 0, -(s.limit + 1)) // Keep only latest messages
	pipe.Expire(ctx, key, s.ttl)
	
	if _, err := pipe.Exec(ctx); err != nil {
		log.Printf("Warning: Failed to trim messages: %v", err)
	}

	return nil
}

func (s *RedisService) GetMessages(ctx context.Context, roomID string, limit int64) ([]model.ChatMessage, error) {
	if limit <= 0 || limit > s.limit {
		limit = s.limit
	}

	key := s.roomKey(roomID)
	
	// Get latest messages using ZREVRANGE
	data, err := s.client.ZRevRange(ctx, key, 0, limit-1).Result()
	if err != nil {
		if err == redis.Nil {
			return []model.ChatMessage{}, nil
		}
		return nil, fmt.Errorf("redis get error: %w", err)
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

	// Refresh TTL
	s.client.Expire(ctx, key, s.ttl)

	return messages, nil
}

func (s *RedisService) DeleteRoomMessages(ctx context.Context, roomID string) error {
	return s.client.Del(ctx, s.roomKey(roomID)).Err()
}

// Optional: Add methods to customize service settings
func (s *RedisService) SetTTL(ttl time.Duration) {
	s.ttl = ttl
}

func (s *RedisService) SetMessageLimit(limit int64) {
	s.limit = limit
}