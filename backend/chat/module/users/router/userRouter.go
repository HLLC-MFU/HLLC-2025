package router

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/handler"
	"github.com/gofiber/fiber/v2"
)

func RegisterUserRoutes(router fiber.Router, h *handler.UserHTTPHandler) {
	router.Get("/:id", h.GetUser)
	router.Get("/", h.ListUsers)
}
