package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"

	chatModel "github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/stickers/model"
	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/stickers/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ChatEvent struct {
	EventType string      `json:"eventType"`
	Payload   interface{} `json:"payload"`
}

type StickerHandler struct {
	service service.StickerService
}

func NewStickerHandler(service service.StickerService) *StickerHandler {
	return &StickerHandler{service: service}
}

// broadcastToRoom sends a message to all clients in a room
func (h *StickerHandler) broadcastToRoom(roomID string, message []byte) {
	for userID, conn := range chatModel.Clients[roomID] {
		if wsConn, ok := conn.(*websocket.Conn); ok {
			if err := wsConn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("[ERROR] Failed to send message to user %s: %v", userID, err)
				wsConn.Close()
				delete(chatModel.Clients[roomID], userID)
			}
		}
	}
}

func (h *StickerHandler) CreateSticker(c *fiber.Ctx) error {
	var sticker model.Sticker

	// Parse form data
	name := c.FormValue("name")
	category := c.FormValue("category")

	if name == "" || category == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "name and category are required",
		})
	}

	// Handle file upload
	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "image file is required",
		})
	}

	// Validate file type
	ext := filepath.Ext(file.Filename)
	if ext != ".png" && ext != ".jpg" && ext != ".jpeg" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "only PNG and JPG images are allowed",
		})
	}

	// Create sticker object
	sticker.ID = primitive.NewObjectID()
	sticker.Name = name
	sticker.Category = category
	sticker.CreatedAt = time.Now()
	sticker.UpdatedAt = time.Now()

	// Save file
	savePath := fmt.Sprintf("./uploads/stickers/%s_%s", sticker.ID.Hex(), file.Filename)
	if err := os.MkdirAll("./uploads/stickers", os.ModePerm); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to create upload directory",
		})
	}

	if err := c.SaveFile(file, savePath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to save image",
		})
	}

	sticker.Image = savePath

	if err := h.service.CreateSticker(c.Context(), &sticker); err != nil {
		os.Remove(savePath) // Clean up file if database save fails
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(sticker)
}

func (h *StickerHandler) GetSticker(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid sticker ID",
		})
	}

	sticker, err := h.service.GetSticker(c.Context(), id)
	if err == service.ErrStickerNotFound {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "sticker not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(sticker)
}

func (h *StickerHandler) ListStickers(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
	category := c.Query("category")

	var stickers []*model.Sticker
	var total int64
	var err error

	if category != "" {
		stickers, err = h.service.GetStickersByCategory(c.Context(), category)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		total = int64(len(stickers))
	} else {
		stickers, total, err = h.service.ListStickers(c.Context(), page, limit)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
	}

	return c.JSON(fiber.Map{
		"stickers": stickers,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

func (h *StickerHandler) DeleteSticker(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid sticker ID",
		})
	}

	// Get sticker to get image path
	sticker, err := h.service.GetSticker(c.Context(), id)
	if err == service.ErrStickerNotFound {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "sticker not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Delete from database
	if err := h.service.DeleteSticker(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Delete image file
	if err := os.Remove(sticker.Image); err != nil {
		log.Printf("Failed to delete sticker image %s: %v", sticker.Image, err)
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *StickerHandler) SendSticker(c *fiber.Ctx) error {
	roomId := c.Params("roomId")
	userId := c.FormValue("userId")
	stickerId := c.FormValue("stickerId")

	if userId == "" || stickerId == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "userId and stickerId are required",
		})
	}

	stickerObjID, err := primitive.ObjectIDFromHex(stickerId)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid sticker ID",
		})
	}

	sticker, err := h.service.GetSticker(c.Context(), stickerObjID)
	if err != nil || sticker == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "sticker not found",
		})
	}

	event := ChatEvent{
		EventType: "sticker",
		Payload: map[string]interface{}{
			"userId":    userId,
			"stickerId": sticker.ID.Hex(),
			"image":     sticker.Image,
		},
	}

	// Broadcast the sticker event to the room
	eventJSON, _ := json.Marshal(event)
	h.broadcastToRoom(roomId, eventJSON)

	return c.JSON(fiber.Map{
		"message": "sticker sent successfully",
	})
} 