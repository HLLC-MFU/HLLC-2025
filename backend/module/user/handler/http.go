package handler

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	userDto "github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
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
	users, err := h.userService.GetAllUsers(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

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
	roles, err := h.userService.GetAllRoles(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(roles)
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