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
		
		// Limit the results
		if len(cachedMessages) > int(limit) {
			cachedMessages = cachedMessages[:limit]
		}
		
		return cachedMessages, nil
	}

	log.Printf("[HistoryService] Cache miss for room %s, querying database", roomID)

	// Convert roomID to ObjectID
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, fmt.Errorf("invalid room ID: %w", err)
	}

	// Query database with populated user data - เรียงจากใหม่สุดไปเก่าสุด
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

	result, err := h.FindAllWithPopulate(ctx, opts, "user_id", "users")
	if err != nil {
		return nil, fmt.Errorf("failed to query chat history: %w", err)
	}

	// Convert to enriched messages
	enrichedMessages := make([]model.ChatMessageEnriched, len(result.Data))
	for i, msg := range result.Data {
		enriched := model.ChatMessageEnriched{
			ChatMessage: msg,
		}

		// Get reactions for each message
		reactions, err := h.getMessageReactionsWithUsers(ctx, roomID, msg.ID.Hex())
		if err != nil {
			log.Printf("[HistoryService] Failed to get reactions for message %s: %v", msg.ID.Hex(), err)
			reactions = []model.MessageReaction{}
		}
		enriched.Reactions = reactions

		// Get reply-to message if exists
		if msg.ReplyToID != nil {
			replyToMsg, err := h.getReplyToMessageWithUser(ctx, *msg.ReplyToID)
			if err != nil {
				log.Printf("[HistoryService] Failed to get reply-to message %s: %v", msg.ReplyToID.Hex(), err)
			} else {
				enriched.ReplyTo = replyToMsg
			}
		}

		enrichedMessages[i] = enriched
	}

	// Log sorting verification
	if len(enrichedMessages) > 0 {
		log.Printf("[HistoryService] Database sort verification - First: %v, Last: %v", 
			enrichedMessages[0].ChatMessage.Timestamp, 
			enrichedMessages[len(enrichedMessages)-1].ChatMessage.Timestamp)
	}

	// Cache the enriched messages
	for _, enriched := range enrichedMessages {
		if err := h.cache.SaveMessage(ctx, roomID, &enriched); err != nil {
			log.Printf("[HistoryService] Failed to cache message %s: %v", enriched.ChatMessage.ID.Hex(), err)
		}
	}

	log.Printf("[HistoryService] Successfully retrieved %d messages from database for room %s (newest first)", len(enrichedMessages), roomID)
	return enrichedMessages, nil
}

// getMessageReactionsWithUsers gets reactions for a message with user data
func (h *HistoryService) getMessageReactionsWithUsers(ctx context.Context, roomID, messageID string) ([]model.MessageReaction, error) {
	// Query database directly
	messageObjID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return nil, err
	}

	reactionCollection := h.mongo.Collection("message-reactions")
	cursor, err := reactionCollection.Find(ctx, bson.M{"message_id": messageObjID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var reactions []model.MessageReaction
	if err = cursor.All(ctx, &reactions); err != nil {
		return nil, err
	}

	return reactions, nil
}

// getReplyToMessageWithUser gets the reply-to message with user data
func (h *HistoryService) getReplyToMessageWithUser(ctx context.Context, replyToID primitive.ObjectID) (*model.ChatMessage, error) {
	result, err := h.FindOneWithPopulate(ctx, bson.M{
		"_id": replyToID,
		// กรองข้อความที่ถูก unsend ออก
		"$or": []bson.M{
			{"is_deleted": nil},
			{"is_deleted": false},
		},
	}, "user_id", "users")
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