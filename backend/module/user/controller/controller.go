package controller

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/gofiber/fiber/v2"
)

// UserController is responsible for registering routes for the user module
type (
	UserController interface {
		RegisterPublicRoutes(router fiber.Router)
		RegisterProtectedRoutes(router fiber.Router)
		RegisterAdminRoutes(router fiber.Router)
	}

	userController struct {
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
) UserController {
	
	return &userController{
		cfg: cfg,
		httpHandler: httpHandler,
		baseController: decorator.BaseController{},
		logger: logging.DefaultLogger,
	}
}

// RegisterPublicRoutes registers routes that don't require authentication
func (c *userController) RegisterPublicRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	c.logger.Info("Registering public routes for user module",
		logging.FieldModule, "user",
		logging.FieldOperation, "register_routes",
	)
	
	// Apply common decorators
	commonDecorators := []decorator.ControllerDecorator{
		decorator.WithRecovery(),
		decorator.WithLogging,
	}
	
	// Public user-related endpoints
	c.baseController.RegisterRoute("POST", "/validate-credentials", c.httpHandler.ValidateCredentials, commonDecorators...)
	c.baseController.RegisterRoute("POST", "/check-username", c.httpHandler.CheckUsername, commonDecorators...)
	c.baseController.RegisterRoute("POST", "/set-password", c.httpHandler.SetPassword, commonDecorators...)
	
	c.logger.Info("Successfully registered public routes for user module",
		logging.FieldModule, "user",
		logging.FieldOperation, "register_routes",
	)
}

// RegisterProtectedRoutes registers routes that require authentication
func (c *userController) RegisterProtectedRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	c.logger.Info("Registering protected routes for user module",
		logging.FieldModule, "user",
		logging.FieldOperation, "register_routes",
	)
	
	// Apply common decorators
	commonDecorators := []decorator.ControllerDecorator{
		decorator.WithRecovery(),
		decorator.WithLogging,
	}
	
	// User profile management
	c.baseController.RegisterRoute("GET", "/profile", c.httpHandler.GetUser, commonDecorators...)
	c.baseController.RegisterRoute("PUT", "/profile", c.httpHandler.UpdateUser, commonDecorators...)
	
	// Basic role and permission viewing
	c.baseController.RegisterRoute("GET", "/roles", c.httpHandler.GetAllRoles, commonDecorators...)
	c.baseController.RegisterRoute("GET", "/permissions", c.httpHandler.GetAllPermissions, commonDecorators...)
	
	c.logger.Info("Successfully registered protected routes for user module",
		logging.FieldModule, "user",
		logging.FieldOperation, "register_routes",
	)
}

// RegisterAdminRoutes registers routes that require admin role
func (c *userController) RegisterAdminRoutes(router fiber.Router) {
	c.baseController.Router = router
	
	c.logger.Info("Registering admin routes for user module",
		logging.FieldModule, "user",
		logging.FieldOperation, "register_routes",
	)
	
	// Apply common decorators
	commonDecorators := []decorator.ControllerDecorator{
		decorator.WithRecovery(),
		decorator.WithLogging,
	}
	
	// User management
	c.baseController.RegisterRoute("POST", "/users", c.httpHandler.CreateUser, commonDecorators...)
	c.baseController.RegisterRoute("GET", "/users", c.httpHandler.GetAllUsers, commonDecorators...)
	c.baseController.RegisterRoute("GET", "/users/:id", c.httpHandler.GetUser, commonDecorators...)
	c.baseController.RegisterRoute("PUT", "/users/:id", c.httpHandler.UpdateUser, commonDecorators...)
	c.baseController.RegisterRoute("DELETE", "/users/:id", c.httpHandler.DeleteUser, commonDecorators...)
	c.baseController.RegisterRoute("POST", "/users/activate", c.httpHandler.ActivateUser, commonDecorators...)

	// Role management
	c.baseController.RegisterRoute("POST", "/roles", c.httpHandler.CreateRole, commonDecorators...)
	c.baseController.RegisterRoute("GET", "/roles/:id", c.httpHandler.GetRole, commonDecorators...)
	c.baseController.RegisterRoute("PUT", "/roles/:id", c.httpHandler.UpdateRole, commonDecorators...)
	c.baseController.RegisterRoute("DELETE", "/roles/:id", c.httpHandler.DeleteRole, commonDecorators...)

	// Permission management
	c.baseController.RegisterRoute("POST", "/permissions", c.httpHandler.CreatePermission, commonDecorators...)
	c.baseController.RegisterRoute("GET", "/permissions/:id", c.httpHandler.GetPermission, commonDecorators...)
	c.baseController.RegisterRoute("PUT", "/permissions/:id", c.httpHandler.UpdatePermission, commonDecorators...)
	c.baseController.RegisterRoute("DELETE", "/permissions/:id", c.httpHandler.DeletePermission, commonDecorators...)
	
	c.logger.Info("Successfully registered admin routes for user module",
		logging.FieldModule, "user",
		logging.FieldOperation, "register_routes",
		"endpoint_count", 13,
	)
}

// gRPC implementation is commented out to focus on HTTP implementation
/*
// GrpcController interface for gRPC service
type GrpcController interface {
	userPb.UserServiceServer
}

// grpcController implements GrpcController
type grpcController struct {
	cfg *config.Config
	userService serviceHttp.UserService
	roleService serviceHttp.RoleService
	permService serviceHttp.PermissionService
	userPb.UnimplementedUserServiceServer
}

// NewGrpcController creates a new gRPC controller
func NewGrpcController(
	cfg *config.Config, 
	userService serviceHttp.UserService,
	roleService serviceHttp.RoleService,
	permService serviceHttp.PermissionService,
) GrpcController {
	return &grpcController{
		cfg:          cfg,
		userService:  userService,
		roleService:  roleService,
		permService:  permService,
	}
}

// gRPC handler implementations
func (c *grpcController) CreateUser(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error) {
	return c.userService.CreateUserGRPC(ctx, req)
}

func (c *grpcController) GetUser(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error) {
	return c.userService.GetUserGRPC(ctx, req)
}

func (c *grpcController) GetAllUsers(ctx context.Context, req *userPb.GetAllUsersRequest) (*userPb.GetAllUsersResponse, error) {
	return c.userService.GetAllUsersGRPC(ctx, req)
}

func (c *grpcController) UpdateUser(ctx context.Context, req *userPb.UpdateUserRequest) (*userPb.User, error) {
	return c.userService.UpdateUserGRPC(ctx, req)
}

func (c *grpcController) DeleteUser(ctx context.Context, req *userPb.DeleteUserRequest) (*userPb.Empty, error) {
	return c.userService.DeleteUserGRPC(ctx, req)
}

func (c *grpcController) ValidateCredentials(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error) {
	return c.userService.ValidateCredentialsGRPC(ctx, req)
}

// Role methods
func (c *grpcController) CreateRole(ctx context.Context, req *userPb.CreateRoleRequest) (*userPb.Role, error) {
	return c.roleService.CreateRoleGRPC(ctx, req)
}

func (c *grpcController) GetRole(ctx context.Context, req *userPb.GetRoleRequest) (*userPb.Role, error) {
	return c.roleService.GetRoleGRPC(ctx, req)
}

func (c *grpcController) GetAllRoles(ctx context.Context, req *userPb.GetAllRolesRequest) (*userPb.GetAllRolesResponse, error) {
	return c.roleService.GetAllRolesGRPC(ctx, req)
}

func (c *grpcController) UpdateRole(ctx context.Context, req *userPb.UpdateRoleRequest) (*userPb.Role, error) {
	return c.roleService.UpdateRoleGRPC(ctx, req)
}

func (c *grpcController) DeleteRole(ctx context.Context, req *userPb.DeleteRoleRequest) (*userPb.Empty, error) {
	return c.roleService.DeleteRoleGRPC(ctx, req)
}

// Permission methods
func (c *grpcController) CreatePermission(ctx context.Context, req *userPb.CreatePermissionRequest) (*userPb.Permission, error) {
	return c.permService.CreatePermissionGRPC(ctx, req)
}

func (c *grpcController) GetPermission(ctx context.Context, req *userPb.GetPermissionRequest) (*userPb.Permission, error) {
	return c.permService.GetPermissionGRPC(ctx, req)
}

func (c *grpcController) GetAllPermissions(ctx context.Context, req *userPb.GetAllPermissionsRequest) (*userPb.GetAllPermissionsResponse, error) {
	return c.permService.GetAllPermissionsGRPC(ctx, req)
}

func (c *grpcController) UpdatePermission(ctx context.Context, req *userPb.UpdatePermissionRequest) (*userPb.Permission, error) {
	return c.permService.UpdatePermissionGRPC(ctx, req)
}

func (c *grpcController) DeletePermission(ctx context.Context, req *userPb.DeletePermissionRequest) (*userPb.Empty, error) {
	return c.permService.DeletePermissionGRPC(ctx, req)
}

// Registration methods
func (c *grpcController) CheckUsername(ctx context.Context, req *userPb.CheckUsernameRequest) (*userPb.CheckUsernameResponse, error) {
	return c.userService.CheckUsernameGRPC(ctx, req)
}

func (c *grpcController) SetPassword(ctx context.Context, req *userPb.SetPasswordRequest) (*userPb.SetPasswordResponse, error) {
	return c.userService.SetPasswordGRPC(ctx, req)
}

func (c *grpcController) mustEmbedUnimplementedUserServiceServer() {}
*/

