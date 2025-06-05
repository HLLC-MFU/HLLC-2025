package handler

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/service"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserHTTPHandler struct {
	service service.UserService
}

func NewUserHandler(service service.UserService) *UserHTTPHandler {
	return &UserHTTPHandler{service: service}
}

func (h *UserHTTPHandler) CreateUser(c *fiber.Ctx) error {
	var req struct {
		Username string                 `json:"username"`
		Password string                 `json:"password"`
		Role     string                 `json:"role"`
		Name     model.Name             `json:"name"`
		Metadata map[string]interface{} `json:"metadata"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	roleID, err := primitive.ObjectIDFromHex(req.Role)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid role ID"})
	}

	user := &model.User{
		Username: req.Username,
		Password: req.Password,
		Role:     roleID,
		Name:     req.Name,
		Metadata: req.Metadata,
	}

	err = h.service.Create(c.Context(), user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(user)
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

	return c.Status(fiber.StatusOK).JSON(user)
}

func (h *UserHTTPHandler) ListUsers(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	users, _, err := h.service.List(c.Context(), int64(page), int64(limit))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(users)
}

func (h *UserHTTPHandler) UpdateUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	id, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var req struct {
		Username string                 `json:"username"`
		Password string                 `json:"password"`
		Role     string                 `json:"role"`
		Name     model.Name             `json:"name"`
		Metadata map[string]interface{} `json:"metadata"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	roleID, err := primitive.ObjectIDFromHex(req.Role)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid role ID"})
	}

	user := &model.User{
		ID:       id,
		Username: req.Username,
		Password: req.Password,
		Role:     roleID,
		Name:     req.Name,
		Metadata: req.Metadata,
	}

	err = h.service.Update(c.Context(), user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(user)
}

func (h *UserHTTPHandler) DeleteUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	id, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	err = h.service.Delete(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "User deleted successfully"})
}
