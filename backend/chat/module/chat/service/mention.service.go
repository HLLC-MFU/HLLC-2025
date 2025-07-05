package service

import (
	chatModel "chat/module/chat/model"
	"chat/module/chat/utils"
	userModel "chat/module/user/model"
	"chat/pkg/database/queries"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	MentionService interface {
		SendMentionMessage(ctx context.Context, userID, roomID primitive.ObjectID, messageText string) (*chatModel.ChatMessage, error)
		GetMentionsForUser(ctx context.Context, userID string, limit int64) ([]chatModel.ChatMessageEnriched, error)
	}

	MentionRoomService interface {
		IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
		CanUserSendMessage(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
	}
)

// SendMentionMessage sends a message with mentions
func (s *ChatService) SendMentionMessage(ctx context.Context, userID, roomID primitive.ObjectID, messageText string) (*chatModel.ChatMessage, error) {
	// **NEW: ตรวจสอบ moderation status ก่อนส่งข้อความ**
	if !s.restrictionService.CanUserSendMessages(ctx, userID, roomID) {
		// ตรวจสอบว่าถูก ban หรือ mute
		if s.restrictionService.IsUserBanned(ctx, userID, roomID) {
			return nil, fmt.Errorf("user is banned from this room")
		}
		if s.restrictionService.IsUserMuted(ctx, userID, roomID) {
			return nil, fmt.Errorf("user is muted in this room")
		}
		return nil, fmt.Errorf("user cannot send messages in this room")
	}

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
		ID:          primitive.NewObjectID(), // **PERFORMANCE: Generate ID first**
		RoomID:      roomID,
		UserID:      userID,
		Message:     messageText,
		Mentions:    validMentionUserIDs,  // Array of user IDs for easy querying
		MentionInfo: mentionInfo,          // Detailed mention info stored in database
		Timestamp:   time.Now(),
	}

	// **IMMEDIATE: Broadcast mention message first**
	if err := s.emitter.EmitMentionMessage(ctx, msg, mentionInfo); err != nil {
		log.Printf("[ChatService] Failed to emit mention message: %v", err)
	} else {
		log.Printf("[ChatService] ✅ Mention message broadcasted immediately ID=%s", msg.ID.Hex())
	}

	// **ASYNC: Save to DB and cache in background**
	go func() {
		bgCtx := context.Background()
		
		// Save to database (async)
		if _, err := s.Create(bgCtx, *msg); err != nil {
			log.Printf("[ChatService] ❌ Failed to save mention message to DB (async): %v", err)
		} else {
			log.Printf("[ChatService] ✅ Mention message saved to DB (async) ID=%s", msg.ID.Hex())
		}

		// Cache the message (async)
		enriched := chatModel.ChatMessageEnriched{
			ChatMessage: *msg,
		}
		if err := s.cache.SaveMessage(bgCtx, roomID.Hex(), &enriched); err != nil {
			log.Printf("[ChatService] ❌ Failed to cache mention message (async): %v", err)
		}
	}()

	// Send individual mention notifications to mentioned users
	for _, mentionedUser := range mentionedUsers {
		if err := s.sendMentionNotification(ctx, msg, mentionedUser); err != nil {
			log.Printf("[ChatService] Failed to send mention notification to user %s: %v", 
				mentionedUser.ID.Hex(), err)
		}
	}

	// **FIXED: Send notifications to ALL offline users in the room for mention messages**
	s.notifyOfflineUsersForMention(msg)

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

// **FIXED: Send notifications to ALL offline users in the room for mention messages**
func (s *ChatService) notifyOfflineUsersForMention(msg *chatModel.ChatMessage) {
	ctx := context.Background()
	
	// Get all room members
	roomMembers, err := s.getRoomMembers(ctx, msg.RoomID)
	if err != nil {
		log.Printf("[ChatService] Failed to get room members for mention notification: %v", err)
		return
	}

	// Get online users in this room
	onlineUsers := s.hub.GetOnlineUsersInRoom(msg.RoomID.Hex())
	onlineUserMap := make(map[string]bool)
	for _, userID := range onlineUsers {
		onlineUserMap[userID] = true
	}

	log.Printf("[ChatService] Sending mention notifications to offline users in room %s", msg.RoomID.Hex())
	
	// Send notification to ALL offline members (except sender)
	for _, memberID := range roomMembers {
		memberIDStr := memberID.Hex()

		// Skip the sender
		if memberIDStr == msg.UserID.Hex() {
			continue
		}

		// Skip online users (they already received WebSocket message)
		if onlineUserMap[memberIDStr] {
			log.Printf("[ChatService] User %s is online, skipping mention notification", memberIDStr)
			continue
		}

		log.Printf("[ChatService] User %s is OFFLINE, sending mention notification", memberIDStr)
		
		// ✅ Send offline notification using the proper notification service method
		s.notificationService.SendOfflineNotification(ctx, memberIDStr, msg, "mention")
	}
	
	log.Printf("[ChatService] Mention notifications sent to offline users in room %s", msg.RoomID.Hex())
} 