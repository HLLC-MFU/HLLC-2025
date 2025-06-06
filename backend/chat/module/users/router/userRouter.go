package router

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/handler"
	"github.com/gofiber/fiber/v2"
)

func RegisterUserRoutes(router fiber.Router, h *handler.UserHTTPHandler) {
	router.Post("/", h.CreateUser)
	router.Get("/:id", h.GetUser)
	router.Get("/", h.ListUsers)
	router.Patch("/:id", h.UpdateUser)
	router.Delete("/:id", h.DeleteUser)
}
