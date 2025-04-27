package handler

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	serviceHttp "github.com/HLLC-MFU/HLLC-2025/backend/module/user/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
)

type UserHTTPHandler interface {
	CreateUser(c *fiber.Ctx) error
	GetUserByID(c *fiber.Ctx) error
	GetUserByUsername(c *fiber.Ctx) error
	ListUsers(c *fiber.Ctx) error
	UpdateUser(c *fiber.Ctx) error
	DeleteUser(c *fiber.Ctx) error
}

type userHTTPHandler struct {
	userService serviceHttp.UserService
}

func NewUserHTTPHandler(userService serviceHttp.UserService) UserHTTPHandler {
	return &userHTTPHandler{userService: userService}
}

func (h *userHTTPHandler) CreateUser(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	var req dto.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid body", err))
	}

	user := &userPb.User{
		Name: &userPb.Name{
			First:  req.Name.First,
			Middle: req.Name.Middle,
			Last:   req.Name.Last,
		},
		Username: req.Username,
		Password: req.Password,
		RoleIds:  req.RoleIDs,
	}

	if err := h.userService.CreateUser(ctx, user); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusCreated)
}

func (h *userHTTPHandler) GetUserByID(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	id := c.Params("id")
	if id == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("id is required", nil))
	}

	user, err := h.userService.GetUserByID(ctx, id)
	if err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.JSON(user)
}

func (h *userHTTPHandler) GetUserByUsername(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	username := c.Params("username")
	if username == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("username is required", nil))
	}

	user, err := h.userService.GetUserByUsername(ctx, username)
	if err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.JSON(user)
}

func (h *userHTTPHandler) ListUsers(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	users, err := h.userService.ListUsers(ctx)
	if err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.JSON(users)
}

func (h *userHTTPHandler) UpdateUser(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	id := c.Params("id")
	if id == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("id is required", nil))
	}

	var req dto.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid body", err))
	}

	user := &userPb.User{}
	if req.Name != nil {
		user.Name = &userPb.Name{
			First:  req.Name.First,
			Middle: req.Name.Middle,
			Last:   req.Name.Last,
		}
	}
	if req.Username != nil {
		user.Username = *req.Username
	}
	if req.Password != nil {
		user.Password = *req.Password
	}
	if req.RoleIDs != nil {
		user.RoleIds = req.RoleIDs
	}

	if err := h.userService.UpdateUser(ctx, id, user); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *userHTTPHandler) DeleteUser(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	id := c.Params("id")
	if id == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("id is required", nil))
	}

	if err := h.userService.DeleteUser(ctx, id); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusOK)
}
