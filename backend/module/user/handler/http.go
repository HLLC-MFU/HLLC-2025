package handler

import (
	"net/http"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	userDto "github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/request"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/response"
	"github.com/gofiber/fiber/v2"
)

type HTTPHandler interface {
	CreateUser(c *fiber.Ctx) error
	GetUser(c *fiber.Ctx) error
	ValidateCredentials(c *fiber.Ctx) error
}

type httpHandler struct {
	cfg         *config.Config
	userService service.UserService
}

func NewHTTPHandler(cfg *config.Config, userService service.UserService) HTTPHandler {
	return &httpHandler{
		cfg:         cfg,
		userService: userService,
	}
}

// CreateUser handles HTTP request for user creation
func (h *httpHandler) CreateUser(ctx *fiber.Ctx) error {
	wrapper := request.NewContextWrapper(ctx)
	
	var req userDto.CreateUserRequest
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(ctx, http.StatusBadRequest, "Invalid request format: "+err.Error())
	}

	// Validate request
	if req.Username == "" || req.Password == "" {
		return response.Error(ctx, http.StatusBadRequest, "Username and password are required")
	}

	result, err := h.userService.CreateUser(ctx.Context(), &req)
	if err != nil {
		return response.Error(ctx, http.StatusInternalServerError, "Failed to create user: "+err.Error())
	}

	return response.Success(ctx, http.StatusCreated, result)
}

// GetUser handles HTTP request for retrieving user information
func (h *httpHandler) GetUser(ctx *fiber.Ctx) error {
	username := ctx.Params("username")
	if username == "" {
		return response.Error(ctx, http.StatusBadRequest, "Username is required")
	}

	result, err := h.userService.GetUserByUsername(ctx.Context(), username)
	if err != nil {
		return response.Error(ctx, http.StatusInternalServerError, "Failed to get user: "+err.Error())
	}

	return response.Success(ctx, http.StatusOK, result)
}

// ValidateCredentials handles HTTP request for validating user credentials
func (h *httpHandler) ValidateCredentials(ctx *fiber.Ctx) error {
	wrapper := request.NewContextWrapper(ctx)
	
	var req struct {
		Username string `json:"username" validate:"required"`
		Password string `json:"password" validate:"required"`
	}
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(ctx, http.StatusBadRequest, "Invalid request format: "+err.Error())
	}

	// Validate request
	if req.Username == "" || req.Password == "" {
		return response.Error(ctx, http.StatusBadRequest, "Username and password are required")
	}

	isValid, err := h.userService.ValidatePassword(ctx.Context(), req.Username, req.Password)
	if err != nil {
		return response.Error(ctx, http.StatusInternalServerError, "Failed to validate credentials: "+err.Error())
	}

	if !isValid {
		return response.Error(ctx, http.StatusUnauthorized, "Invalid credentials")
	}

	return response.Success(ctx, http.StatusOK, map[string]bool{"valid": true})
} 