package router

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/handler"
	"github.com/gofiber/fiber/v2"
)

func RegisterMajorRoutes(router fiber.Router, h *handler.MajorHTTPHandler) {
	router.Get("/:id", h.GetMajor)
	router.Get("/", h.ListMajor)
}
