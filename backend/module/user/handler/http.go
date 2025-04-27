package handler

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	serviceHttp "github.com/HLLC-MFU/HLLC-2025/backend/module/user/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/response"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/gofiber/fiber/v2"
)

// HTTPHandler defines the HTTP handler methods for user functionality
type HTTPHandler interface {
	// User management
	CreateUser(c *fiber.Ctx) error
	GetUser(c *fiber.Ctx) error
	GetAllUsers(c *fiber.Ctx) error
	UpdateUser(c *fiber.Ctx) error
	DeleteUser(c *fiber.Ctx) error
	ValidateCredentials(c *fiber.Ctx) error

	// Role management
	CreateRole(c *fiber.Ctx) error
	GetRole(c *fiber.Ctx) error
	GetAllRoles(c *fiber.Ctx) error
	UpdateRole(c *fiber.Ctx) error
	DeleteRole(c *fiber.Ctx) error

	// Permission management
	CreatePermission(c *fiber.Ctx) error
	GetPermission(c *fiber.Ctx) error
	GetAllPermissions(c *fiber.Ctx) error
	UpdatePermission(c *fiber.Ctx) error
	DeletePermission(c *fiber.Ctx) error
	GetPermissionsByModule(c *fiber.Ctx) error
	GetPermissionsByModuleAndAction(c *fiber.Ctx) error
	GetPermissionsByAccessLevel(c *fiber.Ctx) error
	CreatePermissionFromTemplate(c *fiber.Ctx) error
	CreateModulePermissions(c *fiber.Ctx) error

	// Registration methods
	CheckUsername(c *fiber.Ctx) error
	SetPassword(c *fiber.Ctx) error

	// New method
	ActivateUser(c *fiber.Ctx) error
}

// httpHandler implements HTTPHandler
type httpHandler struct {
	userService       serviceHttp.UserService
	roleService       serviceHttp.RoleService
	permService       serviceHttp.PermissionService
}

// NewHTTPHandler creates a new HTTP handler
func NewHTTPHandler(
	userService serviceHttp.UserService,
	roleService serviceHttp.RoleService,
	permissionService serviceHttp.PermissionService,
) HTTPHandler {
	return &httpHandler{
		userService:       userService,
		roleService:       roleService,
		permService:       permissionService,
	}
}

// User management handlers
func (h *httpHandler) CreateUser(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.CreateUserRequest](func(c *fiber.Ctx, req *dto.CreateUserRequest) error {
		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		user, err := h.userService.CreateUser(ctx, req)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusCreated, user)
	}))

	return handler(c)
}

func (h *httpHandler) GetUser(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
			// If no ID provided, get current user's profile if available
			userID, ok := c.Locals("user_id").(string)
			if !ok {
				return exceptions.HandleError(c, exceptions.InvalidInput("User ID parameter is required", nil))
			}
			id = userID
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		user, err := h.userService.GetUserByID(ctx, id)
	if err != nil {
			return exceptions.HandleError(c, err)
	}

		return response.Success(c, fiber.StatusOK, user)
	})

	return handler(c)
}

// GetAllUsers retrieves all users
func (h *httpHandler) GetAllUsers(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
	// Parse pagination parameters from query string
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.Query("limit", "10"))
	if err != nil || limit < 1 || limit > 100 {
		limit = 10 // Default and max limit
	}

		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		// Get all users
		users, err := h.userService.GetAllUsers(ctx)
	if err != nil {
			return exceptions.HandleError(c, err)
	}

		return response.Success(c, fiber.StatusOK, fiber.Map{
			"users": users,
		"pagination": fiber.Map{
			"page":  page,
			"limit": limit,
				"total": len(users),
		},
		})
	})

	return handler(c)
}

func (h *httpHandler) UpdateUser(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.UpdateUserRequest](func(c *fiber.Ctx, req *dto.UpdateUserRequest) error {
	id := c.Params("id")
	if id == "" {
			// If no ID provided, update current user's profile if available
			userID, ok := c.Locals("user_id").(string)
			if !ok {
				return exceptions.HandleError(c, exceptions.InvalidInput("User ID parameter is required", nil))
			}
			id = userID
		}

		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		user, err := h.userService.UpdateUser(ctx, id, req)
	if err != nil {
			return exceptions.HandleError(c, err)
	}

		return response.Success(c, fiber.StatusOK, user)
	}))

	return handler(c)
}

func (h *httpHandler) DeleteUser(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("User ID parameter is required", nil))
	}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		err := h.userService.DeleteUser(ctx, id)
	if err != nil {
			return exceptions.HandleError(c, err)
	}

		return response.Success(c, fiber.StatusOK, fiber.Map{
			"message": "User deleted successfully",
			"user_id": id,
		})
	})

	return handler(c)
}

func (h *httpHandler) ValidateCredentials(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.ValidateCredentialsRequest](func(c *fiber.Ctx, req *dto.ValidateCredentialsRequest) error {
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		valid, err := h.userService.ValidatePassword(ctx, req.Username, req.Password)
	if err != nil {
			return exceptions.HandleError(c, err)
	}

	if !valid {
			return exceptions.HandleError(c, exceptions.Unauthorized("Invalid credentials", nil))
	}

		return response.Success(c, fiber.StatusOK, fiber.Map{"valid": valid})
	}))

	return handler(c)
}

// Role management handlers
func (h *httpHandler) CreateRole(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.CreateRoleRequest](func(c *fiber.Ctx, req *dto.CreateRoleRequest) error {
		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		// Convert DTO to proto request
		pbReq := &userPb.CreateRoleRequest{
			Name:        req.Name,
			Code:        req.Code,
			Description: req.Description,
			PermissionIds: req.Permissions,
		}

		role, err := h.roleService.CreateRole(ctx, pbReq)
	if err != nil {
			return exceptions.HandleError(c, err)
		}

		// Convert proto response to DTO
		response := &dto.RoleResponse{
			ID:          role.GetId(),
			Name:        role.GetName(),
			Code:        role.GetCode(),
			Description: role.GetDescription(),
			Permissions: role.GetPermissionIds(),
		}

		return c.Status(fiber.StatusCreated).JSON(response)
	}))

	return handler(c)
}

func (h *httpHandler) GetRole(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
id := c.Params("id")
if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Role ID parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		role, err := h.roleService.GetRoleByID(ctx, id)
	if err != nil {
			return exceptions.HandleError(c, err)
		}

		// Convert proto response to DTO
		response := &dto.RoleResponse{
			ID:          role.GetId(),
			Name:        role.GetName(),
			Code:        role.GetCode(),
			Description: role.GetDescription(),
			Permissions: role.GetPermissionIds(),
		}

		return c.Status(fiber.StatusOK).JSON(response)
	})

	return handler(c)
}

func (h *httpHandler) GetAllRoles(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		roles, err := h.roleService.GetAllRoles(ctx)
	if err != nil {
			return exceptions.HandleError(c, err)
		}

		// Convert proto responses to DTOs
		response := make([]*dto.RoleResponse, 0, len(roles))
		for _, role := range roles {
			response = append(response, &dto.RoleResponse{
				ID:          role.GetId(),
				Name:        role.GetName(),
				Code:        role.GetCode(),
				Description: role.GetDescription(),
				Permissions: role.GetPermissionIds(),
			})
		}

		return c.Status(fiber.StatusOK).JSON(response)
	})

	return handler(c)
}

func (h *httpHandler) UpdateRole(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.UpdateRoleRequest](func(c *fiber.Ctx, req *dto.UpdateRoleRequest) error {
id := c.Params("id")
if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Role ID parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		// Convert DTO to proto request
		pbReq := &userPb.UpdateRoleRequest{
			Name:        req.Name,
			Code:        req.Code,
			Description: req.Description,
			PermissionIds: req.Permissions,
		}

		role, err := h.roleService.UpdateRole(ctx, id, pbReq)
	if err != nil {
			return exceptions.HandleError(c, err)
		}

		// Convert proto response to DTO
		response := &dto.RoleResponse{
			ID:          role.GetId(),
			Name:        role.GetName(),
			Code:        role.GetCode(),
			Description: role.GetDescription(),
			Permissions: role.GetPermissionIds(),
		}

		return c.Status(fiber.StatusOK).JSON(response)
	}))

	return handler(c)
}

func (h *httpHandler) DeleteRole(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
id := c.Params("id")
if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Role ID parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		err := h.roleService.DeleteRole(ctx, id)
	if err != nil {
			return exceptions.HandleError(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Role deleted successfully",
			"role_id": id,
		})
	})

	return handler(c)
}

// Permission management handlers
func (h *httpHandler) CreatePermission(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.CreatePermissionRequest](func(c *fiber.Ctx, req *dto.CreatePermissionRequest) error {
		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		// Convert DTO to proto request
		pbReq := &userPb.CreatePermissionRequest{
			Name:        req.Name,
			Code:        req.Code,
			Description: req.Description,
			Module:      req.Module,
		}

		permission, err := h.permService.CreatePermission(ctx, pbReq)
	if err != nil {
			return exceptions.HandleError(c, err)
		}

		// Convert proto response to DTO
		response := &dto.PermissionResponse{
			ID:          permission.GetId(),
			Name:        permission.GetName(),
			Code:        permission.GetCode(),
			Description: permission.GetDescription(),
			Module:      permission.GetModule(),
		}

		return c.Status(fiber.StatusCreated).JSON(response)
	}))

	return handler(c)
}

func (h *httpHandler) GetPermission(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
id := c.Params("id")
if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Permission ID parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		permission, err := h.permService.GetPermissionByID(ctx, id)
	if err != nil {
			return exceptions.HandleError(c, err)
		}

		// Convert proto response to DTO
		response := &dto.PermissionResponse{
			ID:          permission.GetId(),
			Name:        permission.GetName(),
			Code:        permission.GetCode(),
			Description: permission.GetDescription(),
			Module:      permission.GetModule(),
		}

		return c.Status(fiber.StatusOK).JSON(response)
	})

	return handler(c)
}

func (h *httpHandler) GetAllPermissions(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		permissions, err := h.permService.GetAllPermissions(ctx)
	if err != nil {
			return exceptions.HandleError(c, err)
		}

		// Convert proto responses to DTOs
		response := make([]*dto.PermissionResponse, 0, len(permissions))
		for _, permission := range permissions {
			response = append(response, &dto.PermissionResponse{
				ID:          permission.GetId(),
				Name:        permission.GetName(),
				Code:        permission.GetCode(),
				Description: permission.GetDescription(),
				Module:      permission.GetModule(),
			})
	}

		return c.Status(fiber.StatusOK).JSON(response)
	})

	return handler(c)
}

func (h *httpHandler) UpdatePermission(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.UpdatePermissionRequest](func(c *fiber.Ctx, req *dto.UpdatePermissionRequest) error {
id := c.Params("id")
if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Permission ID parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		// Convert DTO to proto request
		pbReq := &userPb.UpdatePermissionRequest{
			Name:        req.Name,
			Code:        req.Code,
			Description: req.Description,
			Module:      req.Module,
		}

		permission, err := h.permService.UpdatePermission(ctx, id, pbReq)
	if err != nil {
			return exceptions.HandleError(c, err)
		}

		// Convert proto response to DTO
		response := &dto.PermissionResponse{
			ID:          permission.GetId(),
			Name:        permission.GetName(),
			Code:        permission.GetCode(),
			Description: permission.GetDescription(),
			Module:      permission.GetModule(),
		}

		return c.Status(fiber.StatusOK).JSON(response)
	}))

	return handler(c)
}

func (h *httpHandler) DeletePermission(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
id := c.Params("id")
if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Permission ID parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		err := h.permService.DeletePermission(ctx, id)
	if err != nil {
			return exceptions.HandleError(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Permission deleted successfully",
			"permission_id": id,
		})
	})

	return handler(c)
}

// GetPermissionsByModule retrieves permissions by module
func (h *httpHandler) GetPermissionsByModule(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		module := c.Params("module")
		if module == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Module parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		permissions, err := h.permService.GetPermissionsByModule(ctx, module)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		// Convert proto responses to DTOs
		response := make([]*dto.PermissionResponse, 0, len(permissions))
		for _, permission := range permissions {
			response = append(response, &dto.PermissionResponse{
				ID:          permission.GetId(),
				Name:        permission.GetName(),
				Code:        permission.GetCode(),
				Description: permission.GetDescription(),
				Module:      permission.GetModule(),
				// Add the new fields once they're available in the proto
			})
		}

		return c.Status(fiber.StatusOK).JSON(response)
	})

	return handler(c)
}

// GetPermissionsByModuleAndAction retrieves permissions by module and action
func (h *httpHandler) GetPermissionsByModuleAndAction(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		module := c.Params("module")
		if module == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Module parameter is required", nil))
		}

		action := c.Params("action")
		if action == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Action parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		permissions, err := h.permService.GetPermissionsByModuleAndAction(ctx, module, action)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		// Convert proto responses to DTOs
		response := make([]*dto.PermissionResponse, 0, len(permissions))
		for _, permission := range permissions {
			response = append(response, &dto.PermissionResponse{
				ID:          permission.GetId(),
				Name:        permission.GetName(),
				Code:        permission.GetCode(),
				Description: permission.GetDescription(),
				Module:      permission.GetModule(),
				// Add the new fields once they're available in the proto
			})
		}

		return c.Status(fiber.StatusOK).JSON(response)
	})

	return handler(c)
}

// GetPermissionsByAccessLevel retrieves permissions by access level
func (h *httpHandler) GetPermissionsByAccessLevel(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		accessLevel := c.Params("access_level")
		if accessLevel == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Access level parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		permissions, err := h.permService.GetPermissionsByAccessLevel(ctx, accessLevel)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		// Convert proto responses to DTOs
		response := make([]*dto.PermissionResponse, 0, len(permissions))
		for _, permission := range permissions {
			response = append(response, &dto.PermissionResponse{
				ID:          permission.GetId(),
				Name:        permission.GetName(),
				Code:        permission.GetCode(),
				Description: permission.GetDescription(),
				Module:      permission.GetModule(),
				// Add the new fields once they're available in the proto
			})
		}

		return c.Status(fiber.StatusOK).JSON(response)
	})

	return handler(c)
}

// CreatePermissionFromTemplate creates permissions from a template
func (h *httpHandler) CreatePermissionFromTemplate(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.CreatePermissionTemplateRequest](func(c *fiber.Ctx, req *dto.CreatePermissionTemplateRequest) error {
		ctx, cancel := context.WithTimeout(c.Context(), 15*time.Second)
		defer cancel()

		result, err := h.permService.CreatePermissionFromTemplate(ctx, req)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return c.Status(fiber.StatusCreated).JSON(result)
	}))

	return handler(c)
}

// Registration methods
func (h *httpHandler) CheckUsername(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.CheckUsernameRequest](func(c *fiber.Ctx, req *dto.CheckUsernameRequest) error {
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		result, err := h.userService.CheckUsername(ctx, req)
	if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusOK, result)
	}))

	return handler(c)
}

func (h *httpHandler) SetPassword(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.SetPasswordRequest](func(c *fiber.Ctx, req *dto.SetPasswordRequest) error {
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		result, err := h.userService.SetPassword(ctx, req)
	if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusOK, result)
	}))

	return handler(c)
}

// GetUserFromContext retrieves user information from Fiber context
func GetUserFromContext(c *fiber.Ctx) (*dto.UserClaims, error) {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return nil, errors.New("user ID not found in context")
	}
	
	username, ok := c.Locals("username").(string)
	if !ok {
		return nil, errors.New("username not found in context")
	}
	
	roleCodes, ok := c.Locals("role_codes").([]string)
	if !ok {
		roleCodes = []string{} // Default to empty if not found
	}
	
	return &dto.UserClaims{
		UserID:    userID,
		Username:  username,
		RoleCodes: roleCodes,
	}, nil
}

// ActivateUser activates a user account
func (h *httpHandler) ActivateUser(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.ActivateUserRequest](func(c *fiber.Ctx, req *dto.ActivateUserRequest) error {
		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		// Check if user is admin
		userClaims, err := GetUserFromContext(c)
		if err != nil {
			return exceptions.HandleError(c, exceptions.Unauthorized("unauthorized access", err,
				exceptions.WithOperation("activate_user"),
				exceptions.WithEntity("user", "unknown")))
		}

		// Only admin can activate users - check both "admin" and "ADMIN" variations
		hasAdminRole := false
		for _, roleCode := range userClaims.RoleCodes {
			if strings.EqualFold(roleCode, "admin") {
				hasAdminRole = true
				break
			}
		}
		
		if !hasAdminRole {
			return exceptions.HandleError(c, exceptions.Forbidden("only admin can activate users", nil,
				exceptions.WithOperation("activate_user"),
				exceptions.WithEntity("user", req.UserID)))
		}

		result, err := h.userService.ActivateUser(ctx, req)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusOK, result)
	}))

	return handler(c)
}

// CreateModulePermissions creates module permissions
func (h *httpHandler) CreateModulePermissions(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.CreateModulePermissionsRequest](func(c *fiber.Ctx, req *dto.CreateModulePermissionsRequest) error {
		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		result, err := h.permService.CreateModulePermissions(ctx, (*dto.ModulePermissionTemplateRequest)(req))
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusCreated, result)
	}))

	return handler(c)
}