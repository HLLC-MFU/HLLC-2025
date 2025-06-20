package model

type ChatMessageEnriched struct {
	ChatMessage ChatMessage       `json:"chat"`
	Reactions   []MessageReaction `json:"reactions"`
	ReplyTo     *ChatMessage      `json:"replyTo,omitempty"`
	Username    string            `json:"username,omitempty"`
}
