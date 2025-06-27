package model

const (
	NotificationTypeMention = "mention"
	NotificationTypeReply = "reply"
	NotificationTypeReaction = "reaction"
	NotificationTypeSticker = "sticker"
	NotificationTypeMessage = "message"
	NotificationTypePresence = "presence"
	NotificationTypeTyping = "typing"
)

type (
	NotificationPayload struct {
		Receiver string `json:"receiver"`
		RoomID   string `json:"roomId"`
		Sender   string `json:"sender"`
		Message  string `json:"message"`
		Type     string `json:"type"`
	}
)

func NewNotificationPayload(receiver, roomId, sender, message, eventType string) *NotificationPayload {
	return &NotificationPayload{
		Receiver: receiver,
		RoomID:   roomId,
		Sender:   sender,
		Message:  message,
		Type:     eventType,
	}
}