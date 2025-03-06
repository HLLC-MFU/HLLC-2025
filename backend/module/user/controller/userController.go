package controller

import (
	"strconv"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/user"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/ansel1/merry/v2"
	"github.com/gofiber/fiber/v2"
)

type UserController struct {
	userService service.UserService
}

func NewUserController(userService service.UserService) *UserController {
	return &UserController{
		userService: userService,
	}
}

func (c *UserController) RegisterRoutes(app *fiber.App) {
	users := app.Group("/api/users")
	users.Post("/", c.CreateUser)
	users.Get("/:id", c.GetUser)
	users.Put("/:id", c.UpdateUser)
	users.Delete("/:id", c.DeleteUser)
	users.Get("/", c.ListUsers)
	users.Put("/:id/password", c.UpdatePassword)
}

func (c *UserController) CreateUser(ctx *fiber.Ctx) error {
	req := new(user.CreateUserRequest)
	if err := ctx.BodyParser(req); err != nil {
		return merry.Wrap(err).WithHTTPCode(400)
	}

	user, err := c.userService.CreateUser(ctx.UserContext(), req)
	if err != nil {
		return err
	}

	return ctx.Status(201).JSON(user)
}

func (c *UserController) GetUser(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	user, err := c.userService.GetUserByID(ctx.UserContext(), id)
	if err != nil {
		return err
	}

	return ctx.JSON(user)
}

func (c *UserController) UpdateUser(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	req := new(user.UpdateUserRequest)
	if err := ctx.BodyParser(req); err != nil {
		return merry.Wrap(err).WithHTTPCode(400)
	}

	user, err := c.userService.UpdateUser(ctx.UserContext(), id, req)
	if err != nil {
		return err
	}

	return ctx.JSON(user)
}

func (c *UserController) DeleteUser(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if err := c.userService.DeleteUser(ctx.UserContext(), id); err != nil {
		return err
	}

	return ctx.SendStatus(204)
}

func (c *UserController) ListUsers(ctx *fiber.Ctx) error {
	page, _ := strconv.ParseInt(ctx.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(ctx.Query("limit", "10"), 10, 64)

	users, err := c.userService.ListUsers(ctx.UserContext(), page, limit)
	if err != nil {
		return err
	}

	return ctx.JSON(users)
}

func (c *UserController) UpdatePassword(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	req := new(user.UpdatePasswordRequest)
	if err := ctx.BodyParser(req); err != nil {
		return merry.Wrap(err).WithHTTPCode(400)
	}

	if err := c.userService.UpdatePassword(ctx.UserContext(), id, req); err != nil {
		return err
	}

	return ctx.SendStatus(204)
} 