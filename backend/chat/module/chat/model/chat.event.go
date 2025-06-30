package model

import "time"

// Event Types - Global constants
const (
    EventTypeMessage    = "message" 
    EventTypeReply      = "reply"
    EventTypeSticker    = "sticker"
    EventTypeReaction   = "reaction"
    EventTypeMessageReactionUpdate = "message_reaction_update"
    EventTypeUserJoined = "user_joined"
    EventTypeUserLeft   = "user_left"
    EventTypeTyping     = "typing"
    EventTypeNotice     = "notice"
    EventTypeMention    = "mention"
    EventTypeMentionNotice = "mention_notice"
    EventTypeEvoucher   = "evoucher"
    EventTypeModerationBan   = "moderation_ban"
    EventTypeModerationMute  = "moderation_mute"
    EventTypeModerationKick  = "moderation_kick"
    EventTypeModerationUnban = "moderation_unban"
    EventTypeModerationUnmute = "moderation_unmute"
)

// Message Types - Content
const (
    MessageTypeText    = "text"
    MessageTypeReply   = "reply"  
    MessageTypeSticker = "sticker"
    MessageTypeMention = "mention"
    MessageTypeEvoucher = "evoucher"
    MessageTypeModerationBan   = "moderation_ban"
    MessageTypeModerationMute  = "moderation_mute"
    MessageTypeModerationKick  = "moderation_kick"
    MessageTypeModerationUnban = "moderation_unban"
    MessageTypeModerationUnmute = "moderation_unmute"
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
		Type      string    `json:"type"` // text, reply, sticker, reaction, mention
		Message   string    `json:"message,omitempty"`
		Reaction  string    `json:"reaction,omitempty"` // for reaction events
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
		Position int    `json:"position"` // Position in message where mention starts
		Length   int    `json:"length"`   // Length of the mention text
	}

	ChatMessagePayload struct {
		BasePayload
		Message MessageInfo   `json:"message"`
		ReplyTo *MessageInfo  `json:"replyTo,omitempty"`
		Mentions []MentionInfo `json:"mentions,omitempty"`
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

	ChatMentionPayload struct {
		BasePayload
		Message     MessageInfo   `json:"message"`
		Mentions    []MentionInfo `json:"mentions"`
		MentionedBy UserInfo      `json:"mentionedBy"`
	}

	ChatMentionNoticePayload struct {
		Room        RoomInfo    `json:"room"`
		Message     MessageInfo `json:"message"`
		MentionedBy UserInfo    `json:"mentionedBy"`
		MentionedUser UserInfo  `json:"mentionedUser"`
		Timestamp   time.Time   `json:"timestamp"`
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

	// **NEW: Moderation Payloads**
	ChatModerationPayload struct {
		BasePayload
		Action        string    `json:"action"`        // "ban", "mute", "kick", "unban", "unmute"
		TargetUser    UserInfo  `json:"targetUser"`    // User ที่ถูกลงโทษ
		Moderator     UserInfo  `json:"moderator"`     // Admin ที่ทำการลงโทษ
		Reason        string    `json:"reason"`        // เหตุผล
		Duration      string    `json:"duration"`      // "temporary" หรือ "permanent"
		EndTime       *time.Time `json:"endTime,omitempty"` // เวลาสิ้นสุด (ถ้าเป็น temporary)
		Restriction   string    `json:"restriction,omitempty"` // สำหรับ mute: "can_view" หรือ "cannot_view"
		Message       MessageInfo `json:"message"`     // Message ที่เก็บใน database
	}
)