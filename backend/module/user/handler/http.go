package handler

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	userDto "github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/gofiber/fiber/v2"
)

// HTTPHandler handles HTTP requests for user service
type HTTPHandler interface {
	RegisterRoutes(router fiber.Router)
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

// RegisterRoutes registers all HTTP routes for user service
func (h *httpHandler) RegisterRoutes(router fiber.Router) {
	// User routes
	userRouter := router.Group("/users")
	userRouter.Post("/", h.CreateUser)
	userRouter.Get("/:id", h.GetUser)
	userRouter.Get("/", h.GetAllUsers)
	userRouter.Put("/:id", h.UpdateUser)
	userRouter.Delete("/:id", h.DeleteUser)
	userRouter.Post("/validate", h.ValidateCredentials)

	// Role routes
	roleRouter := router.Group("/roles")
	roleRouter.Post("/", h.CreateRole)
	roleRouter.Get("/:id", h.GetRole)
	roleRouter.Get("/", h.GetAllRoles)
	roleRouter.Put("/:id", h.UpdateRole)
	roleRouter.Delete("/:id", h.DeleteRole)

	// Permission routes
	permRouter := router.Group("/permissions")
	permRouter.Post("/", h.CreatePermission)
	permRouter.Get("/:id", h.GetPermission)
	permRouter.Get("/", h.GetAllPermissions)
	permRouter.Put("/:id", h.UpdatePermission)
	permRouter.Delete("/:id", h.DeletePermission)
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
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "User ID is required",
		})
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
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "User ID is required",
		})
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