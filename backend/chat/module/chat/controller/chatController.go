package controller

import (
	"chat/module/chat/hub"
	wsHandler "chat/module/chat/transport/websocket"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

type ChatController struct {
	hub              *hub.Hub
	connectionHandler *wsHandler.ConnectionHandler
}

func NewChatController(app *fiber.App, h *hub.Hub) {
	controller := &ChatController{
		hub:              h,
		connectionHandler: wsHandler.NewConnectionHandler(h),
	}

	// WebSocket endpoint for chat
	app.Get("/ws/:roomId/:userId", websocket.New(controller.handleWebSocket))
}

func (c *ChatController) handleWebSocket(conn *websocket.Conn) {
	// Get room and user IDs from params
	roomID := conn.Params("roomId")
	userID := conn.Params("userId")

	// Basic validation
	if roomID == "" || userID == "" {
		_ = conn.WriteJSON(map[string]string{"error": "Invalid room ID or user ID"})
		conn.Close()
		return
	}

	// Handle WebSocket connection
	c.connectionHandler.HandleConnection(conn, userID, roomID)
}