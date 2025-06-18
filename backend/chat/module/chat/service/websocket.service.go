package service

import (
	"chat/module/chat/types"
	commonws "chat/pkg/common/websocket"

	"github.com/gofiber/websocket/v2"
)

type WebSocketService struct {
	hub *commonws.Hub[types.BroadcastMessage]
}

func NewWebSocketService() *WebSocketService {
	hub := commonws.NewHub[types.BroadcastMessage]()
	go hub.Run()
	return &WebSocketService{hub: hub}
}

func (s *WebSocketService) RegisterClient(roomID, userID string, conn *websocket.Conn) {
	s.hub.Register(&commonws.Client{
		ID:     userID,
		RoomID: roomID,
		Conn:   conn,
	})
}

func (s *WebSocketService) UnregisterClient(roomID, userID string, conn *websocket.Conn) {
	s.hub.Unregister(&commonws.Client{
		ID:     userID,
		RoomID: roomID,
		Conn:   conn,
	})
}

func (s *WebSocketService) Broadcast(msg *types.BroadcastMessage) {
	s.hub.Broadcast(&commonws.Message[types.BroadcastMessage]{
		Type:    "message",
		RoomID:  msg.RoomID,
		From:    msg.UserID,
		Payload: *msg,
	})
}

func (s *WebSocketService) GetOfflineUsers(roomID string) []string {
	clients := s.hub.GetRoomClients(roomID)
	var offlineUsers []string
	for _, client := range clients {
		if client.Conn == nil {
			offlineUsers = append(offlineUsers, client.ID)
		}
	}
	return offlineUsers
} 