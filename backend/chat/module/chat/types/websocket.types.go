package types

import "chat/module/chat/model"

type BroadcastMessage struct {
	RoomID  string
	UserID  string
	Message *model.ChatMessage
} 