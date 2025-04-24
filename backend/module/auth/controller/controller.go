package controller

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/service"
	"github.com/gofiber/fiber/v2"
)

type (
	AuthController interface {
		RegisterPublicRoutes(router fiber.Router)
		RegisterProtectedRoutes(router fiber.Router)
		RegisterAdminRoutes(router fiber.Router)
		Login(c *fiber.Ctx) error
		GetProfile(c *fiber.Ctx) error
		RefreshToken(c *fiber.Ctx) error
		Logout(c *fiber.Ctx) error
		ValidateToken(c *fiber.Ctx) error
		RevokeUserSessions(c *fiber.Ctx) error
	}

	authController struct {
		cfg         *config.Config
		authService service.AuthService
		handler 	handler.AuthHttpHandler
	}
)

func NewAuthController(cfg *config.Config, authService service.AuthService, authHandler handler.AuthHttpHandler) AuthController {
	return &authController{
		cfg:         cfg,
		authService: authService,
		handler:     authHandler,
	}
}

// RegisterPublicRoutes registers public routes that don't require authentication
func (c *authController) RegisterPublicRoutes(router fiber.Router) {
	router.Post("/auth/login", c.Login)
	router.Post("/auth/refresh", c.RefreshToken)
}

// RegisterProtectedRoutes registers routes that require authentication
func (c *authController) RegisterProtectedRoutes(router fiber.Router) {
	router.Post("/auth/logout", c.Logout)
	router.Get("/auth/validate", c.ValidateToken)
	router.Get("/auth/me", c.GetProfile)
}

// RegisterAdminRoutes registers routes that require admin role
func (c *authController) RegisterAdminRoutes(router fiber.Router) {
	router.Post("/auth/revoke/:userId", c.RevokeUserSessions)
}

func (c *authController) Login(ctx *fiber.Ctx) error {
	return c.handler.Login(ctx)
}

func (c *authController) RefreshToken(ctx *fiber.Ctx) error {
	return c.handler.RefreshToken(ctx)
}

func (c *authController) Logout(ctx *fiber.Ctx) error {
	return c.handler.Logout(ctx)
}

func (c *authController) ValidateToken(ctx *fiber.Ctx) error {
	return c.handler.ValidateToken(ctx)
}

func (c *authController) RevokeUserSessions(ctx *fiber.Ctx) error {
	return c.handler.RevokeUserSessions(ctx)
}

func (c *authController) GetProfile(ctx *fiber.Ctx) error {
	return c.handler.ValidateToken(ctx)
}