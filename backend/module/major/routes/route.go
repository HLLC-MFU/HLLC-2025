package routes

import (
	"fmt"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/gofiber/fiber/v2"
)

// MajorController is responsible for registering routes for the major module
type (
	MajorRoutes interface {
		RegisterPublicRoutes(router fiber.Router)
		RegisterProtectedRoutes(router fiber.Router)
		RegisterAdminRoutes(router fiber.Router)
	}

	majorRoutes struct {
		cfg           *config.Config
		httpHandler   handler.HTTPHandler
		baseController decorator.BaseController
		logger        *logging.Logger
	}
)

// NewMajorController creates a new major controller
func NewMajorController(
	cfg *config.Config,
	httpHandler handler.HTTPHandler,
) MajorRoutes {
	return &majorRoutes{
		cfg:           cfg,
		httpHandler:   httpHandler,
		baseController: decorator.BaseController{},
		logger:        logging.DefaultLogger,
	}
}

// RegisterPublicRoutes registers routes that don't require authentication
func (c *majorRoutes) RegisterPublicRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	c.logger.Info("Registering public routes for major module",
		logging.FieldModule, "major",
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
		"GET /majors": {c.httpHandler.ListMajors, "MAJOR_MODULE_PUBLIC_ACCESS"},
		"GET /majors/:id": {c.httpHandler.GetMajor, "MAJOR_MODULE_PUBLIC_ACCESS"},
		"GET /majors/school/:schoolId": {c.httpHandler.ListMajorsBySchool, "MAJOR_MODULE_PUBLIC_ACCESS"},
	}

	for route, config := range routes {
		var method, path string
		fmt.Sscanf(route, "%s %s", &method, &path)

		decorators := append([]decorator.RouteDecorator{
			decorator.AdaptMiddlewareToController(decorator.WithPermission(config.Permission)),
		}, commonDecorators...)

		c.baseController.RegisterRoute(method, path, config.Handler, decorators...)
	}

	c.logger.Info("Successfully registered public routes for major module",
		logging.FieldModule, "major",
		logging.FieldOperation, "register_routes",
		"endpoint_count", len(routes),
	)
}

// RegisterProtectedRoutes registers routes that require authentication
func (c *majorRoutes) RegisterProtectedRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	c.logger.Info("Registering protected routes for major module",
		logging.FieldModule, "major",
		logging.FieldOperation, "register_routes",
	)
	
	// Apply common decorators with permission middleware
	permissionDecorators := []decorator.RouteDecorator{
		decorator.WithLogging,
	}
	
	// Major management for authenticated users with required permissions
	routes := map[string]struct {
		Handler fiber.Handler
		Permission string
	} {
		"GET /majors": {c.httpHandler.ListMajors, "MAJOR_MODULE_PUBLIC_ACCESS"},
		"GET /majors/:id": {c.httpHandler.GetMajor, "MAJOR_MODULE_PUBLIC_ACCESS"},
		"GET /majors/school/:schoolId": {c.httpHandler.ListMajorsBySchool, "MAJOR_MODULE_PUBLIC_ACCESS"},
	}

	for route, config := range routes {
		var method, path string
		fmt.Sscanf(route, "%s %s", &method, &path)

		decorators := append([]decorator.RouteDecorator{
			decorator.AdaptMiddlewareToController(decorator.WithPermission(config.Permission)),
		}, permissionDecorators...)

		c.baseController.RegisterRoute(method, path, config.Handler, decorators...)
	}
	
	c.logger.Info("Successfully registered protected routes for major module",
		logging.FieldModule, "major",
		logging.FieldOperation, "register_routes",
		"endpoint_count", len(routes),
	)
}

// RegisterAdminRoutes registers routes that require admin role
func (c *majorRoutes) RegisterAdminRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	c.logger.Info("Registering admin routes for major module",
		logging.FieldModule, "major",
		logging.FieldOperation, "register_routes",
	)
	
	// Common decorators
	commonDecorators := []decorator.RouteDecorator{
		decorator.WithLogging,
		decorator.AdaptMiddlewareToController(decorator.WithPermission("MAJOR_MODULE_ADMIN_ACCESS")),
	}
	
	// Create admin route decorators with specific permissions
	routes := map[string]struct {
		Handler fiber.Handler
		Permission string
	} {
		"POST /majors": {c.httpHandler.CreateMajor, "MAJOR_MODULE_ADMIN_ACCESS"},
		"GET /majors": {c.httpHandler.ListMajors, "MAJOR_MODULE_ADMIN_ACCESS"},
		"GET /majors/:id": {c.httpHandler.GetMajor, "MAJOR_MODULE_ADMIN_ACCESS"},
		"GET /majors/school/:schoolId": {c.httpHandler.ListMajorsBySchool, "MAJOR_MODULE_ADMIN_ACCESS"},
		"PUT /majors/:id": {c.httpHandler.UpdateMajor, "MAJOR_MODULE_ADMIN_ACCESS"},
		"DELETE /majors/:id": {c.httpHandler.DeleteMajor, "MAJOR_MODULE_ADMIN_ACCESS"},
	}

	for route, config := range routes {
		var method, path string
		fmt.Sscanf(route, "%s %s", &method, &path)

		decorators := append([]decorator.RouteDecorator{
			decorator.AdaptMiddlewareToController(decorator.WithPermission(config.Permission)),
		}, commonDecorators...)

		c.baseController.RegisterRoute(method, path, config.Handler, decorators...)
	}

	c.logger.Info("Successfully registered admin routes for major module",
		logging.FieldModule, "major",
		logging.FieldOperation, "register_routes",
		"endpoint_count", 6,
	)
}