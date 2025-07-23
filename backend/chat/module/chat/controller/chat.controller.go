// Package: controller/chat_controller.go
package controller

import (
	"chat/module/chat/dto"
	"chat/module/chat/model"
	chatService "chat/module/chat/service"
	"chat/module/chat/utils"
	restrictionService "chat/module/restriction/service"
	roomModel "chat/module/room/room/model"
	stickerModel "chat/module/sticker/model"
	userModel "chat/module/user/model"
	"chat/pkg/core/connection"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	userService "chat/module/user/service"

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
		GetRestrictionService() *restrictionService.RestrictionService
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
		DisconnectAllUsersFromRoom(ctx context.Context, roomID primitive.ObjectID) error
		SetStatusChangeCallback(func(ctx context.Context, roomID string, newStatus string))
	}

	StickerService interface {
		GetStickerById(ctx context.Context, stickerID string) (*stickerModel.Sticker, error)
	}

	ChatController struct {
		*decorators.BaseController
		chatService    *chatService.ChatService
		roomService    RoomService
		stickerService StickerService
		WsHandler      *WebSocketHandler
		rbac           middleware.IRBACMiddleware
		connManager    *connection.ConnectionManager
		roleService    *userService.RoleService
	}
)

func NewChatController(
	app fiber.Router,
	chatService *chatService.ChatService,
	roomService RoomService,
	stickerService StickerService,
	restrictionService RestrictionServiceChatService,
	rbac middleware.IRBACMiddleware,
	connManager *connection.ConnectionManager,
	roleService *userService.RoleService,
	mongo *mongo.Database,
) *ChatController {
	controller := &ChatController{
		BaseController: decorators.NewBaseController(app, ""),
		chatService:    chatService,
		roomService:    roomService,
		stickerService: stickerService,
		rbac:           rbac,
		connManager:    connManager,
		roleService:    roleService,
	}
	controller.WsHandler = NewWebSocketHandler(
		chatService,
		chatService,
		roomService,
		restrictionService,
		connManager,
		roleService,
		rbac,
	)

	controller.setupRoutes()
	return controller
}

func (c *ChatController) setupRoutes() {
	// Add the SetUserRoleInContext middleware to all routes
	c.App.Use(c.rbac.SetUserRoleInContext())
	
	// Add RBAC middleware to WebSocket route
	c.Get("/ws/:roomId", c.rbac.RequireReadOnlyAccess(), websocket.New(c.WsHandler.HandleWebSocket))

	// Add MC WebSocket route with role param filtering
	c.Get("/ws/mc/:roomId", c.rbac.RequireRoleParam(), websocket.New(c.WsHandler.HandleWebSocket))

	c.Post("/rooms/:roomId/stickers", c.handleSendSticker, c.rbac.RequireReadOnlyAccess())
	// **NEW: Cache management endpoints**
	c.Delete("/rooms/:roomId/cache", c.handleClearCache, c.rbac.RequireAdministrator())
	
	c.SetupRoutes()
}

func (c *ChatController) SetupWebSocketHandler() {
	// Set up WebSocket handler with room status change callback
	if roomService, ok := c.roomService.(interface{ SetStatusChangeCallback(func(ctx context.Context, roomID string, newStatus string)) }); ok {
		roomService.SetStatusChangeCallback(c.WsHandler.HandleRoomStatusChange)
		log.Printf("[ChatController] Connected WebSocket handler to room service for status change events")
	} else {
		log.Printf("[ChatController] Warning: Room service does not support status change callbacks")
	}
}

func (c *ChatController) handleSendSticker(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
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
	log.Printf("[Controller] Checking restriction for sticker: userID=%s roomID=%s", userObjID.Hex(), roomObjID.Hex())
	if !c.chatService.GetRestrictionService().CanUserSendMessages(ctx.Context(), userObjID, roomObjID) {
		log.Printf("[Controller] User %s is muted or banned in room %s", userObjID.Hex(), roomObjID.Hex())
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "You are muted or banned in this room",
		})
	}
	log.Printf("[Controller] User %s passed restriction check for sticker in room %s", userObjID.Hex(), roomObjID.Hex())
	// อ่านจาก body dto
	var stickerDto dto.SendStickerDto
	if err := ctx.BodyParser(&stickerDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Convert string IDs to ObjectIDs
	stickerObjID, err := primitive.ObjectIDFromHex(stickerDto.StickerID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid sticker ID format",
		})
	}

	// ตรวจสอบสิทธิ์การส่ง sticker (รวมถึง room type)
	canSend, err := c.roomService.CanUserSendSticker(ctx.Context(), roomObjID, userID)
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

	// Clean up the response data - remove empty message and clean image path
	responseData := map[string]interface{}{
		"id":         msg.ID.Hex(),
		"room_id":    msg.RoomID.Hex(),
		"user_id":    msg.UserID.Hex(),
		"timestamp":  msg.Timestamp,
		"stickerId":  msg.StickerID.Hex(),
		"created_at": msg.CreatedAt,
		"updated_at": msg.UpdatedAt,
	}
	
	// Clean image path by removing any /api/uploads/ prefix and return only filename
	imagePath := msg.Image
	if strings.HasPrefix(imagePath, "/api/uploads/") {
		imagePath = strings.TrimPrefix(imagePath, "/api/uploads/")
	}
	// Also remove any module-specific folders like /stickers/, /users/, etc.
	if idx := strings.Index(imagePath, "/"); idx != -1 {
		imagePath = imagePath[idx+1:]
	}
	responseData["image"] = imagePath

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Sticker sent successfully",
		"data":    responseData,
	})
}



func (c *ChatController) handleClearCache(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	
	// **ENHANCED: Clear cache only, not delete messages**
	if err := c.chatService.GetRedis().Del(ctx.Context(), fmt.Sprintf("chat:room:%s:messages", roomID)).Err(); err != nil {
		log.Printf("[ChatController] Failed to clear cache for room %s: %v", roomID, err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to clear cache",
			"error":   err.Error(),
		})
	}
	
	log.Printf("[ChatController] Successfully cleared cache for room %s", roomID)
	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Cache cleared successfully",
		"data": map[string]interface{}{
			"roomId": roomID,
			"clearedAt": time.Now(),
		},
	})
}


