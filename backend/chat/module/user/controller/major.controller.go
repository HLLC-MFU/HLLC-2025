package controller

import (
	"chat/module/user/service"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"

	"github.com/gofiber/fiber/v2"
)

type (
	MajorController struct {
		*decorators.BaseController
		service *service.MajorService
	}
)

func NewMajorController(app *fiber.App, service *service.MajorService) *MajorController {
	controller := &MajorController{
		BaseController: decorators.NewBaseController(app, "/api/majors"),
		service:       service,
	}

	controller.Get("/", controller.GetMajors)
	controller.Get("/:id", controller.GetMajorById)
	controller.SetupRoutes()

	return controller
}

func (c *MajorController) GetMajors(ctx *fiber.Ctx) error {
	opts := queries.ParseQueryOptions(ctx)
	
	response, err := c.service.GetMajors(ctx.Context(), opts)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.JSON(response)
}

func (c *MajorController) GetMajorById(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	major, err := c.service.GetMajorById(ctx.Context(), id)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}
	return ctx.JSON(major)
}