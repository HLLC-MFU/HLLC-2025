package controller

import (
	"chat/module/chat/model"
	"chat/module/sendEvoucher/dto"
	"chat/module/sendEvoucher/service"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"context"
	"fmt"
	"log"
	"strings"

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
	c.Post("/send", c.handleSendEvoucher, c.rbac.RequireWritePermissionForEvoucher())
	c.Post("/claimEvoucherInChat", c.handleClaimEvoucherInChat, c.rbac.RequireAnyRole())
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

	// Check if user is admin or AE - if so, skip room membership check
	userRole, err := c.rbac.GetUserRole(userID)
	if err != nil {
		log.Printf("[EvoucherController] Failed to get user role: %v", err)
		// Continue with room membership check if role extraction fails
	} else if userRole == "Administrator" || userRole == "AE" {
		log.Printf("[EvoucherController] %s user %s sending evoucher to room %s - skipping room membership check", 
			userRole, userID, roomObjID.Hex())
	} else {
		// Check if user is in room (only for non-admin/non-AE users)
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
	}

	// Create evoucher info
	evoucherInfo := &model.EvoucherInfo{
		Title:       evoucherDto.Title,
		Description: evoucherDto.Description,
		ClaimURL:    evoucherDto.ClaimURL,
	}

	// Send evoucher message (this will broadcast to WebSocket)
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

func (c *EvoucherController) handleClaimEvoucherInChat(ctx *fiber.Ctx) error {
	var claimDto dto.ClaimEvoucherInChatDto
	if err := ctx.BodyParser(&claimDto); err != nil {
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

	// Extract JWT token for NestJS API
	jwtToken, err := c.extractJWTToken(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Failed to extract JWT token",
		})
	}

	// Extract evoucherId from claimUrl
	evoucherId, err := c.extractEvoucherIdFromUrl(claimDto.ClaimURL)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid claim URL format",
		})
	}

	// Check if user already claimed this evoucher
	alreadyClaimed, err := c.evoucherService.CheckIfUserClaimedEvoucher(ctx.Context(), userID, evoucherId)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to check evoucher claim status",
		})
	}

	if alreadyClaimed {
		return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
			"success": false,
			"message": "You have already claimed this evoucher",
		})
	}

	// Claim evoucher through NestJS API
	claimResult, err := c.evoucherService.ClaimEvoucherThroughNestJS(ctx.Context(), userID, evoucherId, claimDto.ClaimURL, jwtToken)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to claim evoucher: " + err.Error(),
		})
	}

	// Store claim record in Go DB
	err = c.evoucherService.StoreEvoucherClaim(ctx.Context(), userID, evoucherId)
	if err != nil {
		log.Printf("[EvoucherController] Failed to store evoucher claim in Go DB: %v", err)
		// Don't return error here as the claim was successful in NestJS
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Evoucher claimed successfully",
		"data":    claimResult,
	})
}

// extractEvoucherIdFromUrl extracts evoucherId from URL like "http://localhost:8080/api/evouchers/685f814f4618c3a7591dd048/claim"
func (c *EvoucherController) extractEvoucherIdFromUrl(claimURL string) (string, error) {
	// Split by "/" and get the evoucherId part
	parts := strings.Split(claimURL, "/")
	if len(parts) < 6 {
		return "", fmt.Errorf("invalid claim URL format")
	}
	
	// The evoucherId should be the second to last part
	evoucherId := parts[len(parts)-2]
	
	// Validate that it's a valid ObjectID format
	if len(evoucherId) != 24 {
		return "", fmt.Errorf("invalid evoucher ID format")
	}
	
	return evoucherId, nil
}

// extractJWTToken extracts JWT token from request headers or cookies
func (c *EvoucherController) extractJWTToken(ctx *fiber.Ctx) (string, error) {
	// Try Authorization header first
	authHeader := ctx.Get("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
			return parts[1], nil
		}
	}
	
	// Try cookie as fallback
	token := ctx.Cookies("accessToken")
	if token != "" {
		return token, nil
	}
	
	return "", fmt.Errorf("no JWT token found")
}