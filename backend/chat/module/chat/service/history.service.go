package service

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	"chat/pkg/database/queries"
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type HistoryService struct {
	*queries.BaseService[model.ChatMessage]
	cache  *utils.ChatCacheService
	mongo  *mongo.Database
}

func NewHistoryService(db *mongo.Database, cache *utils.ChatCacheService) *HistoryService {
	collection := db.Collection("chat-messages")
	return &HistoryService{
		BaseService: queries.NewBaseService[model.ChatMessage](collection),
		cache:       cache,
		mongo:       db,
	}
}

// GetChatHistoryByRoom retrieves chat history for a specific room
func (h *HistoryService) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error) {
	log.Printf("[HistoryService] Getting chat history for room %s with limit %d", roomID, limit)

	// Try to get from cache first
	cachedMessages, err := h.cache.GetRoomMessages(ctx, roomID, int(limit))
	if err == nil && len(cachedMessages) > 0 {
		log.Printf("[HistoryService] Found %d cached messages for room %s", len(cachedMessages), roomID)
		
		// **NEW: Check if cache has sufficient data**
		// If we got fewer messages than requested and it's not a complete dataset, query database
		if int64(len(cachedMessages)) < limit {
			log.Printf("[HistoryService] Cache has insufficient data (%d/%d messages), checking database for more", len(cachedMessages), limit)
			
			// Query database for more messages
			dbMessages, err := h.queryDatabaseMessages(ctx, roomID, limit)
			if err != nil {
				log.Printf("[HistoryService] Database query failed, using cached messages only: %v", err)
			} else if len(dbMessages) > len(cachedMessages) {
				log.Printf("[HistoryService] Database has more messages (%d vs %d cached), using database data", len(dbMessages), len(cachedMessages))
				
				// Cache the complete database results
				for _, enriched := range dbMessages {
					if err := h.cache.SaveMessage(ctx, roomID, &enriched); err != nil {
						log.Printf("[HistoryService] Failed to cache message %s: %v", enriched.ChatMessage.ID.Hex(), err)
					}
				}
				
				return dbMessages, nil
			}
		}
		
		// **ENHANCED: Re-populate all missing data for cached messages**
		for i, msg := range cachedMessages {
			// Re-populate ReplyTo if missing
			if msg.ChatMessage.ReplyToID != nil && msg.ReplyTo == nil {
				log.Printf("[HistoryService] Re-populating ReplyTo for cached message %s", msg.ChatMessage.ID.Hex())
				replyToMsg, err := h.getReplyToMessageWithUser(ctx, *msg.ChatMessage.ReplyToID)
				if err != nil {
					log.Printf("[HistoryService] Failed to get reply-to message %s: %v", msg.ChatMessage.ReplyToID.Hex(), err)
				} else {
					cachedMessages[i].ReplyTo = replyToMsg
					log.Printf("[HistoryService] Successfully re-populated ReplyTo for message %s", msg.ChatMessage.ID.Hex())
				}
			}
		}
		
		// Limit the results
		if len(cachedMessages) > int(limit) {
			cachedMessages = cachedMessages[:limit]
		}
		
		log.Printf("[HistoryService] Using %d cached messages for room %s", len(cachedMessages), roomID)
		return cachedMessages, nil
	}

	log.Printf("[HistoryService] Cache miss for room %s, querying database", roomID)
	return h.queryDatabaseMessages(ctx, roomID, limit)
}

// queryDatabaseMessages queries messages from database
func (h *HistoryService) queryDatabaseMessages(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error) {
	// Convert roomID to ObjectID
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, fmt.Errorf("invalid room ID: %w", err)
	}

	// **ENHANCED: Query database with better population**
	opts := queries.QueryOptions{
		Filter: map[string]interface{}{
			"room_id": roomObjID,
			// กรองข้อความที่ถูก unsend ออก (soft delete)
			"$or": []map[string]interface{}{
				{"is_deleted": nil},
				{"is_deleted": false},
			},
		},
		Sort:  "-timestamp", // ใหม่สุดก่อน (descending order)
		Limit: int(limit),
	}

	// **FIXED: Use simple FindAll to avoid population issues**
	result, err := h.FindAll(ctx, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to query chat history: %w", err)
	}

	log.Printf("[HistoryService] Database query returned %d messages for room %s", len(result.Data), roomID)

	// **ENHANCED: Convert to enriched messages with complete data**
	enrichedMessages := make([]model.ChatMessageEnriched, len(result.Data))
	for i, msg := range result.Data {
		enriched := model.ChatMessageEnriched{
			ChatMessage: msg,
		}

		// **ENHANCED: Get reply-to message if exists**
		if msg.ReplyToID != nil {
			replyToMsg, err := h.getReplyToMessageWithUser(ctx, *msg.ReplyToID)
			if err != nil {
				log.Printf("[HistoryService] Failed to get reply-to message %s: %v", msg.ReplyToID.Hex(), err)
			} else {
				enriched.ReplyTo = replyToMsg
				log.Printf("[HistoryService] ReplyTo populated for message %s -> %s", msg.ID.Hex(), replyToMsg.ID.Hex())
			}
		}

		// **NEW: Log special message types for debugging**
		if msg.EvoucherInfo != nil {
			log.Printf("[HistoryService] Found evoucher message %s", msg.ID.Hex())
		}
		if msg.MentionInfo != nil && len(msg.MentionInfo) > 0 {
			log.Printf("[HistoryService] Found mention message %s with %d mentions", msg.ID.Hex(), len(msg.MentionInfo))
		}
		if msg.ModerationInfo != nil {
			log.Printf("[HistoryService] Found restriction message %s", msg.ID.Hex())
		}
		if msg.StickerID != nil {
			log.Printf("[HistoryService] Found sticker message %s", msg.ID.Hex())
		}
		if msg.Image != "" && msg.StickerID == nil {
			log.Printf("[HistoryService] Found upload message %s", msg.ID.Hex())
		}
		if msg.ReplyToID != nil {
			log.Printf("[HistoryService] Found reply message %s", msg.ID.Hex())
		}
		if msg.Message != "" && msg.StickerID == nil && msg.EvoucherInfo == nil && msg.ReplyToID == nil && len(msg.MentionInfo) == 0 {
			log.Printf("[HistoryService] Found text message %s: '%s'", msg.ID.Hex(), msg.Message)
		}

		enrichedMessages[i] = enriched
	}

	// Log sorting verification
	if len(enrichedMessages) > 0 {
		log.Printf("[HistoryService] Database sort verification - First: %v, Last: %v", 
			enrichedMessages[0].ChatMessage.Timestamp, 
			enrichedMessages[len(enrichedMessages)-1].ChatMessage.Timestamp)
	}

	// **ENHANCED: Cache the complete enriched messages**
	for _, enriched := range enrichedMessages {
		if err := h.cache.SaveMessage(ctx, roomID, &enriched); err != nil {
			log.Printf("[HistoryService] Failed to cache message %s: %v", enriched.ChatMessage.ID.Hex(), err)
		} else {
			log.Printf("[HistoryService] Successfully cached enriched message %s", enriched.ChatMessage.ID.Hex())
		}
	}

	log.Printf("[HistoryService] Successfully retrieved %d messages from database for room %s (newest first)", len(enrichedMessages), roomID)
	return enrichedMessages, nil
}


// getReplyToMessageWithUser gets the reply-to message with user data
func (h *HistoryService) getReplyToMessageWithUser(ctx context.Context, replyToID primitive.ObjectID) (*model.ChatMessage, error) {
	// Use simple FindOne without populate to avoid decoding issues
	result, err := h.FindOne(ctx, bson.M{
		"_id": replyToID,
		// กรองข้อความที่ถูก unsend ออก
		"$or": []bson.M{
			{"is_deleted": nil},
			{"is_deleted": false},
		},
	})
	if err != nil {
		return nil, err
	}

	if len(result.Data) == 0 {
		return nil, fmt.Errorf("reply-to message not found")
	}

	return &result.Data[0], nil
}

// DeleteRoomMessages deletes all messages for a room
func (h *HistoryService) DeleteRoomMessages(ctx context.Context, roomID string) error {
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return fmt.Errorf("invalid room ID: %w", err)
	}

	// Use direct collection operation
	collection := h.mongo.Collection("chat-messages")
	filter := bson.M{"room_id": roomObjID}
	
	if _, err := collection.DeleteMany(ctx, filter); err != nil {
		return fmt.Errorf("failed to delete messages from MongoDB: %w", err)
	}

	if err := h.cache.DeleteRoomMessages(ctx, roomID); err != nil {
		log.Printf("[HistoryService] Failed to delete messages from cache: %v", err)
	}

	return nil
} 

 