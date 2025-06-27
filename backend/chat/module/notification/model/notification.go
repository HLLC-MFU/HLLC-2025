package model

import (
	chatModel "chat/module/chat/model"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Notification Event Types
const (
	NotificationTypeChatMessage      = "chat_message"
	NotificationTypeMention          = "mention"
	NotificationTypeReplyMessage     = "reply_message"
	NotificationTypeReaction         = "reaction"
	NotificationTypeRoomInvite       = "room_invite"
	NotificationTypeRoomUpdate       = "room_update"
	NotificationTypeSystemAlert      = "system_alert"
)

// Notification Status
const (
	NotificationStatusPending    = "pending"
	NotificationStatusSent       = "sent"
	NotificationStatusDelivered  = "delivered"
	NotificationStatusRead       = "read"
	NotificationStatusFailed     = "failed"
)

// Notification Priority
const (
	NotificationPriorityLow    = "low"
	NotificationPriorityNormal = "normal"
	NotificationPriorityHigh   = "high"
	NotificationPriorityUrgent = "urgent"
)

type (
	// ExtendedNotificationPayload represents the enhanced data sent to external notification service
	ExtendedNotificationPayload struct {
		ID          string                 `json:"id"`
		UserID      string                 `json:"userId"`
		Type        string                 `json:"type"`
		Title       string                 `json:"title"`
		Message     string                 `json:"message"`
		Data        map[string]interface{} `json:"data"`
		Priority    string                 `json:"priority"`
		Timestamp   time.Time              `json:"timestamp"`
		ExpiresAt   *time.Time             `json:"expiresAt,omitempty"`
		
		// Legacy fields for backward compatibility
		Receiver string `json:"receiver,omitempty"`
		RoomID   string `json:"roomId,omitempty"`
		Sender   string `json:"sender,omitempty"`
	}

	// ChatNotification represents internal notification record
	ChatNotification struct {
		ID          primitive.ObjectID     `bson:"_id,omitempty" json:"id"`
		UserID      primitive.ObjectID     `bson:"user_id" json:"userId"`
		RoomID      *primitive.ObjectID    `bson:"room_id,omitempty" json:"roomId,omitempty"`
		MessageID   *primitive.ObjectID    `bson:"message_id,omitempty" json:"messageId,omitempty"`
		FromUserID  *primitive.ObjectID    `bson:"from_user_id,omitempty" json:"fromUserId,omitempty"`
		Type        string                 `bson:"type" json:"type"`
		Title       string                 `bson:"title" json:"title"`
		Message     string                 `bson:"message" json:"message"`
		Data        map[string]interface{} `bson:"data,omitempty" json:"data,omitempty"`
		Priority    string                 `bson:"priority" json:"priority"`
		Status      string                 `bson:"status" json:"status"`
		Attempts    int                    `bson:"attempts" json:"attempts"`
		LastAttempt *time.Time             `bson:"last_attempt,omitempty" json:"lastAttempt,omitempty"`
		NextRetry   *time.Time             `bson:"next_retry,omitempty" json:"nextRetry,omitempty"`
		CreatedAt   time.Time              `bson:"created_at" json:"createdAt"`
		UpdatedAt   time.Time              `bson:"updated_at" json:"updatedAt"`
		ExpiresAt   *time.Time             `bson:"expires_at,omitempty" json:"expiresAt,omitempty"`
		
		// Deduplication
		DeduplicationKey string `bson:"deduplication_key" json:"deduplicationKey"`
	}

	// NotificationEvent represents Kafka event for notifications
	NotificationEvent struct {
		Type      string                      `json:"type"`
		Payload   ExtendedNotificationPayload `json:"payload"`
		Timestamp time.Time                   `json:"timestamp"`
		Metadata  map[string]string           `json:"metadata,omitempty"`
	}

	// NotificationTemplate for generating notification content
	NotificationTemplate struct {
		Type     string            `json:"type"`
		Title    string            `json:"title"`
		Message  string            `json:"message"`
		Priority string            `json:"priority"`
		TTL      *time.Duration    `json:"ttl,omitempty"`
		Data     map[string]string `json:"data,omitempty"`
	}
)

// ToExtendedPayload converts ChatNotification to ExtendedNotificationPayload for external service
func (n *ChatNotification) ToExtendedPayload() ExtendedNotificationPayload {
	payload := ExtendedNotificationPayload{
		ID:        n.ID.Hex(),
		UserID:    n.UserID.Hex(),
		Type:      n.Type,
		Title:     n.Title,
		Message:   n.Message,
		Data:      n.Data,
		Priority:  n.Priority,
		Timestamp: n.CreatedAt,
		ExpiresAt: n.ExpiresAt,
	}

	// Add legacy fields for backward compatibility
	payload.Receiver = n.UserID.Hex()
	if n.RoomID != nil {
		payload.RoomID = n.RoomID.Hex()
	}
	if n.FromUserID != nil {
		payload.Sender = n.FromUserID.Hex()
	}

	return payload
}

// ToLegacyPayload converts to original NotificationPayload format for backward compatibility
func (n *ChatNotification) ToLegacyPayload() *chatModel.NotificationPayload {
	var roomID string
	if n.RoomID != nil {
		roomID = n.RoomID.Hex()
	}
	
	var sender string
	if n.FromUserID != nil {
		sender = n.FromUserID.Hex()
	}

	return chatModel.NewNotificationPayload(
		n.UserID.Hex(),
		roomID,
		sender,
		n.Message,
		n.Type,
	)
}

// GenerateDeduplicationKey creates a unique key for deduplication
func GenerateDeduplicationKey(userID, roomID, messageID, notificationType string) string {
	if roomID == "" {
		roomID = "global"
	}
	if messageID == "" {
		messageID = "system"
	}
	return userID + ":" + roomID + ":" + messageID + ":" + notificationType
} 