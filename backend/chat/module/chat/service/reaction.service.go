package service

import (
	"chat/module/chat/model"
	userModel "chat/module/user/model"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type (
	ReactionService interface {
		HandleReaction(ctx context.Context, reaction *model.MessageReaction) error
		RemoveReaction(ctx context.Context, messageID, userID string) error
		GetUserById(ctx context.Context, userID string) (*userModel.User, error)
	}

	ReactionRoomService interface {
		IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
		CanUserSendReaction(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
	}
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
	reactionCollection := s.mongo.Collection("message-reactions")
	
	// Check if user already reacted to this message (any emoji)
	existingReaction := reactionCollection.FindOne(ctx, bson.M{
		"message_id": reaction.MessageID,
		"user_id":    reaction.UserID,
	})
	
	var existing model.MessageReaction
	if existingReaction.Err() == nil {
		// User already reacted, decode the existing reaction
		if err := existingReaction.Decode(&existing); err != nil {
			log.Printf("[ChatService] Failed to decode existing reaction: %v", err)
		} else {
			if existing.Reaction == reaction.Reaction {
				// Same emoji: remove the reaction (toggle off)
				log.Printf("[ChatService] Same emoji reaction, removing: message %s by user %s", reaction.MessageID.Hex(), reaction.UserID.Hex())
				_ = s.RemoveReaction(ctx, reaction.MessageID.Hex(), reaction.UserID.Hex())
				return nil
			} else {
				// Different emoji: update the reaction
				log.Printf("[ChatService] Different emoji reaction, updating: message %s by user %s from %s to %s", 
					reaction.MessageID.Hex(), reaction.UserID.Hex(), existing.Reaction, reaction.Reaction)
				
				// Delete old reaction and insert new one
				_, err := reactionCollection.DeleteOne(ctx, bson.M{
					"message_id": reaction.MessageID,
					"user_id":    reaction.UserID,
				})
				if err != nil {
					log.Printf("[ChatService] Failed to delete old reaction: %v", err)
					return err
				}
				
				// Set action to "update" for the new reaction
				reaction.Action = "update"
			}
		}
	} else if existingReaction.Err() != mongo.ErrNoDocuments {
		// Some other error
		log.Printf("[ChatService] Error checking existing reaction: %v", existingReaction.Err())
		return existingReaction.Err()
	} else {
		// No existing reaction, this is a new "add" action
		reaction.Action = "add"
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

	// **IMPORTANT**: Update the cached message to include this new reaction
	if err := s.updateCachedMessageWithReaction(ctx, messageData.RoomID.Hex(), reaction.MessageID.Hex(), reaction); err != nil {
		log.Printf("[ChatService] Failed to update cached message with reaction: %v", err)
	}

	// Emit reaction event to Kafka and WebSocket
	log.Printf("[ChatService] About to emit reaction messageId=%s userId=%s reaction=%s action=%s roomId=%s", 
		reaction.MessageID.Hex(), reaction.UserID.Hex(), reaction.Reaction, reaction.Action, messageData.RoomID.Hex())
	if err := s.emitter.EmitReaction(ctx, reaction, messageData.RoomID); err != nil {
		log.Printf("[ChatService] Failed to emit reaction: %v", err)
	} else {
		log.Printf("[ChatService] Successfully emitted reaction to WebSocket and Kafka")
	}

	// --- Send offline notification to all room members (except sender) ---
	log.Printf("[DEBUG] [Reaction] Sending notifications to all offline room members (except sender %s)", reaction.UserID.Hex())
	s.notifyOfflineReact(ctx, &messageData, reaction)

	return nil
}

// updateCachedMessageWithReaction updates the cached message to include the new reaction
func (s *ChatService) updateCachedMessageWithReaction(ctx context.Context, roomID, messageID string, reaction *model.MessageReaction) error {
	// Get all cached messages for the room
	messages, err := s.cache.GetRoomMessages(ctx, roomID, 1000) // Get a large number to find the message
	if err != nil {
		return err
	}

	// Find the message and update its reactions
	for i, msg := range messages {
		if msg.ChatMessage.ID.Hex() == messageID {
			// Check if reaction already exists (shouldn't happen but just in case)
			reactionExists := false
			for _, existingReaction := range msg.Reactions {
				if existingReaction.UserID == reaction.UserID && existingReaction.Reaction == reaction.Reaction {
					reactionExists = true
					break
				}
			}

			// Add the new reaction if it doesn't exist
			if !reactionExists {
				messages[i].Reactions = append(messages[i].Reactions, *reaction)
				
				// Save the updated message back to cache
				if err := s.cache.SaveMessage(ctx, roomID, &messages[i]); err != nil {
					return err
				}
				log.Printf("[ChatService] Successfully updated cached message %s with new reaction", messageID)
			}
			break
		}
	}

	return nil
}

// updateCachedMessageRemoveReaction updates the cached message to remove the reaction
func (s *ChatService) updateCachedMessageRemoveReaction(ctx context.Context, roomID, messageID, userID string) error {
	// Get all cached messages for the room
	messages, err := s.cache.GetRoomMessages(ctx, roomID, 1000) // Get a large number to find the message
	if err != nil {
		return err
	}

	// Find the message and remove the reaction
	for i, msg := range messages {
		if msg.ChatMessage.ID.Hex() == messageID {
			// Remove reactions from the specified user
			filteredReactions := make([]model.MessageReaction, 0)
			for _, reaction := range msg.Reactions {
				if reaction.UserID.Hex() != userID {
					filteredReactions = append(filteredReactions, reaction)
				}
			}

			// Update the message with filtered reactions
			messages[i].Reactions = filteredReactions
			
			// Save the updated message back to cache
			if err := s.cache.SaveMessage(ctx, roomID, &messages[i]); err != nil {
				return err
			}
			log.Printf("[ChatService] Successfully removed reaction from cached message %s", messageID)
			break
		}
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
	reactionCollection := s.mongo.Collection("message-reactions")
	
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

	// **IMPORTANT**: Update the cached message to remove this reaction
	if err := s.updateCachedMessageRemoveReaction(ctx, messageData.RoomID.Hex(), messageID, userID); err != nil {
		log.Printf("[ChatService] Failed to update cached message after removing reaction: %v", err)
	}

	// Emit remove reaction event
	log.Printf("[ChatService] About to emit remove reaction messageId=%s userId=%s roomId=%s", 
		messageID, userID, messageData.RoomID.Hex())
	if err := s.emitter.EmitReactionRemoved(ctx, messageObjID, userObjID, messageData.RoomID); err != nil {
		log.Printf("[ChatService] Failed to emit reaction removal: %v", err)
	} else {
		log.Printf("[ChatService] Successfully emitted reaction removal to WebSocket and Kafka")
	}

	// --- Send offline notification to all room members (except sender) ---
	log.Printf("[DEBUG] [RemoveReaction] Sending notifications to all offline room members (except sender %s)", userID)
	s.notifyOfflineReact(ctx, &messageData, &model.MessageReaction{
		MessageID: messageObjID,
		UserID:    userObjID,
		Reaction:  "remove",
		Action:    "delete",
		Timestamp: time.Now(),
	})

	return nil
}

// notifyOfflineReact now loops all room members (except sender) and sends notification to offline users, like mention
func (s *ChatService) notifyOfflineReact(ctx context.Context, message *model.ChatMessage, reaction *model.MessageReaction) {
	// Get all room members
	roomMembers, err := s.getRoomMembers(ctx, message.RoomID)
	if err != nil {
		log.Printf("[ReactionNotifyJob] Failed to get room members: %v", err)
		return
	}

	// loop
	reactionUserID := reaction.UserID.Hex()
	for _, memberID := range roomMembers {
		memberIDStr := memberID.Hex()
		// Skip the sender (the one who reacted)
		if memberIDStr == reactionUserID {
			continue
		}
		isOnline := s.hub.IsUserOnlineInRoom(message.RoomID.Hex(), memberIDStr)
		log.Printf("[ReactionNotifyJob] Check member %s: isOnline=%v", memberIDStr, isOnline)
		if !isOnline {
			log.Printf("[ReactionNotifyJob] Submitting reaction notification job for offline user %s", memberIDStr)
			s.asyncHelper.SubmitNotificationJob(message, []string{}, ctx, &reactionNotificationHandler{
				s:        s,
				ownerID:  memberIDStr,
				reaction: reaction,
			})
		}
	}
}

// reactionNotificationHandler implements NotificationJobHandler for reaction notification
// (ใช้ struct แยกเพื่อส่ง reaction object เข้า handler)
type reactionNotificationHandler struct {
	s       *ChatService
	ownerID string
	reaction *model.MessageReaction
}

func (h *reactionNotificationHandler) SendNotifications(ctx context.Context, msg *model.ChatMessage, onlineUsers []string) error {
	log.Printf("[ReactionNotifyJob] Worker pool is sending reaction notification to %s", h.ownerID)
	if h.s.notificationService != nil {
		h.s.notificationService.SendOfflineReactionNotification(ctx, h.ownerID, msg, h.reaction)
		return nil
	}
	return fmt.Errorf("notificationService is nil")
}

func (h *reactionNotificationHandler) UpdateMessageStatus(messageID primitive.ObjectID, field string, value interface{}) {}
func (h *reactionNotificationHandler) UpdateMessageStatusWithError(messageID primitive.ObjectID, errorMsg string, retryCount int) {} 