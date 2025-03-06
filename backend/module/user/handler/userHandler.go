package handler

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/request"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/response"
	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

func (h *UserHandler) RegisterRoutes(app *fiber.App) {
	users := app.Group("/api/users")
	users.Post("/", h.CreateUser)
	users.Get("/:id", h.GetUser)
	users.Put("/:id", h.UpdateUser)
	users.Delete("/:id", h.DeleteUser)
	users.Get("/", h.ListUsers)
	users.Put("/:id/password", h.UpdatePassword)
}

func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
	ctx := request.NewContextWrapper(c)
	req := new(model.CreateUserRequest)
	if err := ctx.Bind(req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}

	result, err := h.userService.CreateUser(c.Context(), req)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.StatusCreated, result)
}

func (h *UserHandler) GetUser(c *fiber.Ctx) error {
	id := c.Params("id")
	result, err := h.userService.GetUserByID(c.Context(), id)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.StatusOK, result)
}

func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx := request.NewContextWrapper(c)
	req := new(model.UpdateUserRequest)
	if err := ctx.Bind(req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}

	result, err := h.userService.UpdateUser(c.Context(), id, req)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.StatusOK, result)
}

func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.userService.DeleteUser(c.Context(), id); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.StatusNoContent, nil)
}

func (h *UserHandler) ListUsers(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)

	result, err := h.userService.ListUsers(c.Context(), int64(page), int64(limit))
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.StatusOK, result)
}

func (h *UserHandler) UpdatePassword(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx := request.NewContextWrapper(c)
	req := new(model.UpdatePasswordRequest)
	if err := ctx.Bind(req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}

	if err := h.userService.UpdatePassword(c.Context(), id, req); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.StatusNoContent, nil)
}
