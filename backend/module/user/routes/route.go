package routes

import (
	"fmt"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/gofiber/fiber/v2"
)

// UserController is responsible for registering routes for the user module
type (
	UserRoutes interface {
		RegisterPublicRoutes(router fiber.Router)
		RegisterProtectedRoutes(router fiber.Router)
		RegisterAdminRoutes(router fiber.Router)
	}

	userRoutes struct {
		cfg *config.Config
		httpHandler handler.HTTPHandler
		baseController decorator.BaseController
		logger *logging.Logger
	}
)

// NewUserController creates a new user controller
func NewUserController(
	cfg *config.Config, 
	httpHandler handler.HTTPHandler,
) UserRoutes {
	
	return &userRoutes{
		cfg: cfg,
		httpHandler: httpHandler,
		baseController: decorator.BaseController{},
		logger: logging.DefaultLogger,
	}
}

// RegisterPublicRoutes registers routes that don't require authentication
func (c *userRoutes) RegisterPublicRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	c.logger.Info("Registering public routes for user module",
		logging.FieldModule, "user",
		logging.FieldOperation, "register_routes",
	)
	
	// Apply common decorators
	commonDecorators := []decorator.RouteDecorator{
		decorator.WithLogging,
	}

	routes := map[string]struct {
		Handler fiber.Handler
		Permission string
	}{
		"POST /validate-credentials": {c.httpHandler.ValidateCredentials, "USER_MODULE_PUBLIC_ACCESS"},
		"POST /check-username": {c.httpHandler.CheckUsername, "USER_MODULE_PUBLIC_ACCESS"},
		"POST /set-password": {c.httpHandler.SetPassword, "USER_MODULE_PUBLIC_ACCESS"},
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
	
	c.logger.Info("Successfully registered public routes for user module",
		logging.FieldModule, "user",
		logging.FieldOperation, "register_routes",
	)
}

// RegisterProtectedRoutes registers routes that require authentication
func (c *userRoutes) RegisterProtectedRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	c.logger.Info("Registering protected routes for user module",
		logging.FieldModule, "user",
		logging.FieldOperation, "register_routes",
	)
	
	// Apply common decorators
	commonDecorators := []decorator.RouteDecorator{
		decorator.WithLogging,
	}

	routes := map[string]struct {
		Handler fiber.Handler
		Permission string
	}{
		"GET /profile": {c.httpHandler.GetUser, "USER_MODULE_PUBLIC_ACCESS"},
		"PUT /profile": {c.httpHandler.UpdateUser, "USER_MODULE_PUBLIC_ACCESS"},
	}
	
	for route, config := range routes {
		// Split "METHOD PATH" -> method, path
		var method, path string
		fmt.Sscanf(route, "%s %s", &method, &path)
		
		// Attach permission that allows any authenticated user access
		decorators := append([]decorator.RouteDecorator{
			decorator.AdaptMiddlewareToController(decorator.WithPermission(config.Permission)),
		}, commonDecorators...)

		// Register the route
		c.baseController.RegisterRoute(method, path, config.Handler, decorators...)
	}
	
	c.logger.Info("Successfully registered protected routes for user module",
		logging.FieldModule, "user",
		logging.FieldOperation, "register_routes",
	)
}

// RegisterAdminRoutes registers routes that require admin role
func (c *userRoutes) RegisterAdminRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	c.logger.Info("Registering admin routes for user module",
		logging.FieldModule, "user",
		logging.FieldOperation, "register_routes",
	)
	
	// Apply common decorators
	commonDecorators := []decorator.RouteDecorator{
		decorator.WithLogging,
		decorator.AdaptMiddlewareToController(decorator.WithPermission("USER_MODULE_ADMIN_ACCESS")),
	}

	routes := map[string]struct {
		Handler fiber.Handler
		Permission string
	} {
		// User management
		"POST /users": {c.httpHandler.CreateUser, "USER_MODULE_ADMIN_ACCESS"},
		"GET /users": {c.httpHandler.GetAllUsers, "USER_MODULE_ADMIN_ACCESS"},
		"GET /users/:id": {c.httpHandler.GetUser, "USER_MODULE_ADMIN_ACCESS"},
		"PUT /users/:id": {c.httpHandler.UpdateUser, "USER_MODULE_ADMIN_ACCESS"},
		"DELETE /users/:id": {c.httpHandler.DeleteUser, "USER_MODULE_ADMIN_ACCESS"},
		"POST /users/activate": {c.httpHandler.ActivateUser, "USER_MODULE_ADMIN_ACCESS"},

		// Role management
		"POST /roles": {c.httpHandler.CreateRole, "USER_MODULE_ADMIN_ACCESS"},
		"GET /roles/:id": {c.httpHandler.GetRole, "USER_MODULE_ADMIN_ACCESS"},
		"PUT /roles/:id": {c.httpHandler.UpdateRole, "USER_MODULE_ADMIN_ACCESS"},
		"DELETE /roles/:id": {c.httpHandler.DeleteRole, "USER_MODULE_ADMIN_ACCESS"},

		// Permission management
		"POST /permissions": {c.httpHandler.CreatePermission, "USER_MODULE_ADMIN_ACCESS"},
		"GET /permissions/:id": {c.httpHandler.GetPermission, "USER_MODULE_ADMIN_ACCESS"},
		"PUT /permissions/:id": {c.httpHandler.UpdatePermission, "USER_MODULE_ADMIN_ACCESS"},
		"DELETE /permissions/:id": {c.httpHandler.DeletePermission, "USER_MODULE_ADMIN_ACCESS"},

		// Module-based permission management
		"GET /permissions/module/:module": {c.httpHandler.GetPermissionsByModule, "USER_MODULE_ADMIN_ACCESS"},
		"GET /permissions/module/:module/action/:action": {c.httpHandler.GetPermissionsByModuleAndAction, "USER_MODULE_ADMIN_ACCESS"},
		"GET /permissions/access-level/:access_level": {c.httpHandler.GetPermissionsByAccessLevel, "USER_MODULE_ADMIN_ACCESS"},
		"POST /permissions/template": {c.httpHandler.CreatePermissionFromTemplate, "USER_MODULE_ADMIN_ACCESS"},
		"POST /permissions/module-template": {c.httpHandler.CreateModulePermissions, "USER_MODULE_ADMIN_ACCESS"},
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

	c.logger.Info("Successfully registered admin routes for user module",
		logging.FieldModule, "user",
		logging.FieldOperation, "register_routes",
		"endpoint_count", 17,
	)
}