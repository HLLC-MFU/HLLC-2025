package redis

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
)

func SaveChatMessageToRoom(roomID string, msg *model.ChatMessage) error {
	if core.GlobalRedis == nil {
		return fmt.Errorf("GlobalRedis is not initialized")
	}

	key := fmt.Sprintf("chat:room:%s:messages", roomID)
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	pipe := core.GlobalRedis.Client.TxPipeline()
	pipe.RPush(context.Background(), key, data)
	pipe.LTrim(context.Background(), key, -1000, -1)
	_, err = pipe.Exec(context.Background())
	return err
}

func GetRecentMessages(roomID string, limit int) ([]model.ChatMessage, error) {
	if core.GlobalRedis == nil {
		return nil, fmt.Errorf("GlobalRedis is not initialized")
	}

	key := fmt.Sprintf("chat:room:%s:messages", roomID)
	values, err := core.GlobalRedis.Client.LRange(context.Background(), key, -int64(limit), -1).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve messages: %w", err)
	}

	var messages []model.ChatMessage
	for _, val := range values {
		var msg model.ChatMessage
		if err := json.Unmarshal([]byte(val), &msg); err == nil {
			messages = append(messages, msg)
		}
	}
	return messages, nil
}
