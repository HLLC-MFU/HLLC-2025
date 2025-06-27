package dto

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// NotifyRequestDto สำหรับรับข้อมูลจาก API
type NotificationRequestDto struct {
	UserID      string                 `json:"userId" validate:"required,mongoId"`
	RoomID      string                 `json:"roomId,omitempty" validate:"omitempty,mongoId"`
	MessageID   string                 `json:"messageId,omitempty" validate:"omitempty,mongoId"`
	FromUserID  string                 `json:"fromUserId,omitempty" validate:"omitempty,mongoId"`
	EventType   string                 `json:"eventType" validate:"required"`
	Message     string                 `json:"message" validate:"required"`
	Title       string                 `json:"title,omitempty"`
	Priority    string                 `json:"priority,omitempty"`
	Data        map[string]interface{} `json:"data,omitempty"`
	ExpiresAt   *time.Time             `json:"expiresAt,omitempty"`
}

// BatchNotificationRequestDto สำหรับรับข้อมูลจาก API สำหรับส่งกลุ่มการแจ้งเตือน
type BatchNotificationRequestDto struct {
	UserIDs     []string               `json:"userIds" validate:"required,min=1"`
	RoomID      string                 `json:"roomId,omitempty" validate:"omitempty,mongoId"`
	MessageID   string                 `json:"messageId,omitempty" validate:"omitempty,mongoId"`
	FromUserID  string                 `json:"fromUserId,omitempty" validate:"omitempty,mongoId"`
	EventType   string                 `json:"eventType" validate:"required"`
	Message     string                 `json:"message" validate:"required"`
	Title       string                 `json:"title,omitempty"`
	Priority    string                 `json:"priority,omitempty"`
	Data        map[string]interface{} `json:"data,omitempty"`
	ExpiresAt   *time.Time             `json:"expiresAt,omitempty"`
}

// MentionNotificationDto สำหรับรับข้อมูลจาก API สำหรับส่งกลุ่มการแจ้งเตือน
type MentionNotificationDto struct {
	RoomID      string `json:"roomId" validate:"required,mongoId"`
	MessageID   string `json:"messageId" validate:"required,mongoId"`
	FromUserID  string `json:"fromUserId" validate:"required,mongoId"`
	MentionedUserIDs []string `json:"mentionedUserIds" validate:"required,min=1"`
	Message     string `json:"message" validate:"required"`
}

// ToObjectIDs converts string IDs to ObjectIDs
func (dto *NotificationRequestDto) ToObjectIDs() (userObjID, roomObjID, messageObjID, fromUserObjID primitive.ObjectID, err error) {
	userObjID, err = primitive.ObjectIDFromHex(dto.UserID)
	if err != nil {
		return
	}

	if dto.RoomID != "" {
		roomObjID, err = primitive.ObjectIDFromHex(dto.RoomID)
		if err != nil {
			return
		}
	}

	if dto.MessageID != "" {
		messageObjID, err = primitive.ObjectIDFromHex(dto.MessageID)
		if err != nil {
			return
		}
	}

	if dto.FromUserID != "" {
		fromUserObjID, err = primitive.ObjectIDFromHex(dto.FromUserID)
		if err != nil {
			return
		}
	}

	return
}

// ToObjectIDs converts string IDs to ObjectIDs for mention notification
func (dto *MentionNotificationDto) ToObjectIDs() (roomObjID, messageObjID, fromUserObjID primitive.ObjectID, mentionedUserObjIDs []primitive.ObjectID, err error) {
	roomObjID, err = primitive.ObjectIDFromHex(dto.RoomID)
	if err != nil {
		return
	}

	messageObjID, err = primitive.ObjectIDFromHex(dto.MessageID)
	if err != nil {
		return
	}

	fromUserObjID, err = primitive.ObjectIDFromHex(dto.FromUserID)
	if err != nil {
		return
	}

	mentionedUserObjIDs = make([]primitive.ObjectID, len(dto.MentionedUserIDs))
	for i, userID := range dto.MentionedUserIDs {
		mentionedUserObjIDs[i], err = primitive.ObjectIDFromHex(userID)
		if err != nil {
			return
		}
	}

	return
}

// NotificationResponseDto represents a notification response
type NotificationResponseDto struct {
	ID          string                 `json:"id"`
	UserID      string                 `json:"userId"`
	EventType   string                 `json:"eventType"`
	Title       string                 `json:"title"`
	Message     string                 `json:"message"`
	Priority    string                 `json:"priority"`
	Status      string                 `json:"status"`
	Data        map[string]interface{} `json:"data"`
	CreatedAt   time.Time              `json:"createdAt"`
	ExpiresAt   *time.Time             `json:"expiresAt,omitempty"`
	ReadAt      *time.Time             `json:"readAt,omitempty"`
}

// NotificationStatusDto represents notification status update
type NotificationStatusDto struct {
	Status string `json:"status" validate:"required,oneof=pending sent failed delivered"`
}

// NotificationStatsDto represents notification statistics
type NotificationStatsDto struct {
	TotalSent     int `json:"totalSent"`
	TotalDelivered int `json:"totalDelivered"`
	TotalFailed   int `json:"totalFailed"`
	TotalPending  int `json:"totalPending"`
} 