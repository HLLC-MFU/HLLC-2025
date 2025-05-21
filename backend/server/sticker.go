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

	s.app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     "http://localhost:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE",
	}))

	// Set up HTTP routes
	api := s.app.Group("/api/v1")

	// Public routes (no auth required)
	public := api.Group("/public/schools")
	public.Get("/", httpHandler.ListStickers)
	public.Get("/:id", httpHandler.GetSticker)

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

	// Set up health check
	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	s.app.Static("/uploads", "./uploads")

	log.Printf("Sticker service initialized")
}
