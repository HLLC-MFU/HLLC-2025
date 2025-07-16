package model

import (
	"chat/module/chat/model"
	"chat/pkg/common"
	"time"
)

// Message Types - using constants from chat.event.go
const (
	MessageTypeMessage     = "message"  // Changed from "text" to "message"
	MessageTypeReply       = "reply"
	MessageTypeSticker     = "sticker"
	MessageTypeMention     = "mention"
	MessageTypeEvoucher    = "evoucher"
	MessageTypeUnsend      = "unsend"
	MessageTypeRestriction = "restriction"
	MessageTypeUpload      = "upload"
	MessageTypeReaction    = "reaction"
	
	// Specific Restriction Types
	MessageTypeRestrictionBan    = "restriction_ban"
	MessageTypeRestrictionUnban  = "restriction_unban"
	MessageTypeRestrictionMute   = "restriction_mute"
	MessageTypeRestrictionUnmute = "restriction_unmute"
	MessageTypeRestrictionKick   = "restriction_kick"
)

type NotificationPayload struct {
	Type      string               `json:"type"`
	Room      NotificationRoom     `json:"room"`
	Sender    NotificationSender   `json:"sender"`
	Message   NotificationMessage  `json:"message"`
	Receiver  string               `json:"receiver"`
	Timestamp time.Time            `json:"timestamp"`
}

type NotificationRoom struct {
	ID    string                 `json:"_id"`
	Name  common.LocalizedName   `json:"name"`
	Image string                 `json:"image,omitempty"`
}

type NotificationSender struct {
	ID       string                     `json:"_id"`
	Username string                     `json:"username"`
	Name     common.Name                `json:"name"`
	Role     *NotificationSenderRole    `json:"role,omitempty"`
}

type NotificationSenderRole struct {
	ID   string `json:"_id"`
	Name string `json:"name"`
}

type NotificationMessage struct {
	ID           string                     `json:"_id"`
	Message      string                     `json:"message"`
	Type         string                     `json:"type"`
	FileName     string                     `json:"fileName,omitempty"`
	Timestamp    time.Time                  `json:"timestamp"`
	
	// Enhanced fields for different message types
	EvoucherInfo *model.EvoucherInfo        `json:"evoucherInfo,omitempty"`
	MentionInfo  []model.MentionInfo        `json:"mentionInfo,omitempty"`
	StickerInfo  *NotificationStickerInfo   `json:"stickerInfo,omitempty"`
	ReplyTo      *NotificationReplyInfo     `json:"replyTo,omitempty"`
	ReactionInfo *NotificationReactionInfo  `json:"reactionInfo,omitempty"`
	UploadInfo   *NotificationUploadInfo    `json:"uploadInfo,omitempty"`
}

type NotificationStickerInfo struct {
	ID    string `json:"_id"`
	Image string `json:"image"`
	Name  string `json:"name,omitempty"`
}

type NotificationReplyInfo struct {
	MessageID    string `json:"messageId"`
	Message      string `json:"message,omitempty"`
	SenderID     string `json:"senderId,omitempty"`
	SenderName   string `json:"senderName,omitempty"`
}

type NotificationReactionInfo struct {
	Action     string `json:"action"`     // "add", "update", or "delete"
	ReactToID  string `json:"reactToId"`  // ID of message being reacted to
	Emoji      string `json:"emoji"`      // emoji or reaction type
}

type NotificationUploadInfo struct {
	FileName string `json:"fileName"`
}

// Helper constructors for different notification types
func NewTextNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, receiver string) NotificationPayload {
	return NotificationPayload{
		Type:      MessageTypeMessage,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

func NewStickerNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, stickerInfo NotificationStickerInfo, receiver string) NotificationPayload {
	message.Type = MessageTypeSticker
	message.StickerInfo = &stickerInfo
	
	return NotificationPayload{
		Type:      MessageTypeSticker,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

func NewEvoucherNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, evoucherInfo *model.EvoucherInfo, receiver string) NotificationPayload {
	message.Type = MessageTypeEvoucher
	message.EvoucherInfo = evoucherInfo
	
	return NotificationPayload{
		Type:      MessageTypeEvoucher,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

func NewMentionNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, mentionInfo []model.MentionInfo, receiver string) NotificationPayload {
	message.Type = MessageTypeMention
	message.MentionInfo = mentionInfo
	
	return NotificationPayload{
		Type:      MessageTypeMention,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

func NewReplyNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, replyInfo NotificationReplyInfo, receiver string) NotificationPayload {
	message.Type = MessageTypeReply
	message.ReplyTo = &replyInfo
	
	return NotificationPayload{
		Type:      MessageTypeReply,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

func NewReactionNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, reactionInfo NotificationReactionInfo, receiver string) NotificationPayload {
	// Don't set message.Type for reaction notifications (as requested)
	message.ReactionInfo = &reactionInfo
	
	return NotificationPayload{
		Type:      MessageTypeReaction,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

func NewUploadNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, uploadInfo NotificationUploadInfo, receiver string) NotificationPayload {
	message.Type = MessageTypeUpload
	message.UploadInfo = &uploadInfo
	
	return NotificationPayload{
		Type:      MessageTypeUpload,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

func NewRestrictionNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, receiver string) NotificationPayload {
	message.Type = MessageTypeRestriction
	
	return NotificationPayload{
		Type:      MessageTypeRestriction,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

// Specific restriction notification constructors
func NewRestrictionBanNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, receiver string) NotificationPayload {
	message.Type = MessageTypeRestrictionBan
	
	return NotificationPayload{
		Type:      MessageTypeRestrictionBan,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

func NewRestrictionUnbanNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, receiver string) NotificationPayload {
	message.Type = MessageTypeRestrictionUnban
	
	return NotificationPayload{
		Type:      MessageTypeRestrictionUnban,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

func NewRestrictionMuteNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, receiver string) NotificationPayload {
	message.Type = MessageTypeRestrictionMute
	
	return NotificationPayload{
		Type:      MessageTypeRestrictionMute,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

func NewRestrictionUnmuteNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, receiver string) NotificationPayload {
	message.Type = MessageTypeRestrictionUnmute
	
	return NotificationPayload{
		Type:      MessageTypeRestrictionUnmute,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

func NewRestrictionKickNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, receiver string) NotificationPayload {
	message.Type = MessageTypeRestrictionKick
	
	return NotificationPayload{
		Type:      MessageTypeRestrictionKick,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

func NewUnsendNotification(room NotificationRoom, sender NotificationSender, message NotificationMessage, receiver string) NotificationPayload {
	message.Type = MessageTypeUnsend
	
	return NotificationPayload{
		Type:      MessageTypeUnsend,
		Room:      room,
		Sender:    sender,
		Message:   message,
		Receiver:  receiver,
		Timestamp: message.Timestamp,
	}
}

// Helper function to create base notification components
func CreateNotificationRoom(id, nameTh, nameEn, image string) NotificationRoom {
	return NotificationRoom{
		ID: id,
		Name: common.LocalizedName{
			Th: nameTh,
			En: nameEn,
		},
		Image: image,
	}
}

func CreateNotificationSender(id, username, firstName, lastName string, role *NotificationSenderRole) NotificationSender {
	return NotificationSender{
		ID:       id,
		Username: username,
		Name: common.Name{
			First: firstName,
			Last:  lastName,
		},
		Role: role,
	}
}

func CreateNotificationMessage(id, message, messageType string, timestamp time.Time) NotificationMessage {
	return NotificationMessage{
		ID:        id,
		Message:   message,
		Type:      messageType,
		Timestamp: timestamp,
	}
}
