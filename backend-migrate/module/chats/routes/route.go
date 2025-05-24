package routes

import (
	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/chats/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/chats/kafka"
	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/chats/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

// SetupChatRoutes sets up all chat-related routes
func SetupChatRoutes(app *fiber.App, db *mongo.Database, publisher kafka.Publisher) {
	// Initialize services
	chatService := service.NewService(db)
	chatHandler := handler.NewHandler(chatService, publisher)

	// API routes
	api := app.Group("/api")
	v1 := api.Group("/v1")

	// Chat routes
	chats := v1.Group("/chats")
	chatHandler.RegisterRoutes(chats)

	// WebSocket endpoint
	app.Get("/ws/chat", websocket.New(chatHandler.HandleWebSocket))
}

