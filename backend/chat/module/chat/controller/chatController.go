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
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Service interfaces
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

	MemberService interface {
		IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
		AddUserToRoom(ctx context.Context, roomID, userID string) error
		RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (*roomModel.Room, error)
	}

	StickerService interface {
		GetStickerById(ctx context.Context, stickerID string) (*stickerModel.Sticker, error)
	}

	RoomService interface {
		GetRoomById(ctx context.Context, roomID primitive.ObjectID) (*roomModel.Room, error)
		GetActiveConnectionsCount(ctx context.Context, roomID primitive.ObjectID) (int64, error)
		ValidateAndTrackConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error
		RemoveConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error
		GetRoomStatus(ctx context.Context, roomID primitive.ObjectID) (map[string]interface{}, error)
	}

	ChatController struct {
		*decorators.BaseController
		chatService    *chatService.ChatService
		memberService  MemberService
		stickerService StickerService
		roomService    RoomService
		wsHandler     *WebSocketHandler
		fileHandler   *FileHandler
	}
)

func NewChatController(
	app *fiber.App,
	chatService *chatService.ChatService,
	memberService MemberService,
	stickerService StickerService,
	roomService RoomService,
) *ChatController {
	controller := &ChatController{
		BaseController: decorators.NewBaseController(app, "/chat"),
		chatService:    chatService,
		memberService:  memberService,
		stickerService: stickerService,
		roomService:    roomService,
	}

	// Initialize handlers
	controller.wsHandler = NewWebSocketHandler(chatService, memberService, roomService)
	controller.fileHandler = NewFileHandler(chatService)

	controller.setupRoutes()
	return controller
}

func (c *ChatController) setupRoutes() {
	// WebSocket routes
	c.Get("/ws/:roomId/:userId", websocket.New(c.wsHandler.HandleWebSocket))
	
	// File routes
	c.Post("/upload", c.fileHandler.HandleFileUpload)
	
	// Room routes
	c.Post("/rooms/:roomId/join", c.handleJoinRoom)
	c.Post("/rooms/:roomId/leave", c.handleLeaveRoom)
	c.Post("/rooms/:roomId/sticker", c.handleSendSticker)
	c.Delete("/rooms/:roomId/cache", c.handleClearCache)

	c.SetupRoutes()
}

func (c *ChatController) handleJoinRoom(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	userID := controllerHelper.GetUserID(ctx)

	if err := c.memberService.AddUserToRoom(ctx.Context(), roomID, userID.Hex()); err != nil {
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

	if _, err := c.memberService.RemoveUserFromRoom(ctx.Context(), roomObjID, userID.Hex()); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to leave room",
		})
	}

	return ctx.JSON(fiber.Map{
		"message": "left room successfully",
	})
}

type StickerPayload struct {
	StickerID string `query:"stickerId"`
}

func (c *ChatController) handleSendSticker(ctx *fiber.Ctx) error {
	var payload StickerPayload
	return controllerHelper.Handle(ctx, &payload, func() (any, error) {
		roomID := ctx.Params("roomId")
		userID := controllerHelper.GetUserID(ctx)

		sticker, err := c.stickerService.GetStickerById(ctx.Context(), payload.StickerID)
		if err != nil {
			return nil, fmt.Errorf("sticker not found")
		}

		roomObjID, err := primitive.ObjectIDFromHex(roomID)
		if err != nil {
			return nil, fmt.Errorf("invalid room ID")
		}

		msg := &model.ChatMessage{
			RoomID:    roomObjID,
			UserID:    userID,
			StickerID: &sticker.ID,
			Image:     sticker.Image,
			Timestamp: time.Now(),
		}

		if err := c.chatService.SendMessage(ctx.Context(), msg); err != nil {
			return nil, err
		}

		return msg, nil
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

// Helper methods for WebSocket message handling
// func (c *ChatController) handleReplyMessage(messageText string, client model.ClientObject) {
// 	parts := strings.SplitN(messageText, " ", 3)
// 	if len(parts) < 3 {
// 		return
// 	}

// 	replyToID, err := primitive.ObjectIDFromHex(parts[1])
// 	if err != nil {
// 		return
// 	}

// 	msg := &model.ChatMessage{
// 		RoomID:    client.RoomID,
// 		UserID:    client.UserID,
// 		Message:   parts[2],
// 		ReplyToID: &replyToID,
// 		Timestamp: time.Now(),
// 	}

// 	// Send reply message through single channel
// 	if err := c.chatService.SendMessage(context.Background(), msg); err != nil {
// 		log.Printf("[ERROR] Failed to send reply message: %v", err)
// 	}
// }

// func (c *ChatController) handleReactionMessage(messageText string, client model.ClientObject) {
// 	parts := strings.Split(messageText, " ")
// 	if len(parts) != 3 {
// 		return
// 	}

// 	messageID, err := primitive.ObjectIDFromHex(parts[1])
// 	if err != nil {
// 		return
// 	}

// 	reaction := &model.MessageReaction{
// 		MessageID: messageID,
// 		UserID:    client.UserID,
// 		Reaction:  parts[2],
// 		Timestamp: time.Now(),
// 	}

// 	if err := c.chatService.HandleReaction(context.Background(), reaction); err != nil {
// 		log.Printf("[ERROR] Failed to handle reaction: %v", err)
// 	}
// }

// func (c *ChatController) handleLeaveMessage(ctx context.Context, messageText string, client model.ClientObject) {
// 	if _, err := c.memberService.RemoveUserFromRoom(ctx, client.RoomID, client.UserID.Hex()); err != nil {
// 		log.Printf("[ERROR] Failed to remove user from room: %v", err)
// 	}
// }

// func (c *ChatController) getFileType(ext string) string {
// 	switch ext {
// 	case ".jpg", ".jpeg", ".png":
// 		return "image"
// 	case ".pdf":
// 		return "pdf"
// 	default:
// 		return ""
// 	}
// }
