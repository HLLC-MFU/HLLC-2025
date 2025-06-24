// Package: controller/chat_controller.go
package controller

import (
	"chat/module/chat/model"
	chatService "chat/module/chat/service"
	"chat/module/chat/utils"
	roomModel "chat/module/room/model"
	stickerModel "chat/module/sticker/model"
	"chat/pkg/decorators"
	controllerHelper "chat/pkg/helpers/controller"
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	ChatService interface {
		GetHub() *utils.Hub
		GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error)
		SendMessage(ctx context.Context, msg *model.ChatMessage) error
		HandleReaction(ctx context.Context, reaction *model.MessageReaction) error
		SubscribeToRoom(ctx context.Context, roomID string) error
		UnsubscribeFromRoom(ctx context.Context, roomID string) error
		DeleteRoomMessages(ctx context.Context, roomID string) error
	}

	RoomService interface {
		GetRoomById(ctx context.Context, roomID primitive.ObjectID) (*roomModel.Room, error)
		GetActiveConnectionsCount(ctx context.Context, roomID primitive.ObjectID) (int64, error)
		ValidateAndTrackConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error
		RemoveConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error
		GetRoomStatus(ctx context.Context, roomID primitive.ObjectID) (map[string]interface{}, error)
		IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
		AddUserToRoom(ctx context.Context, roomID, userID string) error
		RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (*roomModel.Room, error)
	}

	StickerService interface {
		GetStickerById(ctx context.Context, stickerID string) (*stickerModel.Sticker, error)
	}

	ChatController struct {
		*decorators.BaseController
		chatService    *chatService.ChatService
		roomService    RoomService
		stickerService StickerService
		wsHandler     *WebSocketHandler
	}
)

func NewChatController(
	app *fiber.App,
	chatService *chatService.ChatService,
	roomService RoomService,
	stickerService StickerService,
) *ChatController {
	controller := &ChatController{
		BaseController: decorators.NewBaseController(app, "/chat"),
		chatService:    chatService,
		roomService:    roomService,
		stickerService: stickerService,
	}

	controller.wsHandler = NewWebSocketHandler(chatService, roomService)

	controller.setupRoutes()
	return controller
}

func (c *ChatController) setupRoutes() {
	c.Get("/ws/:roomId/:userId", websocket.New(c.wsHandler.HandleWebSocket))
	c.Post("/rooms/:roomId/join", c.handleJoinRoom)
	c.Post("/rooms/:roomId/leave", c.handleLeaveRoom)
	c.Get("/:roomId/send", c.handleSendSticker)
	c.Delete("/rooms/:roomId/cache", c.handleClearCache)

	c.SetupRoutes()
}

func (c *ChatController) handleJoinRoom(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	userID := controllerHelper.GetUserID(ctx)

	if err := c.roomService.AddUserToRoom(ctx.Context(), roomID, userID.Hex()); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to join room",
		})
	}

	return ctx.JSON(fiber.Map{
		"message": "joined room successfully",
	})
}

func (c *ChatController) handleLeaveRoom(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	userID := controllerHelper.GetUserID(ctx)

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	if _, err := c.roomService.RemoveUserFromRoom(ctx.Context(), roomObjID, userID.Hex()); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to leave room",
		})
	}

	return ctx.JSON(fiber.Map{
		"message": "left room successfully",
	})
}

func (c *ChatController) handleSendSticker(ctx *fiber.Ctx) error {
	// Get parameters
	roomID := ctx.Params("roomId")
	senderID := ctx.Query("userId")     // User sending the sticker
	stickerID := ctx.Query("stickerId") // Sticker to send

	// Validate parameters
	if senderID == "" || stickerID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "userId and stickerId are required",
		})
	}

	// Convert IDs
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	senderObjID, err := primitive.ObjectIDFromHex(senderID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	// Check if sender is in room
	isInRoom, err := c.roomService.IsUserInRoom(ctx.Context(), roomObjID, senderID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to check user room membership",
		})
	}
	if !isInRoom {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "user is not in the room",
		})
	}

	// Get sticker details
	sticker, err := c.stickerService.GetStickerById(ctx.Context(), stickerID)
	if err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "sticker not found",
		})
	}

	// Create message
	msg := &model.ChatMessage{
		RoomID:    roomObjID,
		UserID:    senderObjID,
		StickerID: &sticker.ID,
		Image:     sticker.Image,
		Timestamp: time.Now(),
	}

	// Send message
	if err := c.chatService.SendMessage(ctx.Context(), msg); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to send sticker",
		})
	}

	return ctx.JSON(fiber.Map{
		"message": "sticker sent successfully",
		"data": msg,
	})
}

func (c *ChatController) handleClearCache(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	if err := c.chatService.DeleteRoomMessages(ctx.Context(), roomID); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to clear cache",
		})
	}
	return ctx.JSON(fiber.Map{
		"message": "cache cleared successfully",
	})
}