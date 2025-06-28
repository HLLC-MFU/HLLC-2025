package utils

import (
	"time"
)

// Simplified notification structures for external consumption
type (
	NotificationPayload struct {
		Type      string               `json:"type"`
		Room      NotificationRoom     `json:"room"`
		User      NotificationUser     `json:"user"`
		Message   NotificationMessage  `json:"message"`
		Receiver  string               `json:"receiver"`
		Timestamp time.Time            `json:"timestamp"`
	}

	NotificationRoom struct {
		ID    string                 `json:"id"`
		Name  map[string]string      `json:"name"`
		Image string                 `json:"image,omitempty"`
	}

	NotificationUser struct {
		ID       string                 `json:"id"`
		Username string                 `json:"username"`
		Name     map[string]interface{} `json:"name"`
	}

	NotificationMessage struct {
		ID      string `json:"id"`
		Message string `json:"message"`
		Type    string `json:"type"`
	}
)

// CreateNotificationPayload creates a simplified notification payload
func CreateNotificationPayload(
	eventType string,
	roomID string, roomName map[string]string, roomImage string,
	userID, username string, userName map[string]interface{},
	messageID, messageText, messageType string,
	receiverID string,
) NotificationPayload {
	return NotificationPayload{
		Type: eventType,
		Room: NotificationRoom{
			ID:    roomID,
			Name:  roomName,
			Image: roomImage,
		},
		User: NotificationUser{
			ID:       userID,
			Username: username,
			Name:     userName,
		},
		Message: NotificationMessage{
			ID:      messageID,
			Message: messageText,
			Type:    messageType,
		},
		Receiver:  receiverID,
		Timestamp: time.Now(),
	}
}

// CreateSimpleNotificationPayload creates a very basic notification for essential info only
func CreateSimpleNotificationPayload(
	eventType string,
	roomID, roomNameTh, roomNameEn string,
	userID, username, userFirstName, userLastName string,
	messageID, messageText string,
	receiverID string,
) NotificationPayload {
	return NotificationPayload{
		Type: eventType,
		Room: NotificationRoom{
			ID: roomID,
			Name: map[string]string{
				"th": roomNameTh,
				"en": roomNameEn,
			},
		},
		User: NotificationUser{
			ID:       userID,
			Username: username,
			Name: map[string]interface{}{
				"first": userFirstName,
				"last":  userLastName,
			},
		},
		Message: NotificationMessage{
			ID:      messageID,
			Message: messageText,
			Type:    eventType,
		},
		Receiver:  receiverID,
		Timestamp: time.Now(),
	}
} 