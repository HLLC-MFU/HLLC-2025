// Package: controller/chat_controller.go
package controller

import (
	"chat/module/chat/dto"
	"chat/module/chat/model"
	chatService "chat/module/chat/service"
	"chat/module/chat/utils"
	roomModel "chat/module/room/model"
	stickerModel "chat/module/sticker/model"
	userModel "chat/module/user/model"
	"chat/pkg/core/connection"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"chat/pkg/validator"
	"context"
	"log"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type (
	ChatService interface {
		GetHub() *utils.Hub
		GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error)
		SendMessage(ctx context.Context, msg *model.ChatMessage, metadata interface{}) error
		UnsendMessage(ctx context.Context, messageID, userID primitive.ObjectID) error
		SubscribeToRoom(ctx context.Context, roomID string) error
		UnsubscribeFromRoom(ctx context.Context, roomID string) error
		DeleteRoomMessages(ctx context.Context, roomID string) error
		GetUserById(ctx context.Context, userID string) (*userModel.User, error)
		GetRedis() *redis.Client
		GetMongo() *mongo.Database
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
		CanUserSendMessage(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
		CanUserSendSticker(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
		CanUserSendReaction(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
	}

	StickerService interface {
		GetStickerById(ctx context.Context, stickerID string) (*stickerModel.Sticker, error)
	}

	ChatController struct {
		*decorators.BaseController
		chatService    *chatService.ChatService
		roomService    RoomService
		stickerService StickerService
		wsHandler      *WebSocketHandler
		rbac           middleware.IRBACMiddleware
		connManager    *connection.ConnectionManager
	}
)

func NewChatController(
	app *fiber.App,
	chatService *chatService.ChatService,
	roomService RoomService,
	stickerService StickerService,
	restrictionService RestrictionServiceChatService,
	rbac middleware.IRBACMiddleware,
	connManager *connection.ConnectionManager,
) *ChatController {
	controller := &ChatController{
		BaseController: decorators.NewBaseController(app, "/chat"),
		chatService:    chatService,
		roomService:    roomService,
		stickerService: stickerService,
		rbac:           rbac,
		connManager:    connManager,
	}
	controller.wsHandler = NewWebSocketHandler(
		chatService,
		chatService,
		chatService,
		roomService,
		restrictionService,
		connManager,
	)

	controller.setupRoutes()
	return controller
}

func (c *ChatController) setupRoutes() {
	c.Post("/rooms/:roomId/stickers", c.handleSendSticker)
	c.Post("/rooms/:roomId/reply", c.handleReplyMessage)
	c.Get("/rooms/:roomId/history", c.handleGetChatHistory)
	c.Delete("/rooms/:roomId/messages/:messageId", c.handleUnsendMessage)
	c.Get("/ws/:roomId/:userId", websocket.New(c.wsHandler.HandleWebSocket))

	c.Delete("/rooms/:roomId/cache", c.handleClearCache, c.rbac.RequireAdministrator())
	
	c.SetupRoutes()
}

func (c *ChatController) handleSendSticker(ctx *fiber.Ctx) error {

	// อ่านจาก param
	roomID := ctx.Params("roomId")

	// อ่านจาก body dto
	var stickerDto dto.SendStickerDto
	if err := ctx.BodyParser(&stickerDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Convert room ID from URL to ObjectID
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid room ID",
		})
	}

	// Convert string IDs to ObjectIDs
	stickerObjID, userObjID, err := stickerDto.ToObjectIDs()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid ID format",
		})
	}

	// ตรวจสอบสิทธิ์การส่ง sticker (รวมถึง room type)
	canSend, err := c.roomService.CanUserSendSticker(ctx.Context(), roomObjID, stickerDto.UserID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to check user permissions",
		})
	}
	if !canSend {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "User cannot send stickers in this room (read-only or not a member)",
		})
	}

	// Get sticker details
	sticker, err := c.stickerService.GetStickerById(ctx.Context(), stickerDto.StickerID)
	if err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "Sticker not found",
		})
	}

	// Create message
	msg := &model.ChatMessage{
		RoomID:    roomObjID,
		UserID:    userObjID,
		StickerID: &stickerObjID,
		Image:     sticker.Image,
		Timestamp: time.Now(),
	}
	// Send message
	if err := c.chatService.SendMessage(ctx.Context(), msg, nil); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to send sticker",
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Sticker sent successfully",
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

func (c *ChatController) handleReplyMessage(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	
	var replyDto dto.ReplyMessageDto
	if err := ctx.BodyParser(&replyDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Convert room ID from URL to ObjectID
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid room ID",
		})
	}

	// Convert string IDs to ObjectIDs
	replyToObjID, userObjID, err := replyDto.ToObjectIDs()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid ID format",
		})
	}

	// ตรวจสอบสิทธิ์การส่งข้อความ (รวมถึง room type)
	canSend, err := c.roomService.CanUserSendMessage(ctx.Context(), roomObjID, replyDto.UserID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to check user permissions",
		})
	}
	if !canSend {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "User cannot send messages in this room (read-only or not a member)",
		})
	}

	// Create reply message
	msg := &model.ChatMessage{
		RoomID:    roomObjID,
		UserID:    userObjID,
		Message:   replyDto.Message,
		ReplyToID: &replyToObjID,
		Timestamp: time.Now(),
	}
	// Send message
	if err := c.chatService.SendMessage(ctx.Context(), msg, nil); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to send reply",
		})
	}

	// Create response with message_id
	responseData := map[string]interface{}{
		"message_id": msg.ID.Hex(),
		"roomId":     msg.RoomID.Hex(),
		"userId":     msg.UserID.Hex(),
		"message":    msg.Message,
		"replyToId":  msg.ReplyToID.Hex(),
		"timestamp":  msg.Timestamp,
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Reply sent successfully",
		"data": responseData,
	})
}

func (c *ChatController) handleGetChatHistory(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	
	// Get limit from query parameter (default: 50)
	limit := int64(50)
	if limitStr := ctx.Query("limit"); limitStr != "" {
		parsedLimit, err := strconv.ParseInt(limitStr, 10, 64)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Get chat history (จากใหม่สุดไปเก่าสุด)
	messages, err := c.chatService.GetChatHistoryByRoom(ctx.Context(), roomID, limit)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to get chat history",
		})
	}

	// Log sorting info for debugging
	log.Printf("[API] Retrieved %d messages for room %s (newest first)", len(messages), roomID)
	if len(messages) > 0 {
		log.Printf("[API] First message timestamp: %v, Last message timestamp: %v", 
			messages[0].ChatMessage.Timestamp, 
			messages[len(messages)-1].ChatMessage.Timestamp)
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Chat history retrieved successfully (newest first)",
		"data": messages,
		"meta": fiber.Map{
			"count": len(messages),
			"limit": limit,
			"order": "newest_first", // เพิ่มข้อมูลการเรียงลำดับ
		},
	})
}

func (c *ChatController) handleUnsendMessage(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	messageID := ctx.Params("messageId")
	
	// ใช้ UnsendMessageDto แทนการ parse manual
	var unsendDto dto.UnsendMessageDto
	unsendDto.MessageID = messageID
	
	// Get userID from request body
	if err := ctx.BodyParser(&unsendDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Validate DTO
	if err := validator.ValidateStruct(&unsendDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Validation failed",
		})
	}

	// Convert room ID from URL to ObjectID
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid room ID",
		})
	}

	// Convert IDs using DTO helper
	messageObjID, userObjID, err := unsendDto.ToObjectIDs()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid ID format",
		})
	}

	// ตรวจสอบว่า user เป็นสมาชิกของห้องหรือไม่
	isInRoom, err := c.roomService.IsUserInRoom(ctx.Context(), roomObjID, unsendDto.UserID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to verify room membership",
		})
	}
	if !isInRoom {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "User is not a member of this room",
		})
	}

	// Unsend message (ตรวจสอบความเป็นเจ้าของภายใน service)
	if err := c.chatService.UnsendMessage(ctx.Context(), messageObjID, userObjID); err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": err.Error(), // ส่ง error message กลับไป (เช่น "you can only unsend your own messages")
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Message unsent successfully",
		"data": fiber.Map{
			"messageId": unsendDto.MessageID,
			"userId":    unsendDto.UserID,
			"roomId":    roomID,
		},
	})
}
