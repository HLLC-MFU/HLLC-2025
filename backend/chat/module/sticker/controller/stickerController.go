package controller

import (
	"chat/module/sticker/dto"
	"chat/module/sticker/service"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"
	controllerHelper "chat/pkg/helpers/controller"

	"github.com/gofiber/fiber/v2"
)

type (
	StickerController struct {
		*decorators.BaseController
		service *service.StickerService
	}
)

func NewStickerController(app *fiber.App, service *service.StickerService) *StickerController {
	controller := &StickerController{
		BaseController: decorators.NewBaseController(app, "/api/stickers"),
		service: service,
	}

	controller.Get("/", controller.GetAllStickers)
	controller.Get("/:id", controller.GetStickerById)
	controller.Post("/", controller.CreateSticker)
	controller.Put("/:id", controller.UpdateSticker)
	controller.Delete("/:id", controller.DeleteSticker)
	controller.SetupRoutes()

	return controller
}

func (c *StickerController) GetAllStickers(ctx *fiber.Ctx) error {
	opts := queries.ParseQueryOptions(ctx)
	
	response, err := c.service.GetAllStickers(ctx.Context(), opts)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(response)
}

func (c *StickerController) GetStickerById(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	
	sticker, err := c.service.GetStickerById(ctx.Context(), id)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}
	
	return ctx.Status(fiber.StatusOK).JSON(sticker)
}

func (c *StickerController) CreateSticker(ctx *fiber.Ctx) error {
	return controllerHelper.ControllerAction(ctx, func(createDto *dto.CreateStickerDto) (any, error) {
		sticker := createDto.ToSticker()
		return c.service.CreateSticker(ctx.Context(), sticker)
	})
}

func (c *StickerController) UpdateSticker(ctx *fiber.Ctx) error {
	return controllerHelper.ControllerAction(ctx, func(updateDto *dto.CreateStickerDto) (any, error) {
		sticker := updateDto.ToSticker()
		return c.service.UpdateSticker(ctx.Context(), ctx.Params("id"), sticker)
	})
}

func (c *StickerController) DeleteSticker(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	
	sticker, err := c.service.DeleteSticker(ctx.Context(), id)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(sticker)
}