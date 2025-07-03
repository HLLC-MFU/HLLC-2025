package controller

import (
	"chat/module/chat/dto"
	"chat/module/chat/model"
	chatService "chat/module/chat/service"
	userModel "chat/module/user/model"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	ReactionController struct {
		*decorators.BaseController
		chatService ReactionChatService
		roomService ReactionRoomService
		rbac        middleware.IRBACMiddleware
	}

	ReactionChatService interface {
		HandleReaction(ctx context.Context, reaction *model.MessageReaction) error
		RemoveReaction(ctx context.Context, messageID, userID string) error
		GetUserById(ctx context.Context, userID string) (*userModel.User, error)
	}

	ReactionRoomService interface {
		IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
		CanUserSendReaction(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
	}
)

func NewReactionController(
	app *fiber.App,
	chatService *chatService.ChatService,
	roomService ReactionRoomService,
	rbac middleware.IRBACMiddleware,
) *ReactionController {
	controller := &ReactionController{
		BaseController: decorators.NewBaseController(app, "/chat"),
		chatService:    chatService,
		roomService:    roomService,
		rbac:           rbac,
	}

	controller.setupRoutes()
	return controller
}

func (c *ReactionController) setupRoutes() {
	c.Post("/rooms/:roomId/reactions", c.handleAddReaction)
	c.Delete("/rooms/:roomId/reactions", c.handleRemoveReaction)
	c.SetupRoutes()
}

func (c *ReactionController) handleAddReaction(ctx *fiber.Ctx) error {
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

	// Extract userID from JWT token
	userID, err := c.rbac.ExtractUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Invalid authentication token",
		})
	}
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid user ID format",
		})
	}

	// Convert messageID to ObjectID
	messageObjID, err := primitive.ObjectIDFromHex(reactionDto.MessageID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid message ID format",
		})
	}

	// Check if user is in room
	isInRoom, err := c.roomService.IsUserInRoom(ctx.Context(), roomObjID, userID)
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

	// ตรวจสอบสิทธิ์การส่ง reaction (รวมถึง room type)
	canSend, err := c.roomService.CanUserSendReaction(ctx.Context(), roomObjID, userID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to check user permissions",
		})
	}
	if !canSend {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "User cannot send reactions in this room (read-only or restricted)",
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
	user, err := c.chatService.GetUserById(ctx.Context(), userID)
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

func (c *ReactionController) handleRemoveReaction(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	
	var removeDto dto.RemoveReactionDto
	if err := ctx.BodyParser(&removeDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
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

	// Convert room ID from URL to ObjectID
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid room ID",
		})
	}

	// Convert string IDs to ObjectIDs
	messageObjID, err := primitive.ObjectIDFromHex(removeDto.MessageID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid message ID format",
		})
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid user ID format",
		})
	}

	// Check if user is in room
	isInRoom, err := c.roomService.IsUserInRoom(ctx.Context(), roomObjID, userID)
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
	if err := c.chatService.RemoveReaction(ctx.Context(), removeDto.MessageID, userID); err != nil {
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