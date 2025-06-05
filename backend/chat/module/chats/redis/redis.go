package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
)

const (
	// Cache TTL for chat messages (24 hours)
	chatMessageTTL = 24 * time.Hour
	// Maximum number of messages to keep in cache per room
	maxCachedMessages = 1000
)

func SaveChatMessageToRoom(roomID string, msg *model.ChatMessage) error {
	if core.GlobalRedis == nil {
		return fmt.Errorf("GlobalRedis is not initialized")
	}

	key := fmt.Sprintf("chat:room:%s:messages", roomID)
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	ctx := context.Background()
	pipe := core.GlobalRedis.Client.TxPipeline()

	// Add message to the list
	pipe.RPush(ctx, key, data)

	// Trim the list to keep only the most recent messages
	pipe.LTrim(ctx, key, -maxCachedMessages, -1)

	// Set TTL on the key
	pipe.Expire(ctx, key, chatMessageTTL)

	// Execute the pipeline
	_, err = pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to execute Redis pipeline: %w", err)
	}

	return nil
}

func GetRecentMessages(roomID string, limit int) ([]model.ChatMessage, error) {
	if core.GlobalRedis == nil {
		return nil, fmt.Errorf("GlobalRedis is not initialized")
	}

	if limit <= 0 || limit > maxCachedMessages {
		limit = maxCachedMessages
	}

	key := fmt.Sprintf("chat:room:%s:messages", roomID)
	ctx := context.Background()

	// Check if key exists
	exists, err := core.GlobalRedis.Client.Exists(ctx, key).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to check key existence: %w", err)
	}
	if exists == 0 {
		return nil, fmt.Errorf("no messages found in cache for room %s", roomID)
	}

	// Get messages from Redis
	values, err := core.GlobalRedis.Client.LRange(ctx, key, -int64(limit), -1).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve messages: %w", err)
	}

	// Refresh TTL on successful access
	if err := core.GlobalRedis.Client.Expire(ctx, key, chatMessageTTL).Err(); err != nil {
		log.Printf("[Cache] Failed to refresh TTL for room %s: %v", roomID, err)
	}

	var messages []model.ChatMessage
	for _, val := range values {
		var msg model.ChatMessage
		if err := json.Unmarshal([]byte(val), &msg); err != nil {
			log.Printf("[Cache] Failed to unmarshal message: %v", err)
			continue
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

// ClearRoomCache removes all cached messages for a room
func ClearRoomCache(roomID string) error {
	if core.GlobalRedis == nil {
		return fmt.Errorf("GlobalRedis is not initialized")
	}

	key := fmt.Sprintf("chat:room:%s:messages", roomID)
	ctx := context.Background()

	if err := core.GlobalRedis.Client.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to clear room cache: %w", err)
	}

	return nil
}

// DeleteRoomMessages deletes all messages for a room from Redis
func DeleteRoomMessages(roomID string) error {
	key := fmt.Sprintf("chat:room:%s:messages", roomID)
	return core.GlobalRedis.Client.Del(context.Background(), key).Err()
}
