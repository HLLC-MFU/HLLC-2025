package controller

import (
	restrictionDto "chat/module/restriction/dto"
	restrictionService "chat/module/restriction/service"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	RestrictionController struct {
		*decorators.BaseController
		moderationService *restrictionService.RestrictionService
	}
)

func NewModerationController(
	app *fiber.App,
	moderationService *restrictionService.RestrictionService,
) *RestrictionController {
	controller := &RestrictionController{
		BaseController:    decorators.NewBaseController(app, "/api/restriction"),
		moderationService: moderationService,
	}

	controller.setupRoutes()
	return controller
}

func (c *RestrictionController) setupRoutes() {
	// Ban operations
	c.Post("/ban", c.handleBanUser)
	c.Post("/unban", c.handleUnbanUser)
	
	// Mute operations
	c.Post("/mute", c.handleMuteUser)
	c.Post("/unmute", c.handleUnmuteUser)
	
	// Kick operation
	c.Post("/kick", c.handleKickUser)
	
	// Status and history
	c.Get("/status/:roomId/:userId", c.handleGetModerationStatus)
	c.Get("/history", c.handleGetModerationHistory)
	
	c.SetupRoutes()
}

// handleBanUser บัน user
func (c *RestrictionController) handleBanUser(ctx *fiber.Ctx) error {
	var banDto restrictionDto.BanUserDto
	if err := ctx.BodyParser(&banDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Validate DTO
	if err := banDto.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Validation failed",
			"error":   err.Error(),
		})
	}

	// Convert string IDs to ObjectIDs
	userObjID, roomObjID, moderatorObjID, err := banDto.ToObjectIDs()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid ID format",
			"error":   err.Error(),
		})
	}

	// Calculate end time
	endTime, err := banDto.CalculateEndTime()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid time calculation",
			"error":   err.Error(),
		})
	}

	// Ban user
	banRecord, err := c.moderationService.BanUser(
		ctx.Context(),
		userObjID,
		roomObjID,
		moderatorObjID,
		banDto.Duration,
		endTime,
		banDto.Reason,
	)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to ban user",
			"error":   err.Error(),
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "User banned successfully",
		"data": fiber.Map{
			"id":           banRecord.ID.Hex(),
			"userId":       banRecord.UserID.Hex(),
			"roomId":       banRecord.RoomID.Hex(),
			"moderatorId":  banRecord.ModeratorID.Hex(),
			"type":         banRecord.Type,
			"duration":     banRecord.Duration,
			"reason":       banRecord.Reason,
			"startTime":    banRecord.StartTime,
			"endTime":      banRecord.EndTime,
			"status":       banRecord.Status,
			"timeDescription": banDto.GetTimeDescription(),
		},
	})
}

// handleUnbanUser ยกเลิกการบัน user
func (c *RestrictionController) handleUnbanUser(ctx *fiber.Ctx) error {
	var unbanDto restrictionDto.UnbanUserDto
	if err := ctx.BodyParser(&unbanDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Convert string IDs to ObjectIDs
	userObjID, roomObjID, moderatorObjID, err := unbanDto.ToObjectIDs()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid ID format",
			"error":   err.Error(),
		})
	}

	// Unban user
	if err := c.moderationService.UnbanUser(ctx.Context(), userObjID, roomObjID, moderatorObjID); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to unban user",
			"error":   err.Error(),
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "User unbanned successfully",
		"data": fiber.Map{
			"userId": unbanDto.UserID,
			"roomId": unbanDto.RoomID,
		},
	})
}

// handleMuteUser mute user
func (c *RestrictionController) handleMuteUser(ctx *fiber.Ctx) error {
	var muteDto restrictionDto.MuteUserDto
	if err := ctx.BodyParser(&muteDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Validate DTO
	if err := muteDto.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Validation failed",
			"error":   err.Error(),
		})
	}

	// Convert string IDs to ObjectIDs
	userObjID, roomObjID, moderatorObjID, err := muteDto.ToObjectIDs()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid ID format",
			"error":   err.Error(),
		})
	}

	// Calculate end time
	endTime, err := muteDto.CalculateEndTime()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid time calculation",
			"error":   err.Error(),
		})
	}

	// Mute user
	muteRecord, err := c.moderationService.MuteUser(
		ctx.Context(),
		userObjID,
		roomObjID,
		moderatorObjID,
		muteDto.Duration,
		endTime,
		muteDto.Restriction,
		muteDto.Reason,
	)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to mute user",
			"error":   err.Error(),
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "User muted successfully",
		"data": fiber.Map{
			"id":           muteRecord.ID.Hex(),
			"userId":       muteRecord.UserID.Hex(),
			"roomId":       muteRecord.RoomID.Hex(),
			"moderatorId":  muteRecord.ModeratorID.Hex(),
			"type":         muteRecord.Type,
			"duration":     muteRecord.Duration,
			"restriction":  muteRecord.Restriction,
			"reason":       muteRecord.Reason,
			"startTime":    muteRecord.StartTime,
			"endTime":      muteRecord.EndTime,
			"status":       muteRecord.Status,
			"timeDescription": muteDto.GetTimeDescription(),
		},
	})
}

// handleUnmuteUser ยกเลิกการ mute user
func (c *RestrictionController) handleUnmuteUser(ctx *fiber.Ctx) error {
	var unmuteDto restrictionDto.UnmuteUserDto
	if err := ctx.BodyParser(&unmuteDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Convert string IDs to ObjectIDs
	userObjID, roomObjID, moderatorObjID, err := unmuteDto.ToObjectIDs()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid ID format",
			"error":   err.Error(),
		})
	}

	// Unmute user
	if err := c.moderationService.UnmuteUser(ctx.Context(), userObjID, roomObjID, moderatorObjID); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to unmute user",
			"error":   err.Error(),
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "User unmuted successfully",
		"data": fiber.Map{
			"userId": unmuteDto.UserID,
			"roomId": unmuteDto.RoomID,
		},
	})
}

// handleKickUser kick user ออกจากห้อง
func (c *RestrictionController) handleKickUser(ctx *fiber.Ctx) error {
	var kickDto restrictionDto.KickUserDto
	if err := ctx.BodyParser(&kickDto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Convert string IDs to ObjectIDs
	userObjID, roomObjID, moderatorObjID, err := kickDto.ToObjectIDs()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid ID format",
			"error":   err.Error(),
		})
	}

	// Kick user
	kickRecord, err := c.moderationService.KickUser(
		ctx.Context(),
		userObjID,
		roomObjID,
		moderatorObjID,
		kickDto.Reason,
	)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to kick user",
			"error":   err.Error(),
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "User kicked successfully",
		"data": fiber.Map{
			"id":          kickRecord.ID.Hex(),
			"userId":      kickRecord.UserID.Hex(),
			"roomId":      kickRecord.RoomID.Hex(),
			"moderatorId": kickRecord.ModeratorID.Hex(),
			"type":        kickRecord.Type,
			"reason":      kickRecord.Reason,
			"kickTime":    kickRecord.StartTime,
			"status":      kickRecord.Status,
		},
	})
}

// handleGetModerationStatus ดูสถานะการลงโทษของ user ในห้อง
func (c *RestrictionController) handleGetModerationStatus(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	userID := ctx.Params("userId")

	// Convert string IDs to ObjectIDs
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid user ID format",
		})
	}

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid room ID format",
		})
	}

	// Get moderation status
	status, err := c.moderationService.GetUserRestrictionStatus(ctx.Context(), userObjID, roomObjID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to get moderation status",
			"error":   err.Error(),
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Moderation status retrieved successfully",
		"data":    status,
	})
}

// handleGetModerationHistory ดูประวัติการลงโทษ
func (c *RestrictionController) handleGetModerationHistory(ctx *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	limit, _ := strconv.Atoi(ctx.Query("limit", "20"))
	roomID := ctx.Query("roomId")
	userID := ctx.Query("userId")
	moderationType := ctx.Query("type")
	status := ctx.Query("status")

	// Build filter
	filter := make(map[string]interface{})
	
	if roomID != "" {
		if roomObjID, err := primitive.ObjectIDFromHex(roomID); err == nil {
			filter["room_id"] = roomObjID
		}
	}
	
	if userID != "" {
		if userObjID, err := primitive.ObjectIDFromHex(userID); err == nil {
			filter["user_id"] = userObjID
		}
	}
	
	if moderationType != "" {
		filter["type"] = moderationType
	}
	
	if status != "" {
		filter["status"] = status
	}

	// Query options
	opts := queries.QueryOptions{
		Page:   page,
		Limit:  limit,
		Sort:   "-created_at", // ใหม่สุดก่อน
		Filter: filter,
	}

	// Get moderation history
	result, err := c.moderationService.GetModerationHistory(ctx.Context(), opts)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to get moderation history",
			"error":   err.Error(),
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Moderation history retrieved successfully",
		"data":    result.Data,
		"meta":    result.Meta,
	})
} 