package routes

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/role/handler"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoleRoutes(router fiber.Router, h handler.RoleHTTPHandler) {
	roleGroup := router.Group("/roles")
	roleGroup.Post("/", h.CreateRole)
	roleGroup.Get("/", h.GetAllRoles)
	roleGroup.Get("/:id", h.GetRole)
	roleGroup.Put("/:id", h.UpdateRole)
	roleGroup.Delete("/:id", h.DeleteRole)
}
