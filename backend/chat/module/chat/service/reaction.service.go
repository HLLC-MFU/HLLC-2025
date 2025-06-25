package service

import (
	"chat/module/chat/model"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (s *ChatService) HandleReaction(ctx context.Context, reaction *model.MessageReaction) error {
	// Get the message first to verify it exists and get room ID
	msg, err := s.FindOneById(ctx, reaction.MessageID.Hex())
	if err != nil {
		log.Printf("[ChatService] Failed to find message %s: %v", reaction.MessageID.Hex(), err)
		return err
	}

	if len(msg.Data) == 0 {
		return fmt.Errorf("message not found")
	}

	messageData := msg.Data[0]
	
	// Create separate reaction document in reactions collection
	reactionCollection := s.mongo.Collection("message_reactions")
	
	// Check if reaction already exists to prevent duplicates
	existingReaction := reactionCollection.FindOne(ctx, bson.M{
		"message_id": reaction.MessageID,
		"user_id":    reaction.UserID,
		"reaction":   reaction.Reaction,
	})
	
	if existingReaction.Err() == nil {
		log.Printf("[ChatService] Reaction already exists for message %s by user %s", 
			reaction.MessageID.Hex(), reaction.UserID.Hex())
		return fmt.Errorf("reaction already exists")
	}

	// Insert new reaction document
	if _, err := reactionCollection.InsertOne(ctx, reaction); err != nil {
		log.Printf("[ChatService] Failed to insert reaction: %v", err)
		return fmt.Errorf("failed to save reaction: %w", err)
	}

	log.Printf("[ChatService] Successfully saved reaction to database: messageId=%s userId=%s reaction=%s", 
		reaction.MessageID.Hex(), reaction.UserID.Hex(), reaction.Reaction)

	// Cache the reaction
	if err := s.cache.SaveReaction(ctx, messageData.RoomID.Hex(), reaction.MessageID.Hex(), reaction); err != nil {
		log.Printf("[ChatService] Failed to cache reaction: %v", err)
	}

	// Emit reaction event to Kafka and WebSocket
	log.Printf("[ChatService] About to emit reaction messageId=%s userId=%s reaction=%s roomId=%s", 
		reaction.MessageID.Hex(), reaction.UserID.Hex(), reaction.Reaction, messageData.RoomID.Hex())
	if err := s.emitter.EmitReaction(ctx, reaction, messageData.RoomID); err != nil {
		log.Printf("[ChatService] Failed to emit reaction: %v", err)
	} else {
		log.Printf("[ChatService] Successfully emitted reaction to WebSocket and Kafka")
	}

	return nil
}

func (s *ChatService) RemoveReaction(ctx context.Context, messageID, userID string) error {
	messageObjID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		log.Printf("[ChatService] Invalid message ID %s: %v", messageID, err)
		return err
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("[ChatService] Invalid user ID %s: %v", userID, err)
		return err
	}

	// Get the message first to verify it exists and get room ID
	msg, err := s.FindOneById(ctx, messageID)
	if err != nil {
		log.Printf("[ChatService] Failed to find message %s: %v", messageID, err)
		return err
	}

	if len(msg.Data) == 0 {
		return fmt.Errorf("message not found")
	}

	messageData := msg.Data[0]

	// Remove reaction from reactions collection
	reactionCollection := s.mongo.Collection("message_reactions")
	
	deleteResult, err := reactionCollection.DeleteOne(ctx, bson.M{
		"message_id": messageObjID,
		"user_id":    userObjID,
	})
	
	if err != nil {
		log.Printf("[ChatService] Failed to delete reaction: %v", err)
		return fmt.Errorf("failed to remove reaction: %w", err)
	}

	if deleteResult.DeletedCount == 0 {
		log.Printf("[ChatService] No reaction found to remove for message %s by user %s", 
			messageID, userID)
		return fmt.Errorf("reaction not found")
	}

	log.Printf("[ChatService] Successfully removed reaction from database: messageId=%s userId=%s", 
		messageID, userID)

	// Remove reaction from cache
	if err := s.cache.RemoveReaction(ctx, messageData.RoomID.Hex(), messageID, userID); err != nil {
		log.Printf("[ChatService] Failed to remove reaction from cache: %v", err)
	}

	// Emit remove reaction event
	log.Printf("[ChatService] About to emit remove reaction messageId=%s userId=%s roomId=%s", 
		messageID, userID, messageData.RoomID.Hex())
	if err := s.emitter.EmitReaction(ctx, &model.MessageReaction{
		MessageID: messageObjID,
		UserID:    userObjID,
		Reaction:  "remove",
		Timestamp: time.Now(),
	}, messageData.RoomID); err != nil {
		log.Printf("[ChatService] Failed to emit reaction removal: %v", err)
	} else {
		log.Printf("[ChatService] Successfully emitted reaction removal to WebSocket and Kafka")
	}

	return nil
} 