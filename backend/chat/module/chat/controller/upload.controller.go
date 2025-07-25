package controller

import (
	"chat/module/chat/model"
	chatutil "chat/module/chat/utils"
	restrictionService "chat/module/restriction/service"
	userModel "chat/module/user/model"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"chat/pkg/utils"
	"context"
	"fmt"
	"log"
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
		GetRestrictionService() *restrictionService.RestrictionService
	}

	UserService interface {
		GetUserById(ctx context.Context, id string) (*userModel.User, error)
	}
)

func NewUploadController(
	app fiber.Router, 
	rbac middleware.IRBACMiddleware, 
	chatService UploadChatService,
	userService UserService,
) *UploadController {
	c := &UploadController{
		BaseController: decorators.NewBaseController(app, ""),
		uploadHandler:  utils.NewFileUploadHandler(utils.DefaultImageConfig()),
		rbac:           rbac,
		chatService:    chatService,
		userService:    userService,
	}

	c.setupRoutes()
	return c
}

func (c *UploadController) setupRoutes() {
	c.Post("/", c.handleUpload, c.rbac.RequireAnyRole())
	c.SetupRoutes()
}

func (c *UploadController) handleUpload(ctx *fiber.Ctx) error {
	roomID := ctx.FormValue("roomId", "")
	if roomID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "roomId is required",
		})
	}
	userID, err := c.rbac.ExtractUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Invalid authentication token",
		})
	}
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid room ID",
		})
	}
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid user ID format",
		})
	}
	log.Printf("[Controller] Checking restriction for upload: userID=%s roomID=%s", userObjID.Hex(), roomObjID.Hex())
	if !c.chatService.GetRestrictionService().CanUserSendMessages(ctx.Context(), userObjID, roomObjID) {
		log.Printf("[Controller] User %s is muted or banned in room %s", userObjID.Hex(), roomObjID.Hex())
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "You are muted or banned in this room",
		})
	}
	log.Printf("[Controller] User %s passed restriction check for upload in room %s", userObjID.Hex(), roomObjID.Hex())
	// Upload file
	filename, err := c.uploadHandler.HandleFileUpload(ctx, "file")
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": fmt.Sprintf("Failed to upload file: %v", err),
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
		Image:     filename,
		Timestamp: now,
	}

	// Send message (broadcastMsg = nil, emitter will build correct payload)
	if err := c.chatService.SendMessage(ctx.Context(), msg, nil); err != nil {
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
