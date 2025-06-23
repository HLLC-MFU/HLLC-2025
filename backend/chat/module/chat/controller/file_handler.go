package controller

import (
	"chat/module/chat/model"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type(
	FileHandler struct {
	chatService ChatService
}

FileUploadPayload struct {
	RoomID string `form:"roomId"`
	UserID string `form:"userId"`
}
)

func NewFileHandler(chatService ChatService) *FileHandler {
	return &FileHandler{
		chatService: chatService,
	}
}

func (h *FileHandler) HandleFileUpload(ctx *fiber.Ctx) error {
	var payload FileUploadPayload
	if err := ctx.BodyParser(&payload); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid payload",
		})
	}

	file, err := ctx.FormFile("file")
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "file is required",
		})
	}

	// Validate file type
	ext := strings.ToLower(filepath.Ext(file.Filename))
	fileType := h.getFileType(ext)
	if fileType == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "unsupported file type",
		})
	}

	// Save file
	filename := fmt.Sprintf("%s_%s", time.Now().Format("20060102150405"), file.Filename)
	savePath := fmt.Sprintf("./uploads/%s", filename)
	if err := ctx.SaveFile(file, savePath); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to save file",
		})
	}

	// Create message
	roomID, err := primitive.ObjectIDFromHex(payload.RoomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	userID, err := primitive.ObjectIDFromHex(payload.UserID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	msg := &model.ChatMessage{
		RoomID:    roomID,
		UserID:    userID,
		FileURL:   filename,
		FileName:  file.Filename,
		FileType:  fileType,
		Timestamp: time.Now(),
	}

	if err := h.chatService.SendMessage(ctx.Context(), msg); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to send message",
		})
	}

	return ctx.JSON(msg)
}

func (h *FileHandler) getFileType(ext string) string {
	switch ext {
	case ".jpg", ".jpeg", ".png":
		return "image"
	case ".pdf":
		return "pdf"
	default:
		return ""
	}
} 