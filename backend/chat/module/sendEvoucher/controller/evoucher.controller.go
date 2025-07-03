package controller

import (
	"chat/module/chat/model"
	"chat/module/sendEvoucher/dto"
	"chat/module/sendEvoucher/service"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	EvoucherController struct {
		*decorators.BaseController
		evoucherService *service.EvoucherService
		roomService     EvoucherRoomService
		rbac middleware.IRBACMiddleware
	}

	EvoucherRoomService interface {
		IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
	}
)

func NewEvoucherController(
	app *fiber.App,
	evoucherService *service.EvoucherService,
	roomService EvoucherRoomService,
	rbac middleware.IRBACMiddleware,
) *EvoucherController {
	controller := &EvoucherController{
		BaseController:  decorators.NewBaseController(app, "/api/evouchers"),
		evoucherService: evoucherService,
		roomService:     roomService,
		rbac: rbac,
	}

	controller.setupRoutes()
	return controller
}

func (c *EvoucherController) setupRoutes() {
	c.Post("/send", c.handleSendEvoucher, c.rbac.RequireAdministrator())
	c.Post("/:evoucherId/claim", c.handleClaimEvoucher)
	c.SetupRoutes()
}

func (c *EvoucherController) handleSendEvoucher(ctx *fiber.Ctx) error {
	var evoucherDto dto.SendEvoucherDto
	if err := ctx.BodyParser(&evoucherDto); err != nil {
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

	// Set userID from JWT token
	evoucherDto.UserID = userID

	// Convert IDs to ObjectIDs
	userObjID, roomObjID, err := evoucherDto.ToObjectIDs()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid ID format",
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

	// Create evoucher info
	evoucherInfo := &model.EvoucherInfo{
		Title:       evoucherDto.Title,
		Description: evoucherDto.Description,
		ClaimURL:    evoucherDto.ClaimURL,
	}

	// Send evoucher message
	message, err := c.evoucherService.SendEvoucherMessage(ctx.Context(), userObjID, roomObjID, evoucherInfo)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to send evoucher message",
		})
	}

	// Create response
	responseData := map[string]interface{}{
		"message_id":    message.ID.Hex(),
		"roomId":        message.RoomID.Hex(),
		"userId":        message.UserID.Hex(),
		"message":       message.Message,
		"evoucherInfo":  message.EvoucherInfo,
		"timestamp":     message.Timestamp,
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Evoucher message sent successfully",
		"data":    responseData,
	})
}

func (c *EvoucherController) handleClaimEvoucher(ctx *fiber.Ctx) error {
	evoucherID := ctx.Params("evoucherId")
	
	var claimDto dto.ClaimEvoucherDto
	if err := ctx.BodyParser(&claimDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Validate user exists
	userObjID, err := claimDto.ToObjectID()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid user ID format",
		})
	}

	// Verify user exists
	user, err := c.evoucherService.GetUserById(ctx.Context(), claimDto.UserID)
	if err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "User not found",
		})
	}

	// Here you would typically:
	// 1. Make API call to NestJS backend to claim the evoucher
	// 2. Handle the response
	// 3. Maybe send a notification back to the room about successful claim
	
	// For now, we'll just return a success response
	// In real implementation, you would call your NestJS API here
	
	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Evoucher claim initiated successfully",
		"data": fiber.Map{
			"evoucherId": evoucherID,
			"userId":     userObjID.Hex(),
			"username":   user.Username,
			"claimTime":  time.Now(),
		},
	})
} 