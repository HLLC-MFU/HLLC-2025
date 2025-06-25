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
	"chat/pkg/decorators"
	controllerHelper "chat/pkg/helpers/controller"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
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
		RemoveReaction(ctx context.Context, messageID, userID string) error
		SubscribeToRoom(ctx context.Context, roomID string) error
		UnsubscribeFromRoom(ctx context.Context, roomID string) error
		DeleteRoomMessages(ctx context.Context, roomID string) error
		GetUserById(ctx context.Context, userID string) (*userModel.User, error)
		GetMessageReactions(ctx context.Context, roomID, messageID string) ([]model.MessageReaction, error)
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
		wsHandler      *WebSocketHandler
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
	c.Post("/rooms/:roomId/stickers", c.handleSendSticker)
	c.Delete("/rooms/:roomId/cache", c.handleClearCache)

	// Reply and Reaction endpoints
	c.Post("/rooms/:roomId/reply", c.handleReplyMessage)
	c.Post("/rooms/:roomId/reactions", c.handleAddReaction)
	c.Delete("/rooms/:roomId/reactions", c.handleRemoveReaction)
	c.Get("/rooms/:roomId/history", c.handleGetChatHistory)

	c.SetupRoutes()
}

func (c *ChatController) handleJoinRoom(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	userID := controllerHelper.GetUserID(ctx)

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	if err := c.roomService.AddUserToRoom(ctx.Context(), roomID, userID.Hex()); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to join room",
		})
	}

	// Emit user joined event with proper structure
	if err := c.emitUserJoinedEvent(ctx.Context(), roomObjID, userID); err != nil {
		log.Printf("[WARN] Failed to emit user joined event: %v", err)
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

	// Emit user left event with proper structure
	if err := c.emitUserLeftEvent(ctx.Context(), roomObjID, userID); err != nil {
		log.Printf("[WARN] Failed to emit user left event: %v", err)
	}

	return ctx.JSON(fiber.Map{
		"message": "left room successfully",
	})
}

func (c *ChatController) handleSendSticker(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	
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

	// Check if sender is in room
	isInRoom, err := c.roomService.IsUserInRoom(ctx.Context(), roomObjID, stickerDto.UserID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to check user room membership",
		})
	}
	if !isInRoom {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "User is not a member of this room",
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
	if err := c.chatService.SendMessage(ctx.Context(), msg); err != nil {
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

	// Check if user is in room
	isInRoom, err := c.roomService.IsUserInRoom(ctx.Context(), roomObjID, replyDto.UserID)
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

	// Create reply message
	msg := &model.ChatMessage{
		RoomID:    roomObjID,
		UserID:    userObjID,
		Message:   replyDto.Message,
		ReplyToID: &replyToObjID,
		Timestamp: time.Now(),
	}

	// Send message
	if err := c.chatService.SendMessage(ctx.Context(), msg); err != nil {
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

func (c *ChatController) handleAddReaction(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	
	var reactionDto dto.AddReactionDto
	if err := ctx.BodyParser(&reactionDto); err != nil {
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
	messageObjID, userObjID, err := reactionDto.ToObjectIDs()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid ID format",
		})
	}

	// Check if user is in room
	isInRoom, err := c.roomService.IsUserInRoom(ctx.Context(), roomObjID, reactionDto.UserID)
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

	// Create reaction
	reaction := &model.MessageReaction{
		MessageID: messageObjID,
		UserID:    userObjID,
		Reaction:  reactionDto.Reaction,
		Timestamp: time.Now(),
	}

	// Add reaction
	if err := c.chatService.HandleReaction(ctx.Context(), reaction); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to add reaction",
		})
	}

	// Get populated user data for response
	user, err := c.chatService.GetUserById(ctx.Context(), reactionDto.UserID)
	if err == nil {
		return ctx.JSON(fiber.Map{
			"success": true,
			"message": "Reaction added successfully",
			"data": map[string]interface{}{
				"message_id": reaction.MessageID.Hex(),
				"user": map[string]interface{}{
					"_id":      user.ID.Hex(),
					"username": user.Username,
					"name":     user.Name,
				},
				"reaction":  reaction.Reaction,
				"timestamp": reaction.Timestamp,
			},
		})
	}

	// Fallback to basic reaction data
	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Reaction added successfully",
		"data": map[string]interface{}{
			"message_id": reaction.MessageID.Hex(),
			"userId":     reaction.UserID.Hex(),
			"reaction":   reaction.Reaction,
			"timestamp":  reaction.Timestamp,
		},
	})
}

func (c *ChatController) handleRemoveReaction(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	
	var removeDto dto.RemoveReactionDto
	if err := ctx.BodyParser(&removeDto); err != nil {
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
	messageObjID, userObjID, err := removeDto.ToObjectIDs()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid ID format",
		})
	}

	// Check if user is in room
	isInRoom, err := c.roomService.IsUserInRoom(ctx.Context(), roomObjID, removeDto.UserID)
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

	// Remove reaction
	if err := c.chatService.RemoveReaction(ctx.Context(), removeDto.MessageID, removeDto.UserID); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to remove reaction",
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Reaction removed successfully",
		"data": map[string]interface{}{
			"message_id": messageObjID.Hex(),
			"userId":     userObjID.Hex(),
		},
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

	// Get chat history
	messages, err := c.chatService.GetChatHistoryByRoom(ctx.Context(), roomID, limit)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to get chat history",
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Chat history retrieved successfully",
		"data": messages,
		"meta": fiber.Map{
			"count": len(messages),
			"limit": limit,
		},
	})
}

// Helper methods for emitting user events

func (c *ChatController) emitUserJoinedEvent(ctx context.Context, roomID primitive.ObjectID, userID primitive.ObjectID) error {
	// Create user joined event structure as requested
	event := model.Event{
		Type:      model.EventTypeUserJoined,
		Payload:   map[string]string{
			"roomId": roomID.Hex(),
			"userId": userID.Hex(),
		},
		Timestamp: time.Now(),
	}

	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal user joined event: %w", err)
	}

	// Broadcast to WebSocket clients
	c.chatService.GetHub().BroadcastToRoom(roomID.Hex(), eventBytes)

	return nil
}

func (c *ChatController) emitUserLeftEvent(ctx context.Context, roomID primitive.ObjectID, userID primitive.ObjectID) error {
	// Create user left event structure as requested
	event := model.Event{
		Type:      model.EventTypeUserLeft,
		Payload:   map[string]string{
			"roomId": roomID.Hex(),
			"userId": userID.Hex(),
		},
		Timestamp: time.Now(),
	}

	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal user left event: %w", err)
	}

	// Broadcast to WebSocket clients
	c.chatService.GetHub().BroadcastToRoom(roomID.Hex(), eventBytes)

	return nil
}

