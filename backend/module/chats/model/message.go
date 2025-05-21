package model

type ChatMessageEnriched struct {
	ChatMessage  ChatMessage          `json:"chat"`
	Reactions    []MessageReaction    `json:"reactions"`
	ReadReceipts []MessageReadReceipt `json:"readReceipts"`
	ReplyTo      *ChatMessage         `json:"replyTo,omitempty"`
}
