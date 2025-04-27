package handler

import (
	"context"
	"time"

	rolePb "github.com/HLLC-MFU/HLLC-2025/backend/module/role/proto/generated"
	serviceHttp "github.com/HLLC-MFU/HLLC-2025/backend/module/role/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/gofiber/fiber/v2"
)

type RoleHTTPHandler interface {
	CreateRole(c *fiber.Ctx) error
	GetRole(c *fiber.Ctx) error
	GetAllRoles(c *fiber.Ctx) error
	UpdateRole(c *fiber.Ctx) error
	DeleteRole(c *fiber.Ctx) error
}

type httpHandler struct {
	roleService serviceHttp.RoleService
}

func NewRoleHTTPHandler(
	roleService serviceHttp.RoleService,
) RoleHTTPHandler {
	return &httpHandler{
		roleService: roleService,
	}
}

func (h *httpHandler) CreateRole(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	var req rolePb.Role
	if err := c.BodyParser(&req); err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid request body", err))
	}

	if err := h.roleService.CreateRole(ctx, &req); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusCreated)
}

func (h *httpHandler) GetRole(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	id := c.Params("id")
	if id == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("role ID is required", nil))
	}

	role, err := h.roleService.GetRole(ctx, id)
	if err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(role)
}

func (h *httpHandler) GetAllRoles(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	roles, err := h.roleService.ListRoles(ctx)
	if err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(roles)
}

func (h *httpHandler) UpdateRole(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	id := c.Params("id")
	if id == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("role ID is required", nil))
	}

	var req rolePb.Role
	if err := c.BodyParser(&req); err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid request body", err))
	}

	if err := h.roleService.UpdateRole(ctx, id, &req); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *httpHandler) DeleteRole(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	id := c.Params("id")
	if id == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("role ID is required", nil))
	}

	if err := h.roleService.DeleteRole(ctx, id); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusOK)
}
