package controller

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/handler"
	authService "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
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
		handler 	handler.AuthHttpHandler
		baseController decorator.BaseController
		logger        *logging.Logger
	}
)

func NewAuthController(
	cfg *config.Config, 
	authService authService.AuthService, 
	authHandler handler.AuthHttpHandler,
) AuthController {
	return &authController{
		cfg:         cfg,
		handler:     authHandler,
		baseController: decorator.BaseController{},
		logger: logging.DefaultLogger,
	}
}

// RegisterPublicRoutes registers public routes that don't require authentication
func (c *authController) RegisterPublicRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	// Log registration start
	c.logger.Info("Registering public routes for auth module",
		logging.FieldModule, "auth",
		logging.FieldOperation, "register_routes",
	)

	// Apply common decorators
	commonDecorators := []decorator.ControllerDecorator{
		decorator.WithRecovery(),
		decorator.WithLogging,
	}

	// Public auth-related endpoints
	c.baseController.RegisterRoute("POST", "/login", c.Login, commonDecorators...)
	c.baseController.RegisterRoute("POST", "/refresh", c.RefreshToken, commonDecorators...)

	c.logger.Info("Successfully registered public routes for auth module",
		logging.FieldModule, "auth",
		logging.FieldOperation, "register_routes",
	)
}

// RegisterProtectedRoutes registers routes that require authentication
func (c *authController) RegisterProtectedRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	// Log registration start
	c.logger.Info("Registering protected routes for auth module",
		logging.FieldModule, "auth",
		logging.FieldOperation, "register_routes",
	)

	// Apply common decorators
	commonDecorators := []decorator.ControllerDecorator{
		decorator.WithRecovery(),
		decorator.WithLogging,
	}

	// Protected auth-related endpoints
	c.baseController.RegisterRoute("POST", "/logout", c.Logout, commonDecorators...)
	c.baseController.RegisterRoute("GET", "/validate", c.ValidateToken, commonDecorators...)
	c.baseController.RegisterRoute("GET", "/me", c.GetProfile, commonDecorators...)

	// Log registration end-point
	c.logger.Info("Successfully registered protected routes for auth module",
		logging.FieldModule, "auth",
		logging.FieldOperation, "register_routes",
	)
}

// RegisterAdminRoutes registers routes that require admin role
func (c *authController) RegisterAdminRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	// Log registration start
	c.logger.Info("Registering admin routes for auth module",
		logging.FieldModule, "auth",
		logging.FieldOperation, "register_routes",
	)

	// Apply common decorators
	commonDecorators := []decorator.ControllerDecorator{
		decorator.WithRecovery(),
		decorator.WithLogging,
	}

	c.baseController.RegisterRoute("POST", "/revoke/:userId", c.RevokeUserSessions, commonDecorators...)

	c.logger.Info("Successfully registered admin routes for auth module",
		logging.FieldModule, "auth",
		logging.FieldOperation, "register_routes",
	)
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