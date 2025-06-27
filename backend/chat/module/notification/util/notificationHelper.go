package util

import (
	hub "chat/module/chat/utils"
	model "chat/module/notification/model"
	userModel "chat/module/user/model"
	"chat/pkg/database/queries"
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// NotificationHelper provides utility functions for notification operations
type NotificationHelper struct {
	mongo *mongo.Database
	hub   *hub.Hub
}

// NewNotificationHelper creates a new notification helper instance
func NewNotificationHelper(mongo *mongo.Database, hub *hub.Hub) *NotificationHelper {
	return &NotificationHelper{
		mongo: mongo,
		hub:   hub,
	}
}

// Online Status Helpers

// IsUserOfflineInRoom checks if a user is offline in a specific room
func (h *NotificationHelper) IsUserOfflineInRoom(roomID, userID string) bool {
	return !h.hub.IsUserOnlineInRoom(roomID, userID)
}

// GetOfflineUsers returns a list of users who are offline in a room
func (h *NotificationHelper) GetOfflineUsers(roomID string, userIDs []string) []string {
	var offlineUsers []string
	for _, userID := range userIDs {
		if h.IsUserOfflineInRoom(roomID, userID) {
			offlineUsers = append(offlineUsers, userID)
		}
	}
	return offlineUsers
}

// Room Membership Helpers

// ValidateRoomMembership checks if a user is a member of a room
func (h *NotificationHelper) ValidateRoomMembership(ctx context.Context, roomID, userID string) (bool, error) {
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return false, fmt.Errorf("invalid room ID: %w", err)
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return false, fmt.Errorf("invalid user ID: %w", err)
	}

	roomCollection := h.mongo.Collection("rooms")
	count, err := roomCollection.CountDocuments(ctx, bson.M{
		"_id":     roomObjID,
		"members": userObjID,
	})
	
	return count > 0, err
}

// GetRoomMembers returns all member IDs for a room
func (h *NotificationHelper) GetRoomMembers(ctx context.Context, roomID string) ([]string, error) {
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, fmt.Errorf("invalid room ID: %w", err)
	}

	roomCollection := h.mongo.Collection("rooms")
	var room struct {
		Members []primitive.ObjectID `bson:"members"`
	}
	
	err = roomCollection.FindOne(ctx, bson.M{"_id": roomObjID}).Decode(&room)
	if err != nil {
		return nil, fmt.Errorf("failed to get room members: %w", err)
	}

	memberIDs := make([]string, len(room.Members))
	for i, memberID := range room.Members {
		memberIDs[i] = memberID.Hex()
	}

	return memberIDs, nil
}

// User Information Helpers

// GetUserInfo retrieves user information for notifications
func (h *NotificationHelper) GetUserInfo(ctx context.Context, userID string) (*UserInfo, error) {
	_, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	userService := queries.NewBaseService[userModel.User](h.mongo.Collection("users"))
	result, err := userService.FindOneById(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if len(result.Data) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	user := result.Data[0]
	return &UserInfo{
		ID:       user.ID.Hex(),
		Username: user.Username,
		Name: UserName{
			First:  user.Name.First,
			Middle: user.Name.Middle,
			Last:   user.Name.Last,
		},
		Role: user.Role,
	}, nil
}

// GetUsersInfo retrieves multiple users information
func (h *NotificationHelper) GetUsersInfo(ctx context.Context, userIDs []string) (map[string]*UserInfo, error) {
	userInfoMap := make(map[string]*UserInfo)
	
	for _, userID := range userIDs {
		userInfo, err := h.GetUserInfo(ctx, userID)
		if err != nil {
			log.Printf("[NotificationHelper] Failed to get user info for %s: %v", userID, err)
			continue
		}
		userInfoMap[userID] = userInfo
	}

	return userInfoMap, nil
}

// UserInfo represents user information for notifications
type UserInfo struct {
	ID       string              `json:"id"`
	Username string              `json:"username"`
	Name     UserName            `json:"name"`
	Role     primitive.ObjectID  `json:"role"`
}

// UserName represents user name structure
type UserName struct {
	First  string `json:"first"`
	Middle string `json:"middle"`
	Last   string `json:"last"`
}

// GetDisplayName returns the display name for a user
func (u *UserInfo) GetDisplayName() string {
	if u.Name.First != "" {
		name := u.Name.First
		if u.Name.Last != "" {
			name += " " + u.Name.Last
		}
		return name
	}
	return u.Username
}

// Message Formatting Helpers

// FormatNotificationTitle formats notification title based on event type
func (h *NotificationHelper) FormatNotificationTitle(eventType string, senderName string) string {
	switch eventType {
	case model.NotificationTypeMention:
		return fmt.Sprintf("%s mentioned you", senderName)
	case model.NotificationTypeReplyMessage:
		return fmt.Sprintf("%s replied to your message", senderName)
	case model.NotificationTypeReaction:
		return fmt.Sprintf("%s reacted to your message", senderName)
	case model.NotificationTypeChatMessage:
		return fmt.Sprintf("New message from %s", senderName)
	case model.NotificationTypeRoomInvite:
		return fmt.Sprintf("%s invited you to a room", senderName)
	case model.NotificationTypeRoomUpdate:
		return "Room updated"
	case model.NotificationTypeSystemAlert:
		return "System notification"
	default:
		return "New notification"
	}
}

// FormatNotificationMessage formats notification message content
func (h *NotificationHelper) FormatNotificationMessage(eventType, originalMessage string, data map[string]interface{}) string {
	switch eventType {
	case model.NotificationTypeMention:
		return h.truncateMessage(originalMessage, 100)
	case model.NotificationTypeReplyMessage:
		return h.truncateMessage(originalMessage, 100)
	case model.NotificationTypeReaction:
		if reaction, ok := data["reaction"].(string); ok {
			return fmt.Sprintf("reacted with %s", reaction)
		}
		return "reacted to your message"
	case model.NotificationTypeChatMessage:
		return h.truncateMessage(originalMessage, 100)
	default:
		return originalMessage
	}
}

// truncateMessage truncates a message to specified length with ellipsis
func (h *NotificationHelper) truncateMessage(message string, maxLength int) string {
	if len(message) <= maxLength {
		return message
	}
	return message[:maxLength] + "..."
}

// Deduplication Helpers

// GenerateDeduplicationKey creates a deduplication key for notifications
func (h *NotificationHelper) GenerateDeduplicationKey(userID, roomID, messageID, eventType string) string {
	return model.GenerateDeduplicationKey(userID, roomID, messageID, eventType)
}

// Template and Priority Helpers

// GetNotificationPriority returns appropriate priority for event type
func (h *NotificationHelper) GetNotificationPriority(eventType string) string {
	switch eventType {
	case model.NotificationTypeMention:
		return model.NotificationPriorityHigh
	case model.NotificationTypeReplyMessage:
		return model.NotificationPriorityNormal
	case model.NotificationTypeReaction:
		return model.NotificationPriorityLow
	case model.NotificationTypeChatMessage:
		return model.NotificationPriorityNormal
	case model.NotificationTypeRoomInvite:
		return model.NotificationPriorityHigh
	case model.NotificationTypeRoomUpdate:
		return model.NotificationPriorityNormal
	case model.NotificationTypeSystemAlert:
		return model.NotificationPriorityUrgent
	default:
		return model.NotificationPriorityNormal
	}
}

// GetNotificationTTL returns appropriate TTL for event type
func (h *NotificationHelper) GetNotificationTTL(eventType string) time.Duration {
	switch eventType {
	case model.NotificationTypeMention:
		return 7 * 24 * time.Hour // 7 days
	case model.NotificationTypeReplyMessage:
		return 7 * 24 * time.Hour // 7 days
	case model.NotificationTypeReaction:
		return 24 * time.Hour // 1 day
	case model.NotificationTypeChatMessage:
		return 3 * 24 * time.Hour // 3 days
	case model.NotificationTypeRoomInvite:
		return 30 * 24 * time.Hour // 30 days
	case model.NotificationTypeRoomUpdate:
		return 7 * 24 * time.Hour // 7 days
	case model.NotificationTypeSystemAlert:
		return 30 * 24 * time.Hour // 30 days
	default:
		return 7 * 24 * time.Hour
	}
}

// Data Enhancement Helpers

// BuildNotificationData creates notification data payload
func (h *NotificationHelper) BuildNotificationData(eventType, roomID, messageID, senderID string, additionalData map[string]interface{}) map[string]interface{} {
	data := map[string]interface{}{
		"event_type": eventType,
	}

	if roomID != "" {
		data["room_id"] = roomID
	}

	if messageID != "" {
		data["message_id"] = messageID
	}

	if senderID != "" {
		data["sender_id"] = senderID
	}

	// Add additional data
	for key, value := range additionalData {
		data[key] = value
	}

	return data
}

// EnhanceNotificationData adds user names and room info to notification data
func (h *NotificationHelper) EnhanceNotificationData(ctx context.Context, data map[string]interface{}) map[string]interface{} {
	enhanced := make(map[string]interface{})
	for k, v := range data {
		enhanced[k] = v
	}

	// Add sender name if sender_id exists
	if senderID, ok := data["sender_id"].(string); ok {
		if userInfo, err := h.GetUserInfo(ctx, senderID); err == nil {
			enhanced["sender_name"] = userInfo.GetDisplayName()
			enhanced["sender_username"] = userInfo.Username
		}
	}

	// Add room name if room_id exists
	if roomID, ok := data["room_id"].(string); ok {
		if roomName := h.getRoomName(ctx, roomID); roomName != "" {
			enhanced["room_name"] = roomName
		}
	}

	return enhanced
}

// getRoomName retrieves room name (helper function)
func (h *NotificationHelper) getRoomName(ctx context.Context, roomID string) string {
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ""
	}

	roomCollection := h.mongo.Collection("rooms")
	var room struct {
		Name struct {
			EN string `bson:"en"`
			TH string `bson:"th"`
		} `bson:"name"`
	}

	err = roomCollection.FindOne(ctx, bson.M{"_id": roomObjID}).Decode(&room)
	if err != nil {
		return ""
	}

	// Return English name, fallback to Thai if empty
	if room.Name.EN != "" {
		return room.Name.EN
	}
	return room.Name.TH
}

// Filtering Helpers

// FilterExcludedUsers removes excluded users from the list
func (h *NotificationHelper) FilterExcludedUsers(userIDs []string, excludeUserIDs ...string) []string {
	excludeMap := make(map[string]bool)
	for _, userID := range excludeUserIDs {
		excludeMap[userID] = true
	}

	var filtered []string
	for _, userID := range userIDs {
		if !excludeMap[userID] {
			filtered = append(filtered, userID)
		}
	}

	return filtered
}

// FilterValidUsers removes invalid user IDs from the list
func (h *NotificationHelper) FilterValidUsers(ctx context.Context, userIDs []string) []string {
	var validUsers []string
	
	for _, userID := range userIDs {
		if _, err := primitive.ObjectIDFromHex(userID); err == nil {
			// Additional validation can be added here (e.g., user exists)
			validUsers = append(validUsers, userID)
		}
	}

	return validUsers
}

// Batch Processing Helpers

// BatchNotificationRequest represents a batch notification request
type BatchNotificationRequest struct {
	UserIDs     []string
	RoomID      string
	MessageID   string
	FromUserID  string
	EventType   string
	Message     string
	Title       string
	Priority    string
	Data        map[string]interface{}
	ExpiresAt   *time.Time
}

// PrepareBatchNotifications prepares individual notification requests from batch request
func (h *NotificationHelper) PrepareBatchNotifications(ctx context.Context, batchReq BatchNotificationRequest) []NotificationRequest {
	var requests []NotificationRequest

	// Get enhanced data
	enhancedData := h.EnhanceNotificationData(ctx, batchReq.Data)

	// Get sender info for title formatting
	var senderName string
	if batchReq.FromUserID != "" {
		if userInfo, err := h.GetUserInfo(ctx, batchReq.FromUserID); err == nil {
			senderName = userInfo.GetDisplayName()
		}
	}

	// Prepare individual requests
	for _, userID := range batchReq.UserIDs {
		// Skip if user is online in room
		if batchReq.RoomID != "" && !h.IsUserOfflineInRoom(batchReq.RoomID, userID) {
			continue
		}

		title := batchReq.Title
		if title == "" {
			title = h.FormatNotificationTitle(batchReq.EventType, senderName)
		}

		message := batchReq.Message
		if message == "" {
			message = h.FormatNotificationMessage(batchReq.EventType, batchReq.Message, enhancedData)
		}

		priority := batchReq.Priority
		if priority == "" {
			priority = h.GetNotificationPriority(batchReq.EventType)
		}

		expiresAt := batchReq.ExpiresAt
		if expiresAt == nil {
			ttl := h.GetNotificationTTL(batchReq.EventType)
			expiry := time.Now().Add(ttl)
			expiresAt = &expiry
		}

		requests = append(requests, NotificationRequest{
			UserID:     userID,
			RoomID:     batchReq.RoomID,
			MessageID:  batchReq.MessageID,
			FromUserID: batchReq.FromUserID,
			EventType:  batchReq.EventType,
			Message:    message,
			Title:      title,
			Priority:   priority,
			Data:       enhancedData,
			ExpiresAt:  expiresAt,
		})
	}

	return requests
}

// NotificationRequest represents a single notification request (imported from service)
type NotificationRequest struct {
	UserID      string
	RoomID      string
	MessageID   string
	FromUserID  string
	EventType   string
	Message     string
	Title       string
	Priority    string
	Data        map[string]interface{}
	ExpiresAt   *time.Time
}

// Validation Helpers

// ValidateNotificationRequest validates a notification request
func (h *NotificationHelper) ValidateNotificationRequest(req NotificationRequest) error {
	if req.UserID == "" {
		return fmt.Errorf("user ID is required")
	}

	if _, err := primitive.ObjectIDFromHex(req.UserID); err != nil {
		return fmt.Errorf("invalid user ID format: %w", err)
	}

	if req.EventType == "" {
		return fmt.Errorf("event type is required")
	}

	// Validate event type
	validEventTypes := []string{
		model.NotificationTypeChatMessage,
		model.NotificationTypeMention,
		model.NotificationTypeReplyMessage,
		model.NotificationTypeReaction,
		model.NotificationTypeRoomInvite,
		model.NotificationTypeRoomUpdate,
		model.NotificationTypeSystemAlert,
	}

	isValidEventType := false
	for _, validType := range validEventTypes {
		if req.EventType == validType {
			isValidEventType = true
			break
		}
	}

	if !isValidEventType {
		return fmt.Errorf("invalid event type: %s", req.EventType)
	}

	// Validate room ID if provided
	if req.RoomID != "" {
		if _, err := primitive.ObjectIDFromHex(req.RoomID); err != nil {
			return fmt.Errorf("invalid room ID format: %w", err)
		}
	}

	// Validate message ID if provided
	if req.MessageID != "" {
		if _, err := primitive.ObjectIDFromHex(req.MessageID); err != nil {
			return fmt.Errorf("invalid message ID format: %w", err)
		}
	}

	// Validate from user ID if provided
	if req.FromUserID != "" {
		if _, err := primitive.ObjectIDFromHex(req.FromUserID); err != nil {
			return fmt.Errorf("invalid from user ID format: %w", err)
		}
	}

	return nil
}

// Logging Helpers

// LogNotificationEvent logs notification events for debugging
func (h *NotificationHelper) LogNotificationEvent(event string, userID string, data map[string]interface{}) {
	logData := make([]string, 0)
	for key, value := range data {
		logData = append(logData, fmt.Sprintf("%s=%v", key, value))
	}
	
	log.Printf("[NotificationHelper] %s for user %s: %s", 
		event, userID, strings.Join(logData, ", "))
}

// LogBatchNotification logs batch notification results
func (h *NotificationHelper) LogBatchNotification(eventType string, totalUsers, processedUsers, skippedUsers int) {
	log.Printf("[NotificationHelper] Batch %s notification: total=%d, processed=%d, skipped=%d", 
		eventType, totalUsers, processedUsers, skippedUsers)
}