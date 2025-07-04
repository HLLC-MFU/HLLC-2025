// Package: controller/chat_controller.go
package controller

import (
	"chat/module/chat/model"
	chatService "chat/module/chat/service"
	"chat/module/chat/utils"
	restrictionService "chat/module/restriction/service"
	roomModel "chat/module/room/model"
	stickerModel "chat/module/sticker/model"
	userModel "chat/module/user/model"
	"chat/pkg/core/connection"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"context"

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
		roleService    *userService.RoleService
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
	roleService *userService.RoleService,
) *ChatController {
	controller := &ChatController{
		BaseController: decorators.NewBaseController(app, "/chat"),
		chatService:    chatService,
		roomService:    roomService,
		stickerService: stickerService,
		rbac:           rbac,
		connManager:    connManager,
		roleService:    roleService,
	}
	controller.wsHandler = NewWebSocketHandler(
		chatService,
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
	c.Get("/ws/:roomId", c.rbac.RequireReadOnlyAccess(), websocket.New(c.wsHandler.HandleWebSocket))

	c.Delete("/rooms/:roomId/cache", c.handleClearCache, c.rbac.RequireAdministrator())
	
	c.SetupRoutes()
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
