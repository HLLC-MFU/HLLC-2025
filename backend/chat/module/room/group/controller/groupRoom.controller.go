package controller

import (
	"chat/module/room/group/dto"
	groupService "chat/module/room/group/service"
	roomDto "chat/module/room/room/dto"
	roomService "chat/module/room/room/service"
	sharedUtils "chat/module/room/shared/utils"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"chat/pkg/utils"
	"fmt"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type GroupRoomController struct {
	*decorators.BaseController
	groupService     *groupService.GroupRoomService
	roomService      roomService.RoomService
	uploadHandler    *utils.FileUploadHandler
	validationHelper *sharedUtils.RoomValidationHelper
	rbac             middleware.IRBACMiddleware
}

func NewGroupRoomController(app fiber.Router, groupService *groupService.GroupRoomService, roomService roomService.RoomService, rbac middleware.IRBACMiddleware) *GroupRoomController {
	uploadConfig := utils.GetModuleConfig("room")

	var validationHelper *sharedUtils.RoomValidationHelper
	if uploadConfig.MaxSize > 0 && len(uploadConfig.AllowedTypes) > 0 {
		validationHelper = sharedUtils.NewRoomValidationHelper(uploadConfig.MaxSize, uploadConfig.AllowedTypes)
	} else {
		validationHelper = sharedUtils.NewRoomValidationHelper(256*1024, []string{"image/jpeg", "image/jpg", "image/png"})
	}

	controller := &GroupRoomController{
		BaseController:   decorators.NewBaseController(app, ""),
		groupService:     groupService,
		roomService:      roomService,
		uploadHandler:    utils.NewModuleFileHandler("room"),
		validationHelper: validationHelper,
		rbac:             rbac,
	}

	controller.setupRoutes()
	return controller
}

func (c *GroupRoomController) setupRoutes() {
	c.Post("/group", c.CreateRoomByGroup, c.rbac.RequireAdministrator())
	c.Post("/:id/join-group", c.JoinRoomByGroup, c.rbac.RequireAdministrator())
	c.Post("/:id/bulk-add", c.BulkAddUsers, c.rbac.RequireAdministrator())
	c.Get("/group/stats", c.GetGroupRoomStats, c.rbac.RequireAdministrator())
	c.Post("/auto-add/:userId", c.AutoAddUserToGroupRooms, c.rbac.RequireAdministrator())
	c.Get("/auto-addable", c.GetAutoAddableGroupRooms, c.rbac.RequireAdministrator())
	c.Patch("/:id/auto-add", c.ToggleGroupRoomAutoAdd, c.rbac.RequireAdministrator())
	c.SetupRoutes()
}

// CreateRoomByGroup สร้างห้องใหม่โดยแบ่งตาม group
func (c *GroupRoomController) CreateRoomByGroup(ctx *fiber.Ctx) error {
	var groupDto dto.CreateRoomByGroupDto

	// Log form values for debug
	form, _ := ctx.MultipartForm()
	if form != nil {
		for k, v := range form.Value {
			fmt.Printf("FORM KEY: %s, VALUE: %v\n", k, v)
		}
	}

	groupDto.Name.En = ctx.FormValue("name.en")
	groupDto.Name.Th = ctx.FormValue("name.th")
	groupDto.Type = ctx.FormValue("type")
	groupDto.Status = ctx.FormValue("status")
	groupDto.GroupType = ctx.FormValue("groupType")
	groupDto.GroupValue = ctx.FormValue("groupValue")
	groupDto.CreatedBy = ctx.FormValue("createdBy")

	// Fallback: ถ้า key ปกติว่าง ให้หา key ที่ลงท้ายด้วย _status/_capacity/_type/_groupType/_groupValue
	if groupDto.Status == "" && form != nil {
		for k, v := range form.Value {
			if strings.HasSuffix(k, "_status") && len(v) > 0 {
				groupDto.Status = v[0]
				break
			}
		}
	}
	if groupDto.Type == "" && form != nil {
		for k, v := range form.Value {
			if strings.HasSuffix(k, "_type") && len(v) > 0 {
				groupDto.Type = v[0]
				break
			}
		}
	}
	if groupDto.GroupType == "" && form != nil {
		for k, v := range form.Value {
			if strings.HasSuffix(k, "_groupType") && len(v) > 0 {
				groupDto.GroupType = v[0]
				break
			}
		}
	}
	if groupDto.GroupValue == "" && form != nil {
		for k, v := range form.Value {
			if strings.HasSuffix(k, "_groupValue") && len(v) > 0 {
				groupDto.GroupValue = v[0]
				break
			}
		}
	}

	// Parse capacity
	capacityStr := ctx.FormValue("capacity")
	if capacityStr == "" && form != nil {
		for k, v := range form.Value {
			if strings.HasSuffix(k, "_capacity") && len(v) > 0 {
				capacityStr = v[0]
				break
			}
		}
	}
	if capacityStr != "" {
		if capacity, err := strconv.Atoi(capacityStr); err == nil {
			groupDto.Capacity = capacity
		}
	}

	// Parse members from form-data (support multiple members)
	if form != nil {
		if memberVals, ok := form.Value["members"]; ok && len(memberVals) > 0 {
			groupDto.Members = memberVals
		}
	}

	fmt.Println("DEBUG STATUS:", groupDto.Status)

	// Debug: log received data
	fmt.Printf("Received DTO: %+v\n", groupDto)
	fmt.Printf("Raw form values - status: '%s', capacity: '%s'\n", ctx.FormValue("status"), ctx.FormValue("capacity"))

	// Extract user ID from JWT context if CreatedBy is not provided
	if groupDto.CreatedBy == "" {
		userID, err := c.rbac.ExtractUserIDFromContext(ctx)
		if err != nil {
			return c.validationHelper.BuildValidationErrorResponse(ctx, err)
		}
		groupDto.CreatedBy = userID
	}

	filename, err := c.handleImageUpload(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	room, err := c.groupService.CreateRoomByGroup(ctx.Context(), &groupDto)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// หลังอัปโหลดรูป (ถ้ามี image)
	if filename != "" {
		stringMembers := make([]string, len(room.Members))
		for i, m := range room.Members {
			stringMembers[i] = m.Hex()
		}
		updateRoomDto := &roomDto.UpdateRoomDto{
			Name:     room.Name,
			Type:     room.Type,
			Status:   room.Status, // <--- เพิ่มบรรทัดนี้!
			Capacity: room.Capacity,
			Members:  stringMembers,
			Image:    filename,
		}
		room, err = c.roomService.UpdateRoom(ctx.Context(), room.ID.Hex(), updateRoomDto)
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
		"data":    fiber.Map{"rooms": rooms, "count": len(rooms)},
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
		"data":    fiber.Map{"roomId": roomID, "autoAdd": toggleDto.AutoAdd},
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
