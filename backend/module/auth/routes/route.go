package routes

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/handler"
	"github.com/gofiber/fiber/v2"
)

// RegisterAuthRoutes จะเชื่อม Route กับ Handler
func RegisterAuthRoutes(router fiber.Router, h handler.AuthHTTPHandler) {
	authGroup := router.Group("/auth")

	authGroup.Post("/login", h.Login)
	authGroup.Post("/refresh-token", h.RefreshToken)
}
