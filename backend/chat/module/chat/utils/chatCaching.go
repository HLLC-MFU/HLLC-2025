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

// GetRoomMessages gets messages from cache (จากใหม่สุดไปเก่าสุด)
func (s *ChatCacheService) GetRoomMessages(ctx context.Context, roomID string, limit int) ([]model.ChatMessageEnriched, error) {
	key := s.roomMessagesKey(roomID)
	
	// Get messages using ZREVRANGE (newest first by timestamp score)
	data, err := s.redis.ZRevRange(ctx, key, 0, int64(limit*2)).Result() // ขอมากกว่าเผื่อต้องกรอง
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

		// กรองข้อความที่ถูก soft delete ออก
		if msg.ChatMessage.IsDeleted != nil && *msg.ChatMessage.IsDeleted {
			continue // ข้าม soft deleted messages
		}

		// **ENHANCED: Log what we retrieved from cache**
		log.Printf("[Cache] Retrieved message %s from cache", msg.ChatMessage.ID.Hex())
		if msg.ChatMessage.EvoucherInfo != nil {
			log.Printf("[Cache] Message %s contains evoucher info", msg.ChatMessage.ID.Hex())
		}
		if msg.ChatMessage.MentionInfo != nil {
			log.Printf("[Cache] Message %s contains mention info with %d mentions", msg.ChatMessage.ID.Hex(), len(msg.ChatMessage.Mentions))
		}
		if msg.ChatMessage.ModerationInfo != nil {
			log.Printf("[Cache] Message %s contains restriction info", msg.ChatMessage.ID.Hex())
		}
		if msg.ChatMessage.StickerID != nil {
			log.Printf("[Cache] Message %s contains sticker info", msg.ChatMessage.ID.Hex())
		}
		if msg.ReplyTo != nil {
			log.Printf("[Cache] Message %s contains reply-to info", msg.ChatMessage.ID.Hex())
		}


		messages = append(messages, msg)
		
		// หยุดเมื่อได้จำนวนที่ต้องการแล้ว
		if len(messages) >= limit {
			break
		}
	}

	// Log cache sorting info
	log.Printf("[Cache] Retrieved %d messages from cache for room %s (newest first)", len(messages), roomID)
	if len(messages) > 0 {
		log.Printf("[Cache] First cached message: %v, Last cached message: %v", 
			messages[0].ChatMessage.Timestamp, 
			messages[len(messages)-1].ChatMessage.Timestamp)
	}

	// Refresh TTL on successful read
	s.redis.Expire(ctx, key, MessageTTL)

	return messages, nil
}

// SaveMessage saves a message to cache
func (s *ChatCacheService) SaveMessage(ctx context.Context, roomID string, msg *model.ChatMessageEnriched) error {
	// **FIXED: Don't cache unsent messages**
	if msg.ChatMessage.IsDeleted != nil && *msg.ChatMessage.IsDeleted {
		log.Printf("[Cache] Skipping unsent message %s from cache", msg.ChatMessage.ID.Hex())
		return nil
	}

	key := s.roomMessagesKey(roomID)
	
	// **ENHANCED: Log what we're caching for debugging**
	log.Printf("[Cache] Saving enriched message %s to cache for room %s", msg.ChatMessage.ID.Hex(), roomID)
	if msg.ChatMessage.EvoucherInfo != nil {
		log.Printf("[Cache] Message contains evoucher info")
	}
	if msg.ChatMessage.MentionInfo != nil {
		log.Printf("[Cache] Message contains mention info with %d mentions", len(msg.ChatMessage.Mentions))
	}
	if msg.ChatMessage.ModerationInfo != nil {
		log.Printf("[Cache] Message contains restriction info")
	}
	if msg.ChatMessage.StickerID != nil {
		log.Printf("[Cache] Message contains sticker info")
	}
	if msg.ReplyTo != nil {
		log.Printf("[Cache] Message contains reply-to info")
	}

	
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

	log.Printf("[Cache] Successfully saved enriched message %s to cache", msg.ChatMessage.ID.Hex())
	return nil
}



// DeleteRoomMessages deletes all messages for a room
func (s *ChatCacheService) DeleteRoomMessages(ctx context.Context, roomID string) error {
	key := s.roomMessagesKey(roomID)
	return s.redis.Del(ctx, key).Err()
}