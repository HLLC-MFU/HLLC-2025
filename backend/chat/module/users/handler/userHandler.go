package handler

import (
	roleService "github.com/HLLC-MFU/HLLC-2025/backend/module/roles/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/service"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserHTTPHandler struct {
	service     service.UserService
	roleSerivce roleService.RoleService
}

func NewUserHandler(service service.UserService, roleService roleService.RoleService) *UserHTTPHandler {
	return &UserHTTPHandler{service: service, roleSerivce: roleService}
}

func (h *UserHTTPHandler) GetUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	id, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	user, err := h.service.GetById(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// Populate role
	var roleData interface{}
	if h.roleSerivce != nil && user.Role != primitive.NilObjectID {
		roleObj, err := h.roleSerivce.GetRole(c.Context(), user.Role)
		if err == nil && roleObj != nil {
			roleData = map[string]interface{}{
				"id":          roleObj.ID.Hex(),
				"name":        roleObj.Name,
				"permissions": roleObj.Permissions,
			}
		}
	}

	// Prepare response
	userResp := map[string]interface{}{
		"id":         user.ID.Hex(),
		"created_at": user.CreatedAt,
		"updated_at": user.UpdatedAt,
		"username":   user.Username,
		"name":       user.Name,
		"role_id":    user.Role.Hex(),
		"role":       roleData,
	}

	if user.Metadata != nil {
		userResp["metadata"] = user.Metadata
	}

	return c.Status(fiber.StatusOK).JSON(userResp)
}

func (h *UserHTTPHandler) ListUsers(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)

	users, total, err := h.service.List(c.Context(), int64(page), int64(limit))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	var result []map[string]interface{}
	for _, user := range users {
		// Fetch role information by ObjectID
		role, err := h.roleSerivce.GetRole(c.Context(), user.Role)
		if err != nil {
			role = nil // skip role info if not found or error
		}

		result = append(result, map[string]interface{}{
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
			"id":         user.ID.Hex(),
			"name":       user.Name,
			"username":   user.Username,
			"role_id":    user.Role.Hex(),
			"role":       role,
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"users": result,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
