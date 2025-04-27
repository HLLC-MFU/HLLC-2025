package handler

import (
	"context"
	"time"

	userRolePb "github.com/HLLC-MFU/HLLC-2025/backend/module/user_role/proto/generated"
	serviceHttp "github.com/HLLC-MFU/HLLC-2025/backend/module/user_role/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/gofiber/fiber/v2"
)

type HTTPHandler interface {
	CreateUserRole(c *fiber.Ctx) error
	GetUserRole(c *fiber.Ctx) error
	UpdateUserRole(c *fiber.Ctx) error
	DeleteUserRole(c *fiber.Ctx) error
}

type httpHandler struct {
	userRoleService serviceHttp.UserRoleService
}

func NewHTTPHandler(userRoleService serviceHttp.UserRoleService) HTTPHandler {
	return &httpHandler{userRoleService: userRoleService}
}

func (h *httpHandler) CreateUserRole(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	var req userRolePb.UserRole
	if err := c.BodyParser(&req); err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid request body", err))
	}

	if err := h.userRoleService.CreateUserRole(ctx, &req); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusCreated)
}

func (h *httpHandler) GetUserRole(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	userID := c.Params("userID")
	if userID == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("user ID is required", nil))
	}

	result, err := h.userRoleService.GetUserRole(ctx, userID)
	if err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(result)
}

func (h *httpHandler) UpdateUserRole(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	userID := c.Params("userID")
	if userID == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("user ID is required", nil))
	}

	var req userRolePb.UserRole
	if err := c.BodyParser(&req); err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid request body", err))
	}

	if err := h.userRoleService.UpdateUserRole(ctx, userID, &req); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *httpHandler) DeleteUserRole(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	userID := c.Params("userID")
	if userID == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("user ID is required", nil))
	}

	if err := h.userRoleService.DeleteUserRole(ctx, userID); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusOK)
}
