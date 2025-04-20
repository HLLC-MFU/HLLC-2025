package handler

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	userDto "github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/gofiber/fiber/v2"
)

// HTTPHandler handles HTTP requests for user service
type HTTPHandler interface {
	RegisterPublicRoutes(router fiber.Router)
	RegisterProtectedRoutes(router fiber.Router)
	RegisterAdminRoutes(router fiber.Router)
}

type httpHandler struct {
	cfg         *config.Config
	userService service.UserService
}

// NewHTTPHandler creates a new HTTP handler with decorators
func NewHTTPHandler(cfg *config.Config, userService service.UserService) HTTPHandler {
	return &httpHandler{
		cfg:         cfg,
		userService: userService,
	}
}

// RegisterPublicRoutes registers routes that don't require authentication
func (h *httpHandler) RegisterPublicRoutes(router fiber.Router) {
	// Public user-related endpoints (if any)
	router.Post("/validate-credentials", h.ValidateCredentials)
	router.Post("/check-username", h.CheckUsername)
	router.Post("/set-password", h.SetPassword)
}

// RegisterProtectedRoutes registers routes that require authentication
func (h *httpHandler) RegisterProtectedRoutes(router fiber.Router) {
	// User profile management
	router.Get("/profile", h.GetUser)
	router.Put("/profile", h.UpdateUser)
	
	// Basic role and permission viewing
	router.Get("/roles", h.GetAllRoles)
	router.Get("/permissions", h.GetAllPermissions)
}

// RegisterAdminRoutes registers routes that require admin role
func (h *httpHandler) RegisterAdminRoutes(router fiber.Router) {
	// User management
	router.Post("/users", h.CreateUser)
	router.Get("/users", h.GetAllUsers)
	router.Get("/users/:id", h.GetUser)
	router.Put("/users/:id", h.UpdateUser)
	router.Delete("/users/:id", h.DeleteUser)

	// Role management
	router.Post("/roles", h.CreateRole)
	router.Get("/roles/:id", h.GetRole)
	router.Put("/roles/:id", h.UpdateRole)
	router.Delete("/roles/:id", h.DeleteRole)

	// Permission management
	router.Post("/permissions", h.CreatePermission)
	router.Get("/permissions/:id", h.GetPermission)
	router.Put("/permissions/:id", h.UpdatePermission)
	router.Delete("/permissions/:id", h.DeletePermission)
}

// User handlers
func (h *httpHandler) CreateUser(c *fiber.Ctx) error {
	var req userDto.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	user, err := h.userService.CreateUser(c.Context(), &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(user)
}

func (h *httpHandler) GetUser(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		// If no ID provided, get current user's profile
		id = c.Locals("user_id").(string)
	}

	user, err := h.userService.GetUserByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(user)
}

func (h *httpHandler) GetAllUsers(c *fiber.Ctx) error {
	log.Printf("HTTP GetAllUsers: Requesting all users")
	
	ctx, cancel := context.WithTimeout(c.Context(), 15*time.Second)
	defer cancel()
	
	users, err := h.userService.GetAllUsers(ctx)
	if err != nil {
		log.Printf("HTTP GetAllUsers error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve users: " + err.Error(),
		})
	}
	
	// Ensure we return valid JSON even if some values are nil
	for i := range users {
		if users[i].Roles == nil {
			users[i].Roles = []*userPb.Role{}
		}
		
		// Major can be nil - that's okay, JSON will show it as null
		if users[i].Major == nil && users[i].MajorID != "" {
			log.Printf("HTTP GetAllUsers: User %s has majorID %s but major data is nil", 
				users[i].Username, users[i].MajorID)
		}
	}
	
	log.Printf("HTTP GetAllUsers: Successfully returning %d users", len(users))
	return c.JSON(users)
}

func (h *httpHandler) UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		// If no ID provided, update current user's profile
		id = c.Locals("user_id").(string)
	}

	var req userDto.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	user, err := h.userService.UpdateUser(c.Context(), id, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(user)
}

func (h *httpHandler) DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "User ID is required",
		})
	}

	err := h.userService.DeleteUser(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *httpHandler) ValidateCredentials(c *fiber.Ctx) error {
	var req userDto.ValidateCredentialsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	valid, err := h.userService.ValidatePassword(c.Context(), req.Username, req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"valid": valid,
	})
}

// Role handlers
func (h *httpHandler) CreateRole(c *fiber.Ctx) error {
	var req userDto.CreateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	role, err := h.userService.CreateRole(c.Context(), &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(role)
}

func (h *httpHandler) GetRole(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Role ID is required",
		})
	}

	role, err := h.userService.GetRoleByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(role)
}

func (h *httpHandler) GetAllRoles(c *fiber.Ctx) error {
	log.Printf("HTTP GetAllRoles: Requesting all roles")
	
	ctx, cancel := context.WithTimeout(c.Context(), 15*time.Second)
	defer cancel()
	
	// First fetch all permissions to have them available
	permissionsResponse, err := h.userService.GetAllPermissions(ctx)
	if err != nil {
		log.Printf("HTTP GetAllRoles error getting permissions: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve permissions: " + err.Error(),
		})
	}
	
	// Log available permissions
	log.Printf("HTTP GetAllRoles: Found %d permissions", len(permissionsResponse))
	
	// Create a map of all permissions for easy lookup and ensure each has the correct format
	allPermissions := make(map[string]map[string]interface{})
	allPermissionsArray := make([]map[string]interface{}, 0, len(permissionsResponse))
	
	for _, perm := range permissionsResponse {
		permData := map[string]interface{}{
			"id":          perm.ID,
			"name":        perm.Name,
			"code":        perm.Code,
			"description": perm.Description,
			"module":      perm.Module,
		}
		allPermissions[perm.ID] = permData
		allPermissionsArray = append(allPermissionsArray, permData)
		
		log.Printf("HTTP GetAllRoles: Available permission: %s (ID: %s, Code: %s)", 
			perm.Name, perm.ID, perm.Code)
	}
	
	// Get all roles
	roles, err := h.userService.GetAllRoles(ctx)
	if err != nil {
		log.Printf("HTTP GetAllRoles error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve roles: " + err.Error(),
		})
	}
	
	// Return roles with embedded permissions
	formattedRoles := make([]map[string]interface{}, 0, len(roles))
	
	for _, role := range roles {
		// Debug log the role information
		log.Printf("HTTP GetAllRoles: Processing role %s (ID: %s)", role.Name, role.ID)
		
		// For ADMIN role, always add all permissions
		if role.Code == "ADMIN" {
			log.Printf("HTTP GetAllRoles: Special handling for ADMIN role with code %s", role.Code)
			
			// Create formatted role with all permissions
			formattedRole := map[string]interface{}{
				"id":          role.ID,
				"name":        role.Name,
				"code":        role.Code,
				"description": role.Description,
				"permissions": allPermissionsArray, // Add ALL permissions for ADMIN
			}
			
			log.Printf("HTTP GetAllRoles: Added all %d permissions to ADMIN role", len(allPermissionsArray))
			formattedRoles = append(formattedRoles, formattedRole)
			continue
		}
		
		// For non-ADMIN roles, use the assigned permissions
		permissions := make([]map[string]interface{}, 0)
		if role.Permissions != nil {
			log.Printf("Role %s has %d permissions to format", role.Name, len(role.Permissions))
			for i, perm := range role.Permissions {
				if perm == nil {
					log.Printf("Warning: Nil permission found at index %d in role %s", i, role.Name)
					continue
				}
				
				log.Printf("Adding permission: %s (ID: %s, Code: %s)", perm.Name, perm.Id, perm.Code)
				permissions = append(permissions, map[string]interface{}{
					"id":          perm.Id,
					"name":        perm.Name,
					"code":        perm.Code,
					"description": perm.Description,
					"module":      perm.Module,
				})
			}
		} else {
			log.Printf("Role %s has nil Permissions field", role.Name)
		}
		
		log.Printf("Formatted %d permissions for role %s", len(permissions), role.Name)
		
		// Create formatted role
		formattedRole := map[string]interface{}{
			"id":          role.ID,
			"name":        role.Name,
			"code":        role.Code,
			"description": role.Description,
			"permissions": permissions,
		}
		
		formattedRoles = append(formattedRoles, formattedRole)
	}
	
	// Log the final JSON output for debugging
	jsonData, _ := json.MarshalIndent(formattedRoles, "", "  ")
	log.Printf("HTTP GetAllRoles: Final JSON response: %s", string(jsonData))
	
	log.Printf("HTTP GetAllRoles: Successfully returning %d roles", len(formattedRoles))
	return c.JSON(formattedRoles)
}

func (h *httpHandler) UpdateRole(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Role ID is required",
		})
	}

	var req userDto.UpdateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	role, err := h.userService.UpdateRole(c.Context(), id, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(role)
}

func (h *httpHandler) DeleteRole(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Role ID is required",
		})
	}

	err := h.userService.DeleteRole(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// Permission handlers
func (h *httpHandler) CreatePermission(c *fiber.Ctx) error {
	var req userDto.CreatePermissionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	permission, err := h.userService.CreatePermission(c.Context(), &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(permission)
}

func (h *httpHandler) GetPermission(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Permission ID is required",
		})
	}

	permission, err := h.userService.GetPermissionByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(permission)
}

func (h *httpHandler) GetAllPermissions(c *fiber.Ctx) error {
	permissions, err := h.userService.GetAllPermissions(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(permissions)
}

func (h *httpHandler) UpdatePermission(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Permission ID is required",
		})
	}

	var req userDto.UpdatePermissionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	permission, err := h.userService.UpdatePermission(c.Context(), id, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(permission)
}

func (h *httpHandler) DeletePermission(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Permission ID is required",
		})
	}

	err := h.userService.DeletePermission(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *httpHandler) CheckUsername(c *fiber.Ctx) error {
	var req userDto.CheckUsernameRequest
	
	// Use decorator to handle request validation
	if err := decorator.WithRequestValidation(&req)(c); err != nil {
		return err
	}
	
	// Use WithTimeout from context in service layer, not here
	resp, err := h.userService.CheckUsername(c.Context(), &req)
	if err != nil {
		// Return detailed error response
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status": false,
			"error": err.Error(),
			"code": "internal_error",
		})
	}

	// Return standardized response
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status": true,
		"data": resp,
	})
}

func (h *httpHandler) SetPassword(c *fiber.Ctx) error {
	var req userDto.SetPasswordRequest
	
	// Use decorator to handle request validation
	if err := decorator.WithRequestValidation(&req)(c); err != nil {
		return err
	}

	// Use WithTimeout from context in service layer, not here
	resp, err := h.userService.SetPassword(c.Context(), &req)
	if err != nil {
		// Return detailed error response
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status": false,
			"error": err.Error(),
			"code": "internal_error",
		})
	}

	// Set SUCCESS status code depending on the result
	statusCode := fiber.StatusOK
	if !resp.Success {
		statusCode = fiber.StatusBadRequest
	}

	// Return standardized response
	return c.Status(statusCode).JSON(fiber.Map{
		"status": resp.Success,
		"message": resp.Message,
	})
} 