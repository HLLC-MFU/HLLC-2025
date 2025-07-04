package model

import "time"

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
		Role     *NotificationUserRole  `json:"role,omitempty"`
	}

	NotificationUserRole struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}

	NotificationMessage struct {
		ID        string    `json:"id"`
		Message   string    `json:"message"`
		Type      string    `json:"type"`
		FileURL   string    `json:"fileUrl,omitempty"`
		FileType  string    `json:"fileType,omitempty"`
		FileName  string    `json:"fileName,omitempty"`
		Timestamp time.Time `json:"timestamp"`
	}
)

func CreateNotificationPayload(
	eventType string,
	roomID string, roomName map[string]string, roomImage string,
	userID, username string, userName map[string]interface{},
	messageID, messageText, messageType string,
	receiverID string,
	role *NotificationUserRole,
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
			Role:     role,
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
	role *NotificationUserRole,
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
			Role: role,
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

// CreateUploadNotificationPayload creates a notification payload specifically for file uploads
func CreateUploadNotificationPayload(
	eventType string,
	roomID, roomNameTh, roomNameEn string,
	userID, username, userFirstName, userLastName string,
	messageID, messageText string,
	receiverID string,
	fileURL, fileType, fileName string,
	role *NotificationUserRole,
) NotificationPayload {
	payload := CreateSimpleNotificationPayload(
		eventType,
		roomID, roomNameTh, roomNameEn,
		userID, username, userFirstName, userLastName,
		messageID, messageText,
		receiverID,
		role,
	)
	
	payload.Message.Type = "upload"
	payload.Message.FileURL = fileURL
	payload.Message.FileType = fileType
	payload.Message.FileName = fileName
	
	return payload
}