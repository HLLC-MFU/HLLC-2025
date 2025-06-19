package controller

import (
	"chat/module/user/service"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"

	"github.com/gofiber/fiber/v2"
)

type (
	RoleController struct {
		*decorators.BaseController
		service *service.RoleService
	}
)

func NewRoleController(app *fiber.App, service *service.RoleService) *RoleController {
	controller := &RoleController{
		BaseController: decorators.NewBaseController(app, "/api/roles"),
		service: service,
	}

	controller.Get("/", controller.GetRoles)
	controller.Get("/:id", controller.GetRoleById)
	controller.SetupRoutes()

	return controller
}

func (c *RoleController) GetRoles(ctx *fiber.Ctx) error {
	opts := queries.ParseQueryOptions(ctx)
	response, err := c.service.GetRoles(ctx.Context(), opts)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.JSON(response)
}

func (c *RoleController) GetRoleById(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	role, err := c.service.GetRoleById(ctx.Context(), id)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}
	return ctx.JSON(role)
}