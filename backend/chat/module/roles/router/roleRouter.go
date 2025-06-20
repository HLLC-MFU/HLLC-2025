package router

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/roles/handler"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoleRoutes(router fiber.Router, h *handler.RoleHTTPHandler) {
	router.Get("/", h.ListRoles)
	router.Get("/:id", h.GetRole)
}
