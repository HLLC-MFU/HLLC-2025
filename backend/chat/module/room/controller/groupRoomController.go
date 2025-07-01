package controller

import (
	"chat/module/room/dto"
	"chat/module/room/service"
	roomUtils "chat/module/room/utils"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"chat/pkg/utils"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type GroupRoomController struct {
	*decorators.BaseController
	groupService     *service.GroupRoomService
	roomService      *service.RoomService
	uploadHandler    *utils.FileUploadHandler
	validationHelper *roomUtils.RoomValidationHelper
	rbac middleware.IRBACMiddleware
}

func NewGroupRoomController(app *fiber.App, groupService *service.GroupRoomService, roomService *service.RoomService, rbac middleware.IRBACMiddleware) *GroupRoomController {
	uploadConfig := utils.GetModuleConfig("room")
	
	var validationHelper *roomUtils.RoomValidationHelper
	if uploadConfig.MaxSize > 0 && len(uploadConfig.AllowedTypes) > 0 {
		validationHelper = roomUtils.NewRoomValidationHelper(uploadConfig.MaxSize, uploadConfig.AllowedTypes)
	} else {
		validationHelper = roomUtils.NewRoomValidationHelper(256*1024, []string{"image/jpeg", "image/jpg", "image/png"})
	}
	
	controller := &GroupRoomController{
		BaseController:   decorators.NewBaseController(app, "/api/rooms"),
		groupService:     groupService,
		roomService:      roomService,
		uploadHandler:    utils.NewModuleFileHandler("room"),
		validationHelper: validationHelper,
		rbac:            rbac,
	}

	controller.setupRoutes()
	return controller
}

func (c *GroupRoomController) setupRoutes() {
	c.Post("/group", c.CreateRoomByGroup, c.rbac.RequireAdministrator())
	c.Post("/:id/join-group", c.JoinRoomByGroup, c.rbac.RequireAdministrator())
	c.Post("/:id/bulk-add", c.BulkAddUsers, c.rbac.RequireAdministrator())
	c.Get("/group/stats", c.GetGroupRoomStats, c.rbac.RequireAdministrator())
	c.Get("/group/rooms", c.GetRoomsByGroup)
	c.Post("/auto-add/:userId", c.AutoAddUserToGroupRooms, c.rbac.RequireAdministrator())
	c.Get("/auto-addable", c.GetAutoAddableGroupRooms, c.rbac.RequireAdministrator())
	c.Patch("/:id/auto-add", c.ToggleGroupRoomAutoAdd, c.rbac.RequireAdministrator())
	c.SetupRoutes()
}

// CreateRoomByGroup สร้างห้องใหม่โดยแบ่งตาม group
func (c *GroupRoomController) CreateRoomByGroup(ctx *fiber.Ctx) error {
	var groupDto dto.CreateRoomByGroupDto
	
	if err := ctx.BodyParser(&groupDto); err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	// Handle image upload if present
	imagePath, err := c.handleImageUpload(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	// Create group room
	room, err := c.groupService.CreateRoomByGroup(ctx.Context(), &groupDto)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// Update room image if provided
	if imagePath != "" {
		room.Image = imagePath
		room, err = c.roomService.UpdateRoom(ctx.Context(), room.ID.Hex(), room)
		if err != nil {
			return c.validationHelper.BuildInternalErrorResponse(ctx, err)
		}
	}

	return c.validationHelper.BuildSuccessResponse(ctx, room, "Group room created successfully", fiber.StatusCreated)
}

// JoinRoomByGroup เพิ่ม users ที่มี metadata ตรงกับ group เข้าห้อง
func (c *GroupRoomController) JoinRoomByGroup(ctx *fiber.Ctx) error {
	roomID := ctx.Params("id")
	var joinDto dto.JoinRoomByGroupDto
	
	if err := ctx.BodyParser(&joinDto); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"success": false, "message": "Invalid request body"})
	}

	joinDto.RoomID = roomID
	if err := joinDto.ValidateGroupType(); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"success": false, "message": "Validation failed", "error": err.Error()})
	}

	roomObjID := joinDto.ToObjectID()

	addedCount, err := c.groupService.JoinRoomByGroup(ctx.Context(), roomObjID, joinDto.GroupType, joinDto.GroupValue)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to join room by group", "error": err.Error()})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Users added to room by group successfully",
		"data": fiber.Map{
			"roomId":     roomID,
			"groupType":  joinDto.GroupType,
			"groupValue": joinDto.GroupValue,
			"addedCount": addedCount,
		},
	})
}

// BulkAddUsers เพิ่ม users หลายคนเข้าห้องพร้อมกัน
func (c *GroupRoomController) BulkAddUsers(ctx *fiber.Ctx) error {
	roomID := ctx.Params("id")
	var bulkDto dto.BulkAddUsersDto
	
	if err := ctx.BodyParser(&bulkDto); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"success": false, "message": "Invalid request body"})
	}

	bulkDto.RoomID = roomID
	roomObjID, userObjIDs := bulkDto.ToObjectIDs()

	userIDs := make([]string, len(userObjIDs))
	for i, objID := range userObjIDs {
		userIDs[i] = objID.Hex()
	}

	addedCount, err := c.groupService.BulkAddUsersToRoom(ctx.Context(), roomObjID, userIDs)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to bulk add users", "error": err.Error()})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Users added to room successfully",
		"data": fiber.Map{
			"roomId":     roomID,
			"addedCount": addedCount,
			"userIds":    userIDs,
		},
	})
}

// GetGroupRoomStats ดึงสถิติของห้องกลุ่ม
func (c *GroupRoomController) GetGroupRoomStats(ctx *fiber.Ctx) error {
	groupType := ctx.Query("groupType")
	groupValue := ctx.Query("groupValue")

	if groupType == "" || groupValue == "" {
		return ctx.Status(400).JSON(fiber.Map{"success": false, "message": "groupType and groupValue are required"})
	}

	stats, err := c.groupService.GetGroupRoomStats(ctx.Context(), groupType, groupValue)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to get group room stats", "error": err.Error()})
	}

	return ctx.JSON(fiber.Map{"success": true, "message": "Group room stats retrieved successfully", "data": stats})
}

// GetRoomsByGroup ดึงรายการห้องตาม group
func (c *GroupRoomController) GetRoomsByGroup(ctx *fiber.Ctx) error {
	groupType := ctx.Query("groupType")
	groupValue := ctx.Query("groupValue")

	if groupType == "" || groupValue == "" {
		return ctx.Status(400).JSON(fiber.Map{"success": false, "message": "groupType and groupValue are required"})
	}

	rooms, err := c.groupService.GetRoomsByGroup(ctx.Context(), groupType, groupValue)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to get rooms by group", "error": err.Error()})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Rooms retrieved successfully",
		"data": fiber.Map{
			"groupType":  groupType,
			"groupValue": groupValue,
			"rooms":      rooms,
			"count":      len(rooms),
		},
	})
}

// AutoAddUserToGroupRooms เพิ่ม user เข้าห้องกลุ่มที่เหมาะสมอัตโนมัติ
func (c *GroupRoomController) AutoAddUserToGroupRooms(ctx *fiber.Ctx) error {
	userID := ctx.Params("userId")
	if userID == "" {
		return ctx.Status(400).JSON(fiber.Map{"success": false, "message": "userId is required"})
	}

	err := c.groupService.AutoAddUserToGroupRooms(ctx.Context(), userID)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to auto-add user to group rooms", "error": err.Error()})
	}

	return ctx.JSON(fiber.Map{"success": true, "message": "User auto-added to group rooms successfully", "data": fiber.Map{"userId": userID}})
}

// GetAutoAddableGroupRooms ดึงห้องกลุ่มที่เปิด auto-add
func (c *GroupRoomController) GetAutoAddableGroupRooms(ctx *fiber.Ctx) error {
	rooms, err := c.groupService.GetAutoAddableGroupRooms(ctx.Context())
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to get auto-addable group rooms", "error": err.Error()})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Auto-addable group rooms retrieved successfully",
		"data": fiber.Map{"rooms": rooms, "count": len(rooms)},
	})
}

// ToggleGroupRoomAutoAdd เปิด/ปิด auto-add สำหรับห้องกลุ่ม
func (c *GroupRoomController) ToggleGroupRoomAutoAdd(ctx *fiber.Ctx) error {
	roomID := ctx.Params("id")
	
	type ToggleAutoAddDto struct {
		AutoAdd bool `json:"autoAdd"`
	}

	var toggleDto ToggleAutoAddDto
	if err := ctx.BodyParser(&toggleDto); err != nil {
		return ctx.Status(400).JSON(fiber.Map{"success": false, "message": "Invalid request body"})
	}

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(400).JSON(fiber.Map{"success": false, "message": "Invalid room ID"})
	}

	err = c.groupService.ToggleGroupRoomAutoAdd(ctx.Context(), roomObjID, toggleDto.AutoAdd)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"success": false, "message": "Failed to toggle auto-add", "error": err.Error()})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Auto-add status updated successfully",
		"data": fiber.Map{"roomId": roomID, "autoAdd": toggleDto.AutoAdd},
	})
} 

func (c *GroupRoomController) handleImageUpload(ctx *fiber.Ctx) (string, error) {
	file, err := ctx.FormFile("image")
	if err != nil {
		return "", nil // Image is optional
	}

	if err := c.validationHelper.ValidateImageUpload(file); err != nil {
		return "", err
	}

	return c.uploadHandler.HandleFileUpload(ctx, "image")
}