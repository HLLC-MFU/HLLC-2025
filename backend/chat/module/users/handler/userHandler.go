package handler

import (
	majorService "github.com/HLLC-MFU/HLLC-2025/backend/module/majors/service"
	roleService "github.com/HLLC-MFU/HLLC-2025/backend/module/roles/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/service"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserHTTPHandler struct {
	service      service.UserService
	roleSerivce  roleService.RoleService
	majorService majorService.MajorService
}

func NewUserHandler(service service.UserService, roleService roleService.RoleService, majorService majorService.MajorService) *UserHTTPHandler {
	return &UserHTTPHandler{
		service:      service,
		roleSerivce:  roleService,
		majorService: majorService,
	}
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
		role, _ := h.roleSerivce.GetRole(c.Context(), user.Role)

		userMap := map[string]interface{}{
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
			"id":         user.ID.Hex(),
			"name":       user.Name,
			"username":   user.Username,
			"role_id":    user.Role.Hex(),
			"role":       role,
		}

		// 🌟 Populate metadata.major if it's an ObjectID string
		if user.Metadata != nil {
			meta := user.Metadata

			if majorRaw, ok := meta["major"]; ok {
				if majorStr, ok := majorRaw.(string); ok {
					majorID, err := primitive.ObjectIDFromHex(majorStr)
					if err == nil {
						major, err := h.majorService.GetMajor(c.Context(), majorID)
						if err == nil && major != nil {
							meta["major"] = major
						}
					}
				}
			}

			userMap["metadata"] = meta
		}

		result = append(result, userMap)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"users": result,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
