package model

import (
	"chat/pkg/common"
	"time"
)

// Event Types - Global constants
const (
    EventTypeMessage    = "message" 
    EventTypeReply      = "reply"
    EventTypeSticker    = "sticker"
    EventTypeUserJoined = "user_joined"
    EventTypeUserLeft   = "user_left"
    EventTypeTyping     = "typing"
    EventTypeNotice     = "notice"
    EventTypeMention    = "mention"
    EventTypeEvoucher   = "evoucher"
    EventTypeUnsendMessage = "unsend_message" // **NEW: Unsend message event**
	EventTypeRestriction = "restriction"
    EventTypePresence     = "presence"
    EventTypeUpload       = "upload"
)

// Message Types - Content
const (
    MessageTypeText    = "message"
    MessageTypeReply   = "reply"  
    MessageTypeSticker = "sticker"
    MessageTypeMention = "mention"
    MessageTypeEvoucher = "evoucher"
    MessageTypeUnsend  = "unsend" // **NEW: Unsend message type**
	MessageTypeRestriction = "restriction"
    MessageTypeUpload   = "upload"
)



type (

	Event struct {
		Type      string      `json:"type"`
		Payload   interface{} `json:"payload"`
		Timestamp time.Time   `json:"timestamp"`
	}
	
	// BasePayload contains common fields for all user-related events
	BasePayload struct {
		Room      RoomInfo  `json:"room"`
		User      UserInfo  `json:"user"`  
		Timestamp time.Time `json:"timestamp"`
	}

	// Core Information Structures
	RoomInfo struct {
		ID    string               `json:"_id"`
		Name  common.LocalizedName `json:"name,omitempty"`
		Image string               `json:"image,omitempty"`
	}

	UserInfo struct {
		ID       string                 `json:"_id"`
		Username string                 `json:"username"`
		Name     map[string]interface{} `json:"name"`
		Role     *RoleInfo              `json:"role,omitempty"`
	}

	RoleInfo struct {
		ID   string `json:"_id"`
		Name string `json:"name"`
	}

	MessageInfo struct {
		ID        string    `json:"_id"`
		Type      string    `json:"type"` // text, reply, sticker, mention
		Message   string    `json:"message,omitempty"`
		Timestamp time.Time `json:"timestamp"`
	}

	StickerInfo struct {
		ID    string `json:"_id"`
		Image string `json:"image"`
		Name  string `json:"name,omitempty"`
	}

	// Mention-related structures
	MentionInfo struct {
		UserID   string `json:"userId"`
		Username string `json:"username"`
	}

	//Restriction-related structures
	RestrictionInfo struct {
		ID string `json:"_id"`
		RoomID string `json:"roomId"`
		UserID string `json:"userId"`
		Restriction string `json:"restriction"`
	}

	ChatNoticePayload struct {
		Room      RoomInfo  `json:"room"`
		Message   string    `json:"message"`
		Timestamp time.Time `json:"timestamp"`
	}

	// **NEW: Unsend Message Payload**
	ChatUnsendPayload struct {
		Room        RoomInfo    `json:"room"`
		User        UserInfo    `json:"user"`        // User ที่ unsend ข้อความ
		MessageID   string      `json:"messageId"`   // ID ของข้อความที่ถูก unsend
		MessageType string      `json:"messageType"` // ประเภทข้อความที่ถูก unsend
		Timestamp   time.Time   `json:"timestamp"`
	}
)