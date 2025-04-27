package routes

import (
	"fmt"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/gofiber/fiber/v2"
)

type (
	AuthRoutes interface {
		RegisterPublicRoutes(router fiber.Router)
		RegisterProtectedRoutes(router fiber.Router)
		RegisterAdminRoutes(router fiber.Router)
	}

	authRoutes struct {
		cfg         *config.Config
		httpHandler handler.AuthHttpHandler
		baseController decorator.BaseController
		logger        *logging.Logger
	}
)

func NewAuthController(
	cfg *config.Config, 
	httpHandler handler.AuthHttpHandler,
) AuthRoutes {
	return &authRoutes{
		cfg:         cfg,
		httpHandler:     httpHandler,
		baseController: decorator.BaseController{},
		logger: logging.DefaultLogger,
	}
}

// RegisterPublicRoutes registers public routes that don't require authentication
func (c *authRoutes) RegisterPublicRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	// Log registration start
	c.logger.Info("Registering public routes for auth module",
		logging.FieldModule, "auth",
		logging.FieldOperation, "register_routes",
	)

	// Apply common decorators - but NOT permission middleware for login route
	commonDecorators := []decorator.RouteDecorator{
		decorator.WithLogging,
	}

	// Map route config: key = "METHOD PATH", value = (handler, permission)
	routes := map[string]struct {
		Handler fiber.Handler
		NeedsPermission bool
	} {
		"POST /login": {c.httpHandler.Login, false},
		"POST /refresh": {c.httpHandler.RefreshToken, false},
	}

	for route, config := range routes {
		// Split "METHOD PATH" -> method, path
		var method, path string
		fmt.Sscanf(route, "%s %s", &method, &path)
		
		// For public routes like login, we don't need permission checks
		decorators := commonDecorators
		
		// Register the route with appropriate decorators
		c.baseController.RegisterRoute(method, path, config.Handler, decorators...)
	}

	c.logger.Info("Successfully registered public routes for auth module",
		logging.FieldModule, "auth",
		logging.FieldOperation, "register_routes",
		"endpoint_count", len(routes),
	)
}

// RegisterProtectedRoutes registers routes that require authentication
func (c *authRoutes) RegisterProtectedRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	// Log registration start
	c.logger.Info("Registering protected routes for auth module",
		logging.FieldModule, "auth",
		logging.FieldOperation, "register_routes",
	)

	// Apply common decorators
	commonDecorators := []decorator.RouteDecorator{
		decorator.WithLogging,
	}

	routes := map[string]struct {
		Handler fiber.Handler
		Permission string
	} {
		"POST /logout": {c.httpHandler.Logout, "AUTH_MODULE_PUBLIC_ACCESS"},
		"GET /validate": {c.httpHandler.ValidateToken, "AUTH_MODULE_PUBLIC_ACCESS"},
		"GET /me": {c.httpHandler.GetProfile, "AUTH_MODULE_PUBLIC_ACCESS"},		
	}

	for route, config := range routes {
		// Split "METHOD PATH" -> method, path
		var method, path string
		fmt.Sscanf(route, "%s %s", &method, &path)
		
		// Apply permission middleware but use PUBLIC_ACCESS instead of USER_ACCESS to allow any authenticated user
		decorators := append([]decorator.RouteDecorator{
			decorator.AdaptMiddlewareToController(decorator.WithPermission(config.Permission)),
		}, commonDecorators...)

		c.baseController.RegisterRoute(method, path, config.Handler, decorators...)
	}

	// Log registration end-point
	c.logger.Info("Successfully registered protected routes for auth module",
		logging.FieldModule, "auth",
		logging.FieldOperation, "register_routes",
		"endpoint_count", len(routes),
	)
}

// RegisterAdminRoutes registers routes that require admin role
func (c *authRoutes) RegisterAdminRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	// Log registration start
	c.logger.Info("Registering admin routes for auth module",
		logging.FieldModule, "auth",
		logging.FieldOperation, "register_routes",
	)

	// Apply common decorators
	commonDecorators := []decorator.RouteDecorator{
		decorator.WithLogging,
		decorator.AdaptMiddlewareToController(decorator.WithPermission("AUTH_MODULE_ADMIN_ACCESS")),
	}

	routes := map[string]struct {
		Handler fiber.Handler
		Permission string
	} {
		"POST /revoke/:userId": {c.httpHandler.RevokeUserSessions, "AUTH_MODULE_ADMIN_ACCESS"},
	}

	for route, config := range routes {
		var method, path string
		fmt.Sscanf(route, "%s %s", &method, &path)

		decorators := append([]decorator.RouteDecorator{
			decorator.AdaptMiddlewareToController(decorator.WithPermission(config.Permission)),
		}, commonDecorators...)

		c.baseController.RegisterRoute(method, path, config.Handler, decorators...)
	}


	c.logger.Info("Successfully registered admin routes for auth module",
		logging.FieldModule, "auth",
		logging.FieldOperation, "register_routes",
		"endpoint_count", len(routes),
	)
}
