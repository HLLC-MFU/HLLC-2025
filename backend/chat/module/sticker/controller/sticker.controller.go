package controller

import (
	"chat/module/sticker/dto"
	"chat/module/sticker/service"
	"chat/pkg/common"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"chat/pkg/utils"
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2"
)

type (
	StickerController struct {
		*decorators.BaseController
		service *service.StickerService
		uploadHandler *utils.FileUploadHandler
		rbac middleware.IRBACMiddleware
	}
)

func NewStickerController(app *fiber.App, service *service.StickerService, rbac middleware.IRBACMiddleware) *StickerController {
	c := &StickerController{
		BaseController: decorators.NewBaseController(app, "/api/stickers"),
		service: service,
		uploadHandler: utils.NewFileUploadHandler(utils.DefaultImageConfig()), // Use default config for /uploads
		rbac: rbac,
	}

	c.Get("/", c.GetAllStickers)
	c.Get("/:id", c.GetStickerById)
	c.Post("/", c.CreateSticker, c.rbac.RequireAdministrator())
	c.Patch("/:id", c.UpdateSticker, c.rbac.RequireAdministrator())
	c.Delete("/:id", c.DeleteSticker, c.rbac.RequireAdministrator())
	c.SetupRoutes()

	return c
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
	// Parse multipart form
	if form, err := ctx.MultipartForm(); err == nil {
		defer form.RemoveAll()
	}

	// Upload file
	filename, err := c.uploadHandler.HandleFileUpload(ctx, "image")
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	// Create sticker DTO
	createDto := &dto.CreateStickerDto{
		Name: common.LocalizedName{
			En: ctx.FormValue("name.en"),
			Th: ctx.FormValue("name.th"),
		},
		Image: filename,
	}

	// Create sticker
	sticker := createDto.ToSticker()
	result, err := c.service.CreateSticker(ctx.Context(), sticker)
	if err != nil {
		// Cleanup uploaded file on error
		if err := os.Remove(filename); err != nil {
			fmt.Printf("Failed to delete file: %v\n", err)
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusCreated).JSON(result)
}

func (c *StickerController) UpdateSticker(ctx *fiber.Ctx) error {
    id := ctx.Params("id")

    // ดึงของเดิมจาก DB
    oldSticker, err := c.service.GetStickerById(ctx.Context(), id)
    if err != nil {
        return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "success": false,
            "message": "Sticker not found",
        })
    }

    // Parse multipart form
    if form, err := ctx.MultipartForm(); err == nil {
        defer form.RemoveAll()
    }

    // Handle file upload (optional)
    filename, err := c.uploadHandler.HandleFileUpload(ctx, "image")
    if err != nil && err.Error() != "no file uploaded" {
        return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "success": false,
            "message": err.Error(),
        })
    }

    // Merge field ใหม่กับของเดิม
    nameEn := ctx.FormValue("name.en")
    nameTh := ctx.FormValue("name.th")
    newName := oldSticker.Name
    if nameEn != "" {
        newName.En = nameEn
    }
    if nameTh != "" {
        newName.Th = nameTh
    }

    newImage := oldSticker.Image
    if filename != "" {
        newImage = filename
    }

    updateDto := &dto.CreateStickerDto{
        Name:  newName,
        Image: newImage,
    }

    sticker := updateDto.ToSticker()
    result, err := c.service.UpdateSticker(ctx.Context(), id, sticker)
    if err != nil {
        return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "success": false,
            "message": err.Error(),
        })
    }

    return ctx.Status(fiber.StatusOK).JSON(result)
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