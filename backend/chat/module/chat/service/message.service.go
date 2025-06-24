package service

import (
	"chat/module/chat/model"
	"chat/pkg/database/queries"
	"context"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (s *ChatService) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error) {
	log.Printf("[ChatService] Getting chat history for room %s with limit %d", roomID, limit)

	messages, err := s.cache.GetRoomMessages(ctx, roomID, int(limit))
	if err == nil && len(messages) > 0 {
		log.Printf("[ChatService] Found %d messages in cache", len(messages))
		return messages, nil
	}
	if err != nil && err != redis.Nil {	
		log.Printf("[ChatService] Cache error: %v", err)
	}

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, fmt.Errorf("invalid room ID: %w", err)
	}

	opts := queries.QueryOptions{
		Filter: map[string]interface{}{"room_id": roomObjID},
		Sort:   "-timestamp",
		Limit:  int(limit),
	}

	log.Printf("[ChatService] Fetching messages from MongoDB")
	result, err := s.FindAllWithPopulate(ctx, opts, "user_id", "users")
	if err != nil {
		log.Printf("[ChatService] MongoDB error: %v", err)
		return nil, fmt.Errorf("failed to fetch messages: %w", err)
	}

	enriched := make([]model.ChatMessageEnriched, len(result.Data))
	for i, msg := range result.Data {
		enriched[i] = model.ChatMessageEnriched{
			ChatMessage: msg,
		}

		reactions, err := s.cache.GetReactions(ctx, roomID, msg.ID.Hex())
		if err == nil {
			enriched[i].Reactions = reactions
		}

		if msg.ReplyToID != nil {
			replyFilter := map[string]interface{}{"_id": msg.ReplyToID}
			replyResult, err := s.FindOneWithPopulate(ctx, replyFilter, "user_id", "users")
			if err == nil {
				enriched[i].ReplyTo = &replyResult.Data[0]
			}
		}

		if err := s.cache.SaveMessage(ctx, roomID, &enriched[i]); err != nil {
			log.Printf("[ChatService] Failed to cache message: %v", err)
		}
	}

	log.Printf("[ChatService] Found %d messages in MongoDB", len(enriched))
	return enriched, nil
}

func (s *ChatService) SendMessage(ctx context.Context, msg *model.ChatMessage) error {
	result, err := s.Create(ctx, *msg)
	if err != nil {
		return err
	}
	msg.ID = result.Data[0].ID

	filter := map[string]interface{}{"_id": msg.ID}
	populated, err := s.FindOneWithPopulate(ctx, filter, "user_id", "users")
	if err != nil {
		log.Printf("[ChatService] Failed to populate message: %v", err)
		populated = &queries.Response[model.ChatMessage]{
			Data: []model.ChatMessage{*msg},
		}
	}

	enriched := model.ChatMessageEnriched{
		ChatMessage: populated.Data[0],
	}
	if err := s.cache.SaveMessage(ctx, msg.RoomID.Hex(), &enriched); err != nil {
		log.Printf("[ChatService] Failed to cache message: %v", err)
	}

	if err := s.emitter.EmitMessage(ctx, &populated.Data[0]); err != nil {
		log.Printf("[ChatService] Failed to emit message: %v", err)
	}

	return nil
}

func (s *ChatService) DeleteRoomMessages(ctx context.Context, roomID string) error {
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return fmt.Errorf("invalid room ID: %w", err)
	}

	filter := map[string]interface{}{
		"room_id": roomObjID,
	}
	if _, err := s.collection.DeleteMany(ctx, filter); err != nil {
		return fmt.Errorf("failed to delete messages from MongoDB: %w", err)
	}

	if err := s.cache.DeleteRoomMessages(ctx, roomID); err != nil {
		log.Printf("[ChatService] Failed to delete messages from cache: %v", err)
	}

	return nil
} 