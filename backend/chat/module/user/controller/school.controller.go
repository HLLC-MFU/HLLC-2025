package controller

import (
	"chat/module/user/service"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"

	"github.com/gofiber/fiber/v2"
)

type (
	SchoolController struct {
		*decorators.BaseController
		service *service.SchoolService
	}
)

func NewSchoolController(app *fiber.App, service *service.SchoolService) *SchoolController {
	controller := &SchoolController{
		BaseController: decorators.NewBaseController(app, "/api/schools"),
		service:       service,
	}

	controller.Get("/", controller.GetSchools)
	controller.Get("/:id", controller.GetSchoolById)
	controller.SetupRoutes()

	return controller
}

func (c *SchoolController) GetSchools(ctx *fiber.Ctx) error {
	opts := queries.ParseQueryOptions(ctx)
	
	response, err := c.service.GetSchools(ctx.Context(), opts)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.JSON(response)
}

func (c *SchoolController) GetSchoolById(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	school, err := c.service.GetSchoolById(ctx.Context(), id)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}
	return ctx.JSON(school)
}