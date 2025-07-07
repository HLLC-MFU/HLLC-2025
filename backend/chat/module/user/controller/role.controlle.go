package controller

import (
	"chat/module/user/service"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"
	"chat/pkg/middleware"

	"github.com/gofiber/fiber/v2"
)

type (
	RoleController struct {
		*decorators.BaseController
		service *service.RoleService
		rbac middleware.IRBACMiddleware
	}
)

func NewRoleController(app fiber.Router, service *service.RoleService, rbac middleware.IRBACMiddleware) *RoleController {
	c := &RoleController{
		BaseController: decorators.NewBaseController(app, ""),
		service: service,
		rbac: rbac,
	}

	c.Get("/", c.GetRoles, c.rbac.RequireAdministrator())
	c.Get("/:id", c.GetRoleById, c.rbac.RequireAdministrator())
	c.SetupRoutes()

	return c
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