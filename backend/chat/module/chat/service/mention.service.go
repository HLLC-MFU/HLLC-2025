package service

import (
	chatModel "chat/module/chat/model"
	"chat/module/chat/utils"
	notifyModel "chat/module/notification/model"
	notificationService "chat/module/notification/service"
	userModel "chat/module/user/model"
	"chat/pkg/database/queries"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// SendMentionMessage sends a message with mentions
func (s *ChatService) SendMentionMessage(ctx context.Context, userID, roomID primitive.ObjectID, messageText string) (*chatModel.ChatMessage, error) {
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
	msg := &chatModel.ChatMessage{
		RoomID:      roomID,
		UserID:      userID,
		Message:     messageText,
		Mentions:    validMentionUserIDs,  // Array of user IDs for easy querying
		MentionInfo: mentionInfo,          // Detailed mention info stored in database
		Timestamp:   time.Now(),
	}

	// Send message
	result, err := s.Create(ctx, *msg)
	if err != nil {
		return nil, fmt.Errorf("failed to save mention message: %w", err)
	}
	msg.ID = result.Data[0].ID

	// Cache the message
	enriched := chatModel.ChatMessageEnriched{
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

	// **NEW: Send offline notifications to mentioned users**
	go s.sendOfflineMentionNotifications(ctx, msg, mentionedUsers)

	log.Printf("[ChatService] Successfully sent mention message with %d mentions", len(mentionInfo))
	return msg, nil
}

// sendMentionNotification sends a personal notification to a mentioned user
func (s *ChatService) sendMentionNotification(ctx context.Context, msg *chatModel.ChatMessage, mentionedUser userModel.User) error {
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
func (s *ChatService) GetMentionsForUser(ctx context.Context, userID string, limit int64) ([]chatModel.ChatMessageEnriched, error) {
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

	enriched := make([]chatModel.ChatMessageEnriched, len(result.Data))
	for i, msg := range result.Data {
		enriched[i] = chatModel.ChatMessageEnriched{
			ChatMessage: msg,
		}

		// MentionInfo is already stored in database and populated from query
		// No need to parse mentions again
	}

	return enriched, nil
}

// **NEW: Send offline notifications to mentioned users**
func (s *ChatService) sendOfflineMentionNotifications(ctx context.Context, msg *chatModel.ChatMessage, mentionedUsers []userModel.User) {
	if s.notificationService == nil {
		log.Printf("[ChatService] Notification service not available for offline mentions")
		return
	}

	// Get sender info for notification
	sender, err := s.GetUserById(ctx, msg.UserID.Hex())
	if err != nil {
		log.Printf("[ChatService] Failed to get sender info for offline notifications: %v", err)
		return
	}

	senderName := sender.Username
	if sender.Name.First != "" {
		senderName = fmt.Sprintf("%s %s", sender.Name.First, sender.Name.Last)
	}

	// Send notification to each mentioned user
	for _, mentionedUser := range mentionedUsers {
		// Check if user is currently online in this room
		isOnline := s.hub.IsUserOnlineInRoom(msg.RoomID.Hex(), mentionedUser.ID.Hex())
		if isOnline {
			log.Printf("[ChatService] User %s is online, skipping offline mention notification", mentionedUser.ID.Hex())
			continue
		}

		// Create notification request
		req := notificationService.NotificationRequest{
			UserID:     mentionedUser.ID.Hex(),
			RoomID:     msg.RoomID.Hex(),
			MessageID:  msg.ID.Hex(),
			FromUserID: msg.UserID.Hex(),
			EventType:  notifyModel.NotificationTypeMention,
			Title:      fmt.Sprintf("%s mentioned you", senderName),
			Message:    msg.Message,
			Priority:   notifyModel.NotificationPriorityHigh,
			Data: map[string]interface{}{
				"room_id":     msg.RoomID.Hex(),
				"message_id":  msg.ID.Hex(),
				"sender_id":   msg.UserID.Hex(),
				"sender_name": senderName,
				"mentioned_user": mentionedUser.Username,
				"message_preview": func() string {
					if len(msg.Message) > 100 {
						return msg.Message[:100] + "..."
					}
					return msg.Message
				}(),
			},
		}

		// Send notification
		if err := s.notificationService.NotifyOfflineUser(ctx, req); err != nil {
			log.Printf("[ChatService] Failed to notify offline mentioned user %s: %v", mentionedUser.ID.Hex(), err)
		} else {
			log.Printf("[ChatService] Sent offline mention notification to user %s", mentionedUser.ID.Hex())
		}
	}
} 