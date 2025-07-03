package controller

import (
	"chat/module/chat/model"
	chatutil "chat/module/chat/utils"
	userModel "chat/module/user/model"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"chat/pkg/utils"
	"context"
	"fmt"
	"path/filepath"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	UploadController struct {
		*decorators.BaseController
		uploadHandler *utils.FileUploadHandler
		rbac          middleware.IRBACMiddleware
		chatService   UploadChatService
		userService   UserService
	}

	UploadChatService interface {
		SendMessage(ctx context.Context, msg *model.ChatMessage, broadcastMsg interface{}) error
		GetHub() *chatutil.Hub
		GetUserById(ctx context.Context, userID string) (*userModel.User, error)
		SendNotifications(ctx context.Context, msg *model.ChatMessage, onlineUsers []string) error
	}

	UserService interface {
		GetUserById(ctx context.Context, id string) (*userModel.User, error)
	}
)

func NewUploadController(
	app *fiber.App, 
	rbac middleware.IRBACMiddleware, 
	chatService UploadChatService,
	userService UserService,
) *UploadController {
	c := &UploadController{
		BaseController: decorators.NewBaseController(app, "/api/uploads"),
		uploadHandler:  utils.NewFileUploadHandler(utils.DefaultImageConfig()),
		rbac:           rbac,
		chatService:    chatService,
		userService:    userService,
	}

	c.setupRoutes()
	return c
}

func (c *UploadController) setupRoutes() {
	c.Post("/", c.handleUpload, c.rbac.RequireReadOnlyAccess())
	c.SetupRoutes()
}

func (c *UploadController) handleUpload(ctx *fiber.Ctx) error {
	// Get roomId from form
	roomID := ctx.FormValue("roomId", "")
	if roomID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "roomId is required",
		})
	}

	// Extract userID from JWT token
	userID, err := c.rbac.ExtractUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Invalid authentication token",
		})
	}

	// Convert IDs to ObjectID
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid roomId",
		})
	}

	// Convert userID to ObjectID
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid user ID format",
		})
	}

	// Upload file
	filename, err := c.uploadHandler.HandleFileUpload(ctx, "file")
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Failed to upload file: %v", err),
		})
	}

	filePath := filepath.Join("uploads", filename)

	// Get user info
	user, err := c.userService.GetUserById(ctx.Context(), userID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to get user info",
		})
	}

	// Create message object
	now := time.Now()
	msgID := primitive.NewObjectID()
	msg := &model.ChatMessage{
		ID:        msgID,
		RoomID:    roomObjID,
		UserID:    userObjID,
		Message:   "",
		FileURL:   filePath,
		FileType:  "image",
		FileName:  filename,
		Timestamp: now,
	}

	// Create broadcast message with proper type and file info
	broadcastMsg := map[string]interface{}{
		"type": "upload",
		"payload": map[string]interface{}{
			"room": map[string]interface{}{
				"_id": roomID,
			},
			"user": map[string]interface{}{
				"_id":      userObjID.Hex(),
				"username": user.Username,
				"name": map[string]interface{}{
					"first":  user.Name.First,
					"middle": user.Name.Middle,
					"last":   user.Name.Last,
				},
			},
			"message": map[string]interface{}{
				"_id":       msgID.Hex(),
				"type":      "upload",
				"message":   "",
				"timestamp": now,
			},
			"filename": filename,
			"file": map[string]interface{}{
				"path": filePath,
			},
			"timestamp": now,
		},
		"timestamp": now,
	}

	// Send message
	if err := c.chatService.SendMessage(ctx.Context(), msg, broadcastMsg); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Error sending message",
		})
	}

	// Return success response
	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "File uploaded successfully",
		"data": map[string]interface{}{
			"filename": filename,
			"user":     userObjID.Hex(),
			"room":     roomObjID.Hex(),
		},
	})
}
