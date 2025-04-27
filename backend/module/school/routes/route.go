package routes

import (
	"fmt"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/gofiber/fiber/v2"
)

// SchoolController is responsible for registering routes for the school module
type (
	SchoolRoutes interface {
		RegisterPublicRoutes(router fiber.Router)
		RegisterProtectedRoutes(router fiber.Router)
		RegisterAdminRoutes(router fiber.Router)
	}

	schoolRoutes struct {
		cfg          *config.Config
		httpHandler  handler.HTTPHandler
		baseController decorator.BaseController
		logger       *logging.Logger
	}
)

// NewSchoolController creates a new school controller
func NewSchoolController(
	cfg *config.Config,
	httpHandler handler.HTTPHandler,
) SchoolRoutes {
	return &schoolRoutes{
		cfg:          cfg,
		httpHandler:  httpHandler,
		baseController: decorator.BaseController{},
		logger:       logging.DefaultLogger,
	}
}

// RegisterPublicRoutes registers routes that don't require authentication
func (c *schoolRoutes) RegisterPublicRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	c.logger.Info("Registering public routes for school module",
		logging.FieldModule, "school",
		logging.FieldOperation, "register_routes",
	)
	
	// Apply common decorators
	commonDecorators := []decorator.RouteDecorator{
		decorator.WithLogging,
		decorator.AdaptMiddlewareToController(decorator.WithPermission("SCHOOL_MODULE_USER_ACCESS")),
	}

	// Note: since the base path is already '/public/schools', we don't add '/schools' here
	routes := map[string]struct {
		Handler fiber.Handler
		Permission string
	} {
		"GET /": {c.httpHandler.ListSchools, "SCHOOL_MODULE_PUBLIC_ACCESS"},
		"GET /:id": {c.httpHandler.GetSchool, "SCHOOL_MODULE_PUBLIC_ACCESS"},
	}

	for route, config := range routes {
		// Split "METHOD PATH" -> method, path
		var method, path string
		fmt.Sscanf(route, "%s %s", &method, &path)

		// Attach permission
		decorators := append([]decorator.RouteDecorator{
			decorator.AdaptMiddlewareToController(decorator.WithPermission(config.Permission)),
		}, commonDecorators...)

		// Register the route
		c.baseController.RegisterRoute(method, path, config.Handler, decorators...)
	}
	
	c.logger.Info("Successfully registered public routes for school module",
		logging.FieldModule, "school",
		logging.FieldOperation, "register_routes",
		"endpoint_count", len(routes),
	)
}

// RegisterProtectedRoutes registers routes that require authentication
func (c *schoolRoutes) RegisterProtectedRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	c.logger.Info("Registering protected routes for school module",
		logging.FieldModule, "school",
		logging.FieldOperation, "register_routes",
	)
	
	// Apply common decorators with permission middleware
	permissionDecorators := []decorator.RouteDecorator{
		decorator.WithLogging,
	}

	// Note: since the base path is already '/schools', we don't add '/schools' here
	routes := map[string]struct {
		Handler fiber.Handler
		Permission string
	} {
		"GET /": {c.httpHandler.ListSchools, "SCHOOL_MODULE_PUBLIC_ACCESS"},
		"GET /:id": {c.httpHandler.GetSchool, "SCHOOL_MODULE_PUBLIC_ACCESS"},
	}
	
	for route, config := range routes {
		// Split "METHOD PATH" -> method, path
		var method, path string
		fmt.Sscanf(route, "%s %s", &method, &path)

		// Attach permission that allows any authenticated user access
		decorators := append([]decorator.RouteDecorator{
			decorator.AdaptMiddlewareToController(decorator.WithPermission(config.Permission)),
		}, permissionDecorators...)

		// Register the route
		c.baseController.RegisterRoute(method, path, config.Handler, decorators...)
	}
	
	c.logger.Info("Successfully registered protected routes for school module",
		logging.FieldModule, "school",
		logging.FieldOperation, "register_routes",
		"endpoint_count", len(routes),
	)
}

// RegisterAdminRoutes registers routes that require admin role
func (c *schoolRoutes) RegisterAdminRoutes(router fiber.Router) {
	c.baseController.Router = router

	c.logger.Info("Registering admin routes for school module",
		logging.FieldModule, "school",
		logging.FieldOperation, "register_routes",
	)

	commonDecorators := []decorator.RouteDecorator{
		decorator.WithLogging,
		decorator.AdaptMiddlewareToController(decorator.WithPermission("SCHOOL_MODULE_ADMIN_ACCESS")),
	}

	// Map route config: key = "METHOD PATH", value = (handler, permission)
	// Note: since the base path is already '/admin/schools', we don't add '/schools' here
	routes := map[string]struct {
		Handler    fiber.Handler
		Permission string
	}{
		"POST /":      {c.httpHandler.CreateSchool, "SCHOOL_MODULE_ADMIN_ACCESS"},
		"GET /":       {c.httpHandler.ListSchools,  "SCHOOL_MODULE_ADMIN_ACCESS"},
		"GET /:id":    {c.httpHandler.GetSchool,    "SCHOOL_MODULE_ADMIN_ACCESS"},
		"PUT /:id":    {c.httpHandler.UpdateSchool, "SCHOOL_MODULE_ADMIN_ACCESS"},
		"DELETE /:id": {c.httpHandler.DeleteSchool, "SCHOOL_MODULE_ADMIN_ACCESS"},
	}

	for route, config := range routes {
		// Split "METHOD PATH" -> method, path
		var method, path string
		fmt.Sscanf(route, "%s %s", &method, &path)

		// Attach permission
		decorators := append([]decorator.RouteDecorator{
			decorator.AdaptMiddlewareToController(decorator.WithPermission(config.Permission)),
		}, commonDecorators...)

		// Register the route
		c.baseController.RegisterRoute(method, path, config.Handler, decorators...)
	}

	c.logger.Info("Successfully registered admin routes for school module",
		logging.FieldModule, "school",
		logging.FieldOperation, "register_routes",
		"endpoint_count", len(routes),
	)
}

