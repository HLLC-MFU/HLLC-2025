package handler

import (
	"strconv"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/roles/service"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RoleHTTPHandler struct {
	service service.RoleService
}

func NewHTTPHandler(service service.RoleService) *RoleHTTPHandler {
	return &RoleHTTPHandler{
		service: service,
	}
}

func (h *RoleHTTPHandler) ListRoles(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)

	roles, total, err := h.service.ListRoles(c.Context(), page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"roles": roles,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *RoleHTTPHandler) GetRole(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid role ID",
		})
	}

	role, err := h.service.GetRole(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	if role == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "role not found",
		})
	}

	return c.JSON(role)
}
