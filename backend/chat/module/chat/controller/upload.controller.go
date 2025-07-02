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
	c.Post("/", c.handleUpload)
	c.SetupRoutes()
}

func (c *UploadController) handleUpload(ctx *fiber.Ctx) error {
	// Get roomId and userId from form
	roomID := ctx.FormValue("roomId", "")
	if roomID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "roomId is required",
		})
	}

	userID := ctx.FormValue("userId", "")
	if userID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "userId is required",
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

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid userId",
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
			"filename": filename,
			"file": map[string]interface{}{
				"path":     filePath,
				"type":     "image",
				"filename": filename,
			},
			"message": map[string]interface{}{
				"_id":       msgID.Hex(),
				"message":   "",
				"timestamp": now,
				"type":      "upload",
				"fileUrl":   filePath,
				"fileType":  "image",
				"fileName":  filename,
			},
			"room": map[string]interface{}{
				"_id": roomID,
			},
			"user": map[string]interface{}{
				"_id":      userID,
				"name": map[string]interface{}{
					"first":  user.Name.First,
					"middle": user.Name.Middle,
					"last":   user.Name.Last,
				},
				"role":     map[string]interface{}{"_id": user.Role.Hex()},
				"username": user.Username,
			},
			"timestamp": now,
		},
		"timestamp": now,
	}

	// Get online users in room
	hub := c.chatService.GetHub()
	onlineUsers := hub.GetOnlineUsersInRoom(roomID)

	// Send message
	if err := c.chatService.SendMessage(ctx.Context(), msg, broadcastMsg); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Error sending message",
		})
	}

	// Send notifications to offline users with proper message type
	go c.chatService.SendNotifications(ctx.Context(), msg, onlineUsers)

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
