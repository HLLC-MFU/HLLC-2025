package handler

import (
	"fmt"
	"strconv"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/service"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type StickerHTTPHandler struct {
	service service.StickerService
}

func NewHTTPHandler(service service.StickerService) *StickerHTTPHandler {
	return &StickerHTTPHandler{
		service: service,
	}
}

type createStickerRequest struct {
	Name struct {
		ThName string `json:"thName" form:"name[th]"`
		EnName string `json:"enName" form:"name[en]"`
	} `json:"name"`
	Image string `json:"image,omitempty"`
}

func (h *StickerHTTPHandler) CreateSticker(c *fiber.Ctx) error {
	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "image is required"})
	}

	// ✅ Save image
	filename := fmt.Sprintf("sticker_%d_%s", time.Now().Unix(), file.Filename)
	savePath := fmt.Sprintf("./uploads/stickers/%s", filename)
	if err := c.SaveFile(file, savePath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save file"})
	}

	// ✅ Generate public URL for image
	imageURL := fmt.Sprintf("%s/uploads/stickers/%s", c.BaseURL(), filename)

	// ✅ Extract and bind manually
	thName := c.FormValue("name[th]")
	enName := c.FormValue("name[en]")

	// ✅ Create sticker struct
	sticker := &model.Sticker{
		ID: primitive.NewObjectID(),
		Name: coreModel.LocalizedName{
			Th: thName,
			En: enName,
		},
		Image: imageURL,
	}

	if err := h.service.CreateSticker(c.Context(), sticker); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(sticker)
}

func (h *StickerHTTPHandler) GetSticker(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid sticker ID",
		})
	}

	sticker, err := h.service.GetSticker(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	if sticker == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "sticker not found",
		})
	}

	return c.JSON(sticker)
}

func (h *StickerHTTPHandler) ListStickers(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)

	stickers, total, err := h.service.ListStickers(c.Context(), page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"stickers": stickers,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

func (h *StickerHTTPHandler) UpdateSticker(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid sticker ID",
		})
	}

	// ✅ Get existing sticker to preserve current image
	existing, err := h.service.GetSticker(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to fetch sticker",
		})
	}
	if existing == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "sticker not found",
		})
	}

	// ✅ Extract new form values
	thName := c.FormValue("name[th]")
	enName := c.FormValue("name[en]")
	image := existing.Image // default to existing image

	// ✅ Check if a new file is uploaded
	file, err := c.FormFile("image")
	if err == nil && file != nil {
		filename := fmt.Sprintf("sticker_%d_%s", time.Now().Unix(), file.Filename)
		savePath := fmt.Sprintf("./uploads/stickers/%s", filename)
		if saveErr := c.SaveFile(file, savePath); saveErr == nil {
			image = fmt.Sprintf("%s/files/stickers/%s", c.BaseURL(), filename)
		} else {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to save file",
			})
		}
	}

	// ✅ Create updated sticker object
	sticker := &model.Sticker{
		ID: id,
		Name: coreModel.LocalizedName{
			Th: thName,
			En: enName,
		},
		Image: image,
	}

	// ✅ Update in database
	if err := h.service.UpdateSticker(c.Context(), sticker); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(sticker)
}

func (h *StickerHTTPHandler) DeleteSticker(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid sticker ID",
		})
	}

	if err := h.service.DeleteSticker(c.Context(), id); err != nil {
		if err == service.ErrStickerNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
