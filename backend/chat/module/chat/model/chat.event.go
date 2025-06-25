package model

import "time"

// Event Types - Global constants
const (
    EventTypeHistory    = "history"
    EventTypeMessage    = "message" 
    EventTypeReply      = "reply"
    EventTypeSticker    = "sticker"
    EventTypeReaction   = "reaction"
    EventTypeUserJoined = "user_joined"
    EventTypeUserLeft   = "user_left"
    EventTypeTyping     = "typing"
    EventTypeNotice     = "notice"
)

// Message Types - Content
const (
    MessageTypeText    = "text"
    MessageTypeReply   = "reply"  
    MessageTypeSticker = "sticker"
)

// Reaction Types - Action
const (
    // Note: Reaction types now handled inline as "add"/"remove" strings
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
		ID   string `json:"_id"`
		Name string `json:"name,omitempty"`
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
		Type      string    `json:"type"` // text, reply, sticker, reaction
		Message   string    `json:"message,omitempty"`
		Reaction  string    `json:"reaction,omitempty"` // for reaction events
		Timestamp time.Time `json:"timestamp"`
	}

	StickerInfo struct {
		ID    string `json:"_id"`
		Image string `json:"image"`
		Name  string `json:"name,omitempty"`
	}

	ChatMessagePayload struct {
		BasePayload
		Message MessageInfo  `json:"message"`
		ReplyTo *MessageInfo `json:"replyTo,omitempty"`
	}

	ChatStickerPayload struct {
		BasePayload
		Message MessageInfo `json:"message"`
		Sticker StickerInfo `json:"sticker"`
	}
	
	ChatReactionPayload struct {
		MessageID    string    `json:"messageId"`
		UserID       string    `json:"userId"`
		Username     string    `json:"username,omitempty"`
		Reaction     string    `json:"reaction"`
		Action       string    `json:"action"` // "add" or "remove"
		Timestamp    time.Time `json:"timestamp"`
	}
	
	ChatPresencePayload struct {
		BasePayload
		Message string `json:"message"`
	}

	ChatTypingPayload struct {
		Room      RoomInfo  `json:"room"`
		User      UserInfo  `json:"user"`
		IsTyping  bool      `json:"isTyping"`
		Timestamp time.Time `json:"timestamp"`
	}

	ChatNoticePayload struct {
		Room      RoomInfo  `json:"room"`
		Message   string    `json:"message"`
		Timestamp time.Time `json:"timestamp"`
	}
)