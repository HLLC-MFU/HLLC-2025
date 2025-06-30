package controller

import (
	"chat/module/chat/dto"
	"chat/module/chat/model"
	chatService "chat/module/chat/service"
	"chat/pkg/decorators"
	"context"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	MentionController struct {
		*decorators.BaseController
		chatService MentionChatService
		roomService MentionRoomService
	}

	MentionChatService interface {
		SendMentionMessage(ctx context.Context, userID, roomID primitive.ObjectID, message string) (*model.ChatMessage, error)
		GetMentionsForUser(ctx context.Context, userID string, limit int64) ([]model.ChatMessageEnriched, error)
	}

	MentionRoomService interface {
		IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
		CanUserSendMessage(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
	}
)

func NewMentionController(
	app *fiber.App,
	chatService *chatService.ChatService,
	roomService MentionRoomService,
) *MentionController {
	controller := &MentionController{
		BaseController: decorators.NewBaseController(app, "/chat"),
		chatService:    chatService,
		roomService:    roomService,
	}

	controller.setupRoutes()
	return controller
}

func (c *MentionController) setupRoutes() {
	c.Post("/rooms/:roomId/mentions", c.handleSendMention)
	c.Get("/users/:userId/mentions", c.handleGetUserMentions)
	c.SetupRoutes()
}

func (c *MentionController) handleSendMention(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	
	var mentionDto dto.MentionMessageDto
	if err := ctx.BodyParser(&mentionDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Set roomID from URL parameter
	mentionDto.RoomID = roomID

	// Convert IDs to ObjectIDs
	userObjID, roomObjID, _, err := mentionDto.ToObjectIDs()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid ID format",
		})
	}

	// Check if user is in room
	isInRoom, err := c.roomService.IsUserInRoom(ctx.Context(), roomObjID, mentionDto.UserID)
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

	// ตรวจสอบสิทธิ์การส่งข้อความ (รวมถึง room type)
	canSend, err := c.roomService.CanUserSendMessage(ctx.Context(), roomObjID, mentionDto.UserID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to check user permissions",
		})
	}
	if !canSend {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "User cannot send messages in this room (read-only or restricted)",
		})
	}

	// Send mention message
	message, err := c.chatService.SendMentionMessage(ctx.Context(), userObjID, roomObjID, mentionDto.Message)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to send mention message",
		})
	}

	// Create response
	responseData := map[string]interface{}{
		"message_id": message.ID.Hex(),
		"roomId":     message.RoomID.Hex(),
		"userId":     message.UserID.Hex(),
		"message":    message.Message,
		"mentions":   message.Mentions,
		"mentionInfo": message.MentionInfo,
		"timestamp":  message.Timestamp,
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Mention message sent successfully",
		"data": responseData,
	})
}

func (c *MentionController) handleGetUserMentions(ctx *fiber.Ctx) error {
	userID := ctx.Params("userId")
	
	// Get limit from query parameter (default: 20)
	limit := int64(20)
	if limitStr := ctx.Query("limit"); limitStr != "" {
		parsedLimit, err := strconv.ParseInt(limitStr, 10, 64)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Get mentions for user
	mentions, err := c.chatService.GetMentionsForUser(ctx.Context(), userID, limit)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to get user mentions",
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "User mentions retrieved successfully",
		"data": mentions,
		"meta": fiber.Map{
			"count": len(mentions),
			"limit": limit,
		},
	})
} 