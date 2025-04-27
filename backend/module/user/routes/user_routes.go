package routes

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/handler"
	"github.com/gofiber/fiber/v2"
)

func RegisterUserRoutes(router fiber.Router, h handler.UserHTTPHandler) {
	userGroup := router.Group("/users")

	userGroup.Post("/", h.CreateUser)
	userGroup.Get("/", h.ListUsers)
	userGroup.Get("/id/:id", h.GetUserByID)
	userGroup.Get("/username/:username", h.GetUserByUsername)
	userGroup.Put("/:id", h.UpdateUser)
	userGroup.Delete("/:id", h.DeleteUser)
}
