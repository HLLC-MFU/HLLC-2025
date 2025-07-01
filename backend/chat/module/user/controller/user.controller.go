package controller

import (
	"chat/module/user/service"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"

	"github.com/gofiber/fiber/v2"
)

type (
	UserController struct {
		*decorators.BaseController
		service *service.UserService
	}
)

func NewUserController(app *fiber.App, service *service.UserService) *UserController {
	controller := &UserController{
		BaseController: decorators.NewBaseController(app, "/api/users"),
		service: service,
	}

	controller.Get("/", controller.GetUsers)
	controller.Get("/:id", controller.GetUserById)
	controller.SetupRoutes()

	return controller
}

func (c *UserController) GetUsers(ctx *fiber.Ctx) error {
	opts := queries.ParseQueryOptions(ctx)
	response, err := c.service.GetUsers(ctx.Context(), opts)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}
	return ctx.JSON(response)
}

func (c *UserController) GetUserById(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	user, err := c.service.GetUserById(ctx.Context(), id)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}
	
	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "User found successfully",
		"data": user,
	})
}