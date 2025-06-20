package controller

import (
	"chat/module/chat/service"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

type ChatController struct {
	chatService *service.ChatService
}

func NewChatController(app *fiber.App, chatService *service.ChatService) {
	controller := &ChatController{
		chatService: chatService,
	}

	// WebSocket endpoint for chat
	app.Get("/ws/:roomId/:userId", websocket.New(controller.handleWebSocket))
}

func (c *ChatController) handleWebSocket(conn *websocket.Conn) {
	// Get room and user IDs from params
	roomID := conn.Params("roomId")
	userID := conn.Params("userId")

	// Handle WebSocket connection
	c.chatService.HandleWebSocket(conn, userID, roomID)
}