package routes

import (
	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/stickers/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/stickers/service"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

// SetupStickerRoutes sets up all sticker-related routes
func SetupStickerRoutes(app *fiber.App, db *mongo.Database) {
	// Initialize sticker service and handler
	stickerService := service.NewStickerService(db)
	stickerHandler := handler.NewStickerHandler(stickerService)

	// API routes
	api := app.Group("/api")
	v1 := api.Group("/v1")

	// Sticker routes
	stickers := v1.Group("/stickers")
	stickers.Get("/", stickerHandler.ListStickers)
	stickers.Post("/", stickerHandler.CreateSticker)
	stickers.Get("/:id", stickerHandler.GetSticker)
	stickers.Delete("/:id", stickerHandler.DeleteSticker)
	stickers.Post("/:roomId/send", stickerHandler.SendSticker)
}
