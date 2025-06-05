package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *server) stickerService() {
	repo := repository.NewStickerRepository(s.db)
	stickerService := service.NewStickerService(repo)

	httpHandler := handler.NewHTTPHandler(stickerService)

	s.app.Use(cors.New(s.config.FiberCORSConfig()))

	// Set up HTTP routes
	api := s.api

	// Protected routes (auth required)
	protected := api.Group("/stickers")
	protected.Get("/", httpHandler.ListStickers)
	protected.Get("/:id", httpHandler.GetSticker)
	protected.Post("/", httpHandler.CreateSticker)
	protected.Patch("/:id", httpHandler.UpdateSticker)
	protected.Delete("/:id", httpHandler.DeleteSticker)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/stickers")
	admin.Post("/", httpHandler.CreateSticker)
	admin.Patch("/:id", httpHandler.UpdateSticker)
	admin.Delete("/:id", httpHandler.DeleteSticker)

	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Printf("Sticker service initialized")
}
