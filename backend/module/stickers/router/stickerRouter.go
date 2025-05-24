package router

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/handler"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(router fiber.Router, h *handler.StickerHTTPHandler) {
	router.Post("/", h.CreateSticker)
	router.Get("/:id", h.GetSticker)
	router.Get("/", h.ListStickers)
	router.Patch("/:id", h.UpdateSticker)
	router.Delete("/:id", h.DeleteSticker)
}
