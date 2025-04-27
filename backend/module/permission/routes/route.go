package routes

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/permission/handler"
	"github.com/gofiber/fiber/v2"
)

func RegisterPermissionRoutes(router fiber.Router, h handler.HTTPHandler) {
	permissionGroup := router.Group("/permissions")
	permissionGroup.Post("/", h.CreatePermission)
	permissionGroup.Get("/", h.GetAllPermissions)
	permissionGroup.Get("/:id", h.GetPermission)
	permissionGroup.Put("/:id", h.UpdatePermission)
	permissionGroup.Delete("/:id", h.DeletePermission)
}
