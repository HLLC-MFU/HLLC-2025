package service

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	userModel "chat/module/user/model"
	"chat/pkg/database/queries"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// SendMentionMessage sends a message with mentions
func (s *ChatService) SendMentionMessage(ctx context.Context, userID, roomID primitive.ObjectID, messageText string) (*model.ChatMessage, error) {
	// Initialize mention parser
	mentionParser := utils.NewMentionParser(s.mongo)
	
	// Parse mentions from message text
	mentionInfo, mentionUserIDs, err := mentionParser.ParseMentions(ctx, messageText)
	if err != nil {
		log.Printf("[ChatService] Failed to parse mentions: %v", err)
		return nil, fmt.Errorf("failed to parse mentions: %w", err)
	}

	// Validate mentioned users exist
	mentionedUsers, err := mentionParser.ValidateMentionUsers(ctx, mentionUserIDs)
	if err != nil {
		log.Printf("[ChatService] Failed to validate mentioned users: %v", err)
		return nil, fmt.Errorf("failed to validate mentioned users: %w", err)
	}

	// Filter out users not in room (optional - you might want to allow mentioning users not in room)
	validMentionUserIDs, err := s.filterUsersInRoom(ctx, roomID, mentionUserIDs)
	if err != nil {
		log.Printf("[ChatService] Failed to filter users in room: %v", err)
		// Continue anyway, as this is not critical
		validMentionUserIDs = mentionUserIDs
	}

	// Create message with mentions
	msg := &model.ChatMessage{
		RoomID:      roomID,
		UserID:      userID,
		Message:     messageText,
		Mentions:    validMentionUserIDs,
		MentionInfo: mentionInfo,
		Timestamp:   time.Now(),
	}

	// Send message
	result, err := s.Create(ctx, *msg)
	if err != nil {
		return nil, fmt.Errorf("failed to save mention message: %w", err)
	}
	msg.ID = result.Data[0].ID

	// Cache the message
	enriched := model.ChatMessageEnriched{
		ChatMessage: *msg,
	}
	if err := s.cache.SaveMessage(ctx, roomID.Hex(), &enriched); err != nil {
		log.Printf("[ChatService] Failed to cache mention message: %v", err)
	}

	// Emit message event
	if err := s.emitter.EmitMentionMessage(ctx, msg, mentionInfo); err != nil {
		log.Printf("[ChatService] Failed to emit mention message: %v", err)
	}

	// Send individual mention notifications to mentioned users
	for _, mentionedUser := range mentionedUsers {
		if err := s.sendMentionNotification(ctx, msg, mentionedUser); err != nil {
			log.Printf("[ChatService] Failed to send mention notification to user %s: %v", 
				mentionedUser.ID.Hex(), err)
		}
	}

	log.Printf("[ChatService] Successfully sent mention message with %d mentions", len(mentionInfo))
	return msg, nil
}

// sendMentionNotification sends a personal notification to a mentioned user
func (s *ChatService) sendMentionNotification(ctx context.Context, msg *model.ChatMessage, mentionedUser userModel.User) error {
	// Get sender info
	sender, err := s.GetUserById(ctx, msg.UserID.Hex())
	if err != nil {
		return fmt.Errorf("failed to get sender info: %w", err)
	}

	// Create mention notice event specifically for the mentioned user
	if err := s.emitter.EmitMentionNotice(ctx, msg, sender, &mentionedUser); err != nil {
		return fmt.Errorf("failed to emit mention notice: %w", err)
	}

	log.Printf("[ChatService] Sent mention notification to user %s for message %s", 
		mentionedUser.ID.Hex(), msg.ID.Hex())
	return nil
}

// filterUsersInRoom filters user IDs to only include users who are members of the room
func (s *ChatService) filterUsersInRoom(ctx context.Context, roomID primitive.ObjectID, userIDs []string) ([]string, error) {
	// This would typically check room membership
	// For now, we'll return all user IDs as valid
	// You might want to integrate with your room service here
	
	log.Printf("[ChatService] Filtering %d users for room membership (room: %s)", len(userIDs), roomID.Hex())
	
	// TODO: Add actual room membership checking here
	// Example:
	// validUserIDs := make([]string, 0)
	// for _, userID := range userIDs {
	//     if isUserInRoom, err := s.roomService.IsUserInRoom(ctx, roomID, userID); err == nil && isUserInRoom {
	//         validUserIDs = append(validUserIDs, userID)
	//     }
	// }
	// return validUserIDs, nil
	
	return userIDs, nil
}

// GetMentionsForUser gets all messages where a user was mentioned
func (s *ChatService) GetMentionsForUser(ctx context.Context, userID string, limit int64) ([]model.ChatMessageEnriched, error) {
	// Find messages where user was mentioned
	opts := queries.QueryOptions{
		Filter: map[string]interface{}{
			"mentions": userID,
		},
		Sort:  "-timestamp",
		Limit: int(limit),
	}

	result, err := s.FindAllWithPopulate(ctx, opts, "user_id", "users")
	if err != nil {
		return nil, fmt.Errorf("failed to find mention messages: %w", err)
	}

	enriched := make([]model.ChatMessageEnriched, len(result.Data))
	for i, msg := range result.Data {
		enriched[i] = model.ChatMessageEnriched{
			ChatMessage: msg,
		}

		// Parse mention info for display
		mentionParser := utils.NewMentionParser(s.mongo)
		mentionInfo, _, err := mentionParser.ParseMentions(ctx, msg.Message)
		if err == nil {
			enriched[i].ChatMessage.MentionInfo = mentionInfo
		}
	}

	return enriched, nil
} 