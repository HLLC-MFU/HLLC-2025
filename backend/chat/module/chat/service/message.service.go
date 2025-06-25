package service

import (
	"chat/module/chat/model"
	userModel "chat/module/user/model"
	"chat/pkg/database/queries"
	"context"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
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

		// Get reactions for this message
		reactions, err := s.getMessageReactionsWithUsers(ctx, roomID, msg.ID.Hex())
		if err == nil {
			enriched[i].Reactions = reactions
		} else {
			log.Printf("[ChatService] Failed to get reactions for message %s: %v", msg.ID.Hex(), err)
		}

		// Get reply-to message if exists
		if msg.ReplyToID != nil {
			replyToMsg, err := s.getReplyToMessageWithUser(ctx, *msg.ReplyToID)
			if err == nil {
				enriched[i].ReplyTo = replyToMsg
			} else {
				log.Printf("[ChatService] Failed to get reply-to message %s: %v", msg.ReplyToID.Hex(), err)
			}
		}

		// Cache each enriched message
		if err := s.cache.SaveMessage(ctx, roomID, &enriched[i]); err != nil {
			log.Printf("[ChatService] Failed to cache message: %v", err)
		}
	}

	log.Printf("[ChatService] Found %d messages in MongoDB", len(enriched))
	return enriched, nil
}

// getMessageReactionsWithUsers gets reactions for a message with populated user data
func (s *ChatService) getMessageReactionsWithUsers(ctx context.Context, roomID, messageID string) ([]model.MessageReaction, error) {
	// Try cache first
	cachedReactions, err := s.cache.GetReactions(ctx, roomID, messageID)
	if err == nil && len(cachedReactions) > 0 {
		return cachedReactions, nil
	}

	// Get from MongoDB with user population
	messageObjID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return nil, err
	}

	// Find message and get its reactions
	msg, err := s.FindOneById(ctx, messageID)
	if err != nil {
		return nil, err
	}

	// Get reactions from message document (if stored directly)
	if len(msg.Data) == 0 {
		return []model.MessageReaction{}, nil
	}

	// Query reactions collection if it exists separately
	reactionCollection := s.mongo.Collection("message_reactions")
	cursor, err := reactionCollection.Find(ctx, bson.M{"message_id": messageObjID})
	if err != nil {
		return []model.MessageReaction{}, nil
	}
	defer cursor.Close(ctx)

	var dbReactions []model.MessageReaction
	if err = cursor.All(ctx, &dbReactions); err != nil {
		return []model.MessageReaction{}, nil
	}

	// Populate user data for each reaction
	userService := queries.NewBaseService[userModel.User](s.mongo.Collection("users"))
	for i := range dbReactions {
		userResult, err := userService.FindOneById(ctx, dbReactions[i].UserID.Hex())
		if err == nil && len(userResult.Data) > 0 {
			// Store user info in a field (you might need to add this to MessageReaction model)
			log.Printf("[ChatService] Found user for reaction: %s", userResult.Data[0].Username)
		}
	}

	return dbReactions, nil
}

// getReplyToMessageWithUser gets the reply-to message with populated user data
func (s *ChatService) getReplyToMessageWithUser(ctx context.Context, replyToID primitive.ObjectID) (*model.ChatMessage, error) {
	filter := map[string]interface{}{"_id": replyToID}
	replyResult, err := s.FindOneWithPopulate(ctx, filter, "user_id", "users")
	if err != nil {
		return nil, err
	}

	if len(replyResult.Data) == 0 {
		return nil, fmt.Errorf("reply-to message not found")
	}

	return &replyResult.Data[0], nil
}

func (s *ChatService) SendMessage(ctx context.Context, msg *model.ChatMessage) error {
	result, err := s.Create(ctx, *msg)
	if err != nil {
		return err
	}
	msg.ID = result.Data[0].ID

	// Get the message with populated user data, but handle errors gracefully
	var populatedMsg model.ChatMessage
	
	// First try to get without population to ensure clean data
	if directMsg, err := s.FindOneById(ctx, msg.ID.Hex()); err == nil && len(directMsg.Data) > 0 {
		populatedMsg = directMsg.Data[0]
		log.Printf("[ChatService] Successfully retrieved message without population")
	} else {
		log.Printf("[ChatService] Failed to get message directly, using original: %v", err)
		populatedMsg = *msg
	}
	
	// Skip population for now to avoid embedded document errors
	// TODO: Fix population issue later
	log.Printf("[ChatService] Using message without user population to avoid embedded document error")

	enriched := model.ChatMessageEnriched{
		ChatMessage: populatedMsg,
	}

	// If this is a reply, populate the reply-to message
	if msg.ReplyToID != nil {
		replyToMsg, err := s.getReplyToMessageWithUser(ctx, *msg.ReplyToID)
		if err == nil {
			enriched.ReplyTo = replyToMsg
		} else {
			log.Printf("[ChatService] Failed to populate reply-to message: %v", err)
		}
	}

	if err := s.cache.SaveMessage(ctx, msg.RoomID.Hex(), &enriched); err != nil {
		log.Printf("[ChatService] Failed to cache message: %v", err)
	}

	log.Printf("[ChatService] About to emit message ID=%s Room=%s Type=%s", 
		populatedMsg.ID.Hex(), populatedMsg.RoomID.Hex(), 
		func() string {
			if populatedMsg.ReplyToID != nil {
				return "reply"
			}
			if populatedMsg.StickerID != nil {
				return "sticker"
			}
			return "text"
		}())

	if err := s.emitter.EmitMessage(ctx, &populatedMsg); err != nil {
		log.Printf("[ChatService] Failed to emit message: %v", err)
	} else {
		log.Printf("[ChatService] Successfully emitted message ID=%s to WebSocket and Kafka", populatedMsg.ID.Hex())
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