package routes

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user_role/handler"
	"github.com/gofiber/fiber/v2"
)

func RegisterUserRoleRoutes(router fiber.Router, h handler.HTTPHandler) {
	userRoleGroup := router.Group("/user-roles")
	userRoleGroup.Post("/", h.CreateUserRole)
	userRoleGroup.Get("/:userID", h.GetUserRole)
	userRoleGroup.Put("/:userID", h.UpdateUserRole)
	userRoleGroup.Delete("/:userID", h.DeleteUserRole)
}
