package handler

import (
	"context"
	"time"

	permissionPb "github.com/HLLC-MFU/HLLC-2025/backend/module/permission/proto/generated"
	serviceHttp "github.com/HLLC-MFU/HLLC-2025/backend/module/permission/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/gofiber/fiber/v2"
)

type HTTPHandler interface {
	CreatePermission(c *fiber.Ctx) error
	GetPermission(c *fiber.Ctx) error
	GetAllPermissions(c *fiber.Ctx) error
	UpdatePermission(c *fiber.Ctx) error
	DeletePermission(c *fiber.Ctx) error
}

type httpHandler struct {
	permissionService serviceHttp.PermissionService
}

func NewPermissionHTTPHandler(
	permissionService serviceHttp.PermissionService,
) HTTPHandler {
	return &httpHandler{
		permissionService: permissionService,
	}
}

func (h *httpHandler) CreatePermission(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	var req permissionPb.Permission
	if err := c.BodyParser(&req); err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid request body", err))
	}

	if err := h.permissionService.CreatePermission(ctx, &req); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusCreated)
}

func (h *httpHandler) GetPermission(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	id := c.Params("id")
	if id == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("permission ID is required", nil))
	}

	permission, err := h.permissionService.GetPermission(ctx, id)
	if err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(permission)
}

func (h *httpHandler) GetAllPermissions(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	permissions, err := h.permissionService.ListPermissions(ctx)
	if err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(permissions)
}

func (h *httpHandler) UpdatePermission(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	id := c.Params("id")
	if id == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("permission ID is required", nil))
	}

	var req permissionPb.Permission
	if err := c.BodyParser(&req); err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid request body", err))
	}

	if err := h.permissionService.UpdatePermission(ctx, id, &req); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *httpHandler) DeletePermission(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	id := c.Params("id")
	if id == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("permission ID is required", nil))
	}

	if err := h.permissionService.DeletePermission(ctx, id); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusOK)
}
