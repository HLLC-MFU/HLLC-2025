package controller

import (
	"chat/module/room/dto"
	"chat/module/room/model"
	"chat/module/room/service"
	roomUtils "chat/module/room/utils"
	"chat/pkg/common"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"chat/pkg/utils"
	"mime/multipart"
	"strconv"
	"strings"

	"encoding/base64"
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type (
	RoomController struct {
		*decorators.BaseController
		roomService       service.RoomService
		rbac              middleware.IRBACMiddleware
		db                *mongo.Database
		uploadHandler     *utils.FileUploadHandler
		validationHelper  *roomUtils.RoomValidationHelper
	}

	UpdateRoomImageDto struct {
		Image *multipart.FileHeader `form:"image" validate:"required"`
	}
)

func NewRoomController(
	app *fiber.App,
	roomService service.RoomService,
	rbac middleware.IRBACMiddleware,
	db *mongo.Database,
) *RoomController {
	uploadConfig := utils.GetModuleConfig("room")

	controller := &RoomController{
		BaseController:   decorators.NewBaseController(app, "/api/rooms"),
		roomService:      roomService,
		rbac:             rbac,
		db:               db,
		uploadHandler:    utils.NewModuleFileHandler("room"),
		validationHelper: roomUtils.NewRoomValidationHelper(uploadConfig.MaxSize, uploadConfig.AllowedTypes),
	}

	controller.setupRoutes()
	return controller
}

func (c *RoomController) setupRoutes() {
	// Basic room operations
	c.Get("/", c.rbac.RequireReadOnlyAccess(), c.GetRooms)
	c.Get("/non-group", c.rbac.RequireReadOnlyAccess(), c.GetNonGroupRooms)
	c.Get("/:id", c.rbac.RequireReadOnlyAccess(), c.GetRoomById)
	c.Patch("/:id", c.UpdateRoom)
	c.Post("/", c.CreateRoom, c.rbac.RequireAdministrator())
	c.Delete("/:id", c.DeleteRoom)
	c.Post("/:id/join", c.JoinRoom)
	c.Post("/:id/leave", c.LeaveRoom)
	c.Patch("/:id/type", c.UpdateRoomType)
	c.Patch("/:id/image", c.UpdateRoomImage)
	// Add new endpoint for setting read-only status
	c.Put("/:id/readonly", c.handleSetRoomReadOnly, c.rbac.RequireAdministrator())
	
	c.SetupRoutes()
}

// GetRooms ดึงรายการห้องทั้งหมด
func (c *RoomController) GetRooms(ctx *fiber.Ctx) error {
	opts := queries.ParseQueryOptions(ctx)
	
	response, err := c.roomService.GetRooms(ctx.Context(), opts)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}
	
	return ctx.Status(fiber.StatusOK).JSON(response)
}

// GetRoomById ดึงข้อมูลห้องตาม ID
func (c *RoomController) GetRoomById(ctx *fiber.Ctx) error {
	roomObjID, err := c.validationHelper.ParseAndValidateRoomID(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return c.validationHelper.BuildNotFoundErrorResponse(ctx, "Room")
	}
	
	return c.validationHelper.BuildSuccessResponse(ctx, room, "Room retrieved successfully")
}

// CreateRoom สร้างห้องใหม่
func (c *RoomController) CreateRoom(ctx *fiber.Ctx) error {
	var createDto dto.CreateRoomDto
	if err := ctx.BodyParser(&createDto); err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	if err := c.validationHelper.ValidateCreateRoomDto(&createDto); err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	// Handle image if provided
	if file, err := ctx.FormFile("image"); err == nil {
		if err := c.validationHelper.ValidateImageUpload(file); err != nil {
			return c.validationHelper.BuildValidationErrorResponse(ctx, err)
		}
		filename, err := c.uploadHandler.HandleFileUpload(ctx, "image")
		if err != nil {
			return c.validationHelper.BuildValidationErrorResponse(ctx, err)
		}
		createDto.Image = filename
	}

	room, err := c.roomService.CreateRoom(ctx.Context(), &createDto)
	if err != nil {
		c.cleanupUploadedFile(createDto.Image)
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// If image was uploaded, update room with UpdateRoomDto
	if createDto.Image != "" {
		updateDto := &dto.UpdateRoomDto{
			Name:     room.Name,
			Type:     room.Type,
			Capacity: room.Capacity,
			Members:  room.Members,
			Image:    createDto.Image,
		}
		room, err = c.roomService.UpdateRoom(ctx.Context(), room.ID.Hex(), updateDto)
		if err != nil {
			c.cleanupUploadedFile(createDto.Image)
			return c.validationHelper.BuildInternalErrorResponse(ctx, err)
		}
	}

	return c.validationHelper.BuildSuccessResponse(ctx, room, "Room created successfully", fiber.StatusCreated)
}

func (c *RoomController) UpdateRoom(ctx *fiber.Ctx) error {
	roomObjID, err := c.validationHelper.ParseAndValidateRoomID(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	// ดึง room เดิมจาก DB
	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// Parse multipart form
	form, _ := ctx.MultipartForm()

	// Update fields
	nameTh := ctx.FormValue("name.th", room.Name.Th)
	nameEn := ctx.FormValue("name.en", room.Name.En)
	roomType := ctx.FormValue("type", room.Type)
	capacityStr := ctx.FormValue("capacity", "")
	capacity := room.Capacity
	if capacityStr != "" {
		if v, err := strconv.Atoi(capacityStr); err == nil {
			capacity = v
		}
	}

	// Handle members (array)
	members := room.Members
	if form != nil && form.Value["members"] != nil && len(form.Value["members"]) > 0 {
		members = form.Value["members"]
	}

	// Handle image
	imagePath := room.Image
	file, err := ctx.FormFile("image")
	if err == nil && file != nil {
		if err := c.validationHelper.ValidateImageUpload(file); err != nil {
			return c.validationHelper.BuildValidationErrorResponse(ctx, err)
		}
		imagePath, err = c.uploadHandler.HandleFileUpload(ctx, "image")
		if err != nil {
			return c.validationHelper.BuildValidationErrorResponse(ctx, err)
		}
	}

	createdBy := ctx.FormValue("createdBy", room.CreatedBy)

	updateDto := &dto.UpdateRoomDto{
		Name: common.LocalizedName{
			Th: nameTh,
			En: nameEn,
		},
		Type:     roomType,
		Capacity: capacity,
		Members:  members,
		Image:    imagePath,
		CreatedBy: createdBy,
	}

	updatedRoom, err := c.roomService.UpdateRoom(ctx.Context(), roomObjID.Hex(), updateDto)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}
	return c.validationHelper.BuildSuccessResponse(ctx, updatedRoom, "Room updated successfully")
}

// DeleteRoom ลบห้อง
func (c *RoomController) DeleteRoom(ctx *fiber.Ctx) error {
	roomObjID, err := c.validationHelper.ParseAndValidateRoomID(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	deletedRoom, err := c.roomService.DeleteRoom(ctx.Context(), roomObjID.Hex())
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// Clean up room image if exists
	if deletedRoom.Image != "" {
		c.cleanupUploadedFile(deletedRoom.Image)
	}

	return c.validationHelper.BuildSuccessResponse(ctx, deletedRoom, "Room deleted successfully")
}

// JoinRoom เข้าร่วมห้อง
func (c *RoomController) JoinRoom(ctx *fiber.Ctx) error {
	roomObjID, err := c.validationHelper.ParseAndValidateRoomID(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	userObjID, err := extractUserIDFromJWT(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	err = c.roomService.JoinRoom(ctx.Context(), roomObjID, userObjID.Hex())
	if err != nil {
		if strings.Contains(err.Error(), "not allowed to join group rooms") {
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"message": "Access denied: Users with role 'user' cannot join group rooms",
				"error":   "ROLE_RESTRICTION",
			})
		}
		if strings.Contains(err.Error(), "full capacity") {
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
				"success": false,
				"message": "Room is at full capacity",
				"error":   "ROOM_FULL",
			})
		}
		if strings.Contains(err.Error(), "room not found") {
			return c.validationHelper.BuildNotFoundErrorResponse(ctx, "Room")
		}
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	return c.validationHelper.BuildSuccessResponse(ctx, fiber.Map{
		"roomId": roomObjID.Hex(),
		"userId": userObjID.Hex(),
	}, "Successfully joined room")
}

// LeaveRoom ออกจากห้อง
func (c *RoomController) LeaveRoom(ctx *fiber.Ctx) error {
	roomObjID, err := c.validationHelper.ParseAndValidateRoomID(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	userObjID, err := extractUserIDFromJWT(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	err = c.roomService.LeaveRoom(ctx.Context(), roomObjID, userObjID.Hex())
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	return c.validationHelper.BuildSuccessResponse(ctx, fiber.Map{
		"roomId": roomObjID.Hex(),
		"userId": userObjID.Hex(),
	}, "Successfully left room")
}

// UpdateRoomType อัพเดทประเภทห้อง
func (c *RoomController) UpdateRoomType(ctx *fiber.Ctx) error {
	roomObjID, err := c.validationHelper.ParseAndValidateRoomID(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}
	var updateDto dto.UpdateRoomTypeDto
	if err := ctx.BodyParser(&updateDto); err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}
	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}
	// Build UpdateRoomDto
	updateRoomDto := &dto.UpdateRoomDto{
		Name:     room.Name,
		Type:     updateDto.Type,
		Capacity: room.Capacity,
		Members:  room.Members,
		Image:    room.Image,
	}
	updatedRoom, err := c.roomService.UpdateRoom(ctx.Context(), roomObjID.Hex(), updateRoomDto)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}
	return c.validationHelper.BuildSuccessResponse(ctx, updatedRoom, "Room type updated successfully")
}

// UpdateRoomImage อัพเดทรูปภาพห้อง
func (c *RoomController) UpdateRoomImage(ctx *fiber.Ctx) error {
	roomObjID, err := c.validationHelper.ParseAndValidateRoomID(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}
	imagePath, err := c.handleImageUpload(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}
	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		c.cleanupUploadedFile(imagePath)
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}
	updateRoomDto := &dto.UpdateRoomDto{
		Name:     room.Name,
		Type:     room.Type,
		Capacity: room.Capacity,
		Members:  room.Members,
		Image:    imagePath,
	}
	updatedRoom, err := c.roomService.UpdateRoom(ctx.Context(), roomObjID.Hex(), updateRoomDto)
	if err != nil {
		c.cleanupUploadedFile(imagePath)
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}
	return c.validationHelper.BuildSuccessResponse(ctx, updatedRoom, "Room image updated successfully")
}

// Helper methods
func (c *RoomController) handleImageUpload(ctx *fiber.Ctx) (string, error) {
	file, err := ctx.FormFile("image")
	if err != nil {
		return "", nil // Image is optional
	}

	if err := c.validationHelper.ValidateImageUpload(file); err != nil {
		return "", err
	}

	return c.uploadHandler.HandleFileUpload(ctx, "image")
}

func (c *RoomController) cleanupUploadedFile(filePath string) {
	if filePath != "" {
		_ = c.uploadHandler.DeleteFile(filePath)
	}
}

// SetRoomReadOnly sets a room's read-only status
func (c *RoomController) handleSetRoomReadOnly(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	isReadOnly := ctx.QueryBool("readOnly", true)  // Default to true if not specified

	// Convert room ID to ObjectID
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid room ID",
		})
	}

	// Get current room
	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "Room not found",
		})
	}

	// Set room type
	room.Type = model.RoomTypeReadOnly
	if !isReadOnly {
		room.Type = model.RoomTypeNormal
	}

	// Update room
	updateDto := dto.UpdateRoomDto{
		Name:     room.Name,
		Type:     model.RoomTypeReadOnly,
		Capacity: room.Capacity,
		Members:  room.Members,
		Image:    room.Image,
	}
	updatedRoom, err := c.roomService.UpdateRoom(ctx.Context(), roomID, &updateDto)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update room type",
			"error":   err.Error(),
		})
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Room read-only status updated successfully",
		"data": fiber.Map{
			"roomId":   roomID,
			"readOnly": isReadOnly,
			"room":     updatedRoom,
		},
	})
}

// ฟังก์ชันช่วย extract user id จาก JWT token (Authorization header)
func extractUserIDFromJWT(ctx *fiber.Ctx) (primitive.ObjectID, error) {
	authHeader := ctx.Get("Authorization")
	if authHeader == "" {
		return primitive.NilObjectID, fiber.NewError(fiber.StatusUnauthorized, "Missing Authorization header")
	}
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return primitive.NilObjectID, fiber.NewError(fiber.StatusUnauthorized, "Invalid Authorization header format")
	}
	token := parts[1]
	// decode JWT payload (base64)
	payloadPart := strings.Split(token, ".")
	if len(payloadPart) < 2 {
		return primitive.NilObjectID, fiber.NewError(fiber.StatusUnauthorized, "Invalid JWT token")
	}
	payload, err := decodeBase64URL(payloadPart[1])
	if err != nil {
		return primitive.NilObjectID, fiber.NewError(fiber.StatusUnauthorized, "Invalid JWT payload")
	}
	type jwtPayload struct {
		Sub string `json:"sub"`
	}
	var p jwtPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return primitive.NilObjectID, fiber.NewError(fiber.StatusUnauthorized, "Invalid JWT payload structure")
	}
	return primitive.ObjectIDFromHex(p.Sub)
}

func decodeBase64URL(s string) ([]byte, error) {
	missing := len(s) % 4
	if missing != 0 {
		s += strings.Repeat("=", 4-missing)
	}
	return base64.URLEncoding.DecodeString(s)
}

// NEW: GetNonGroupRooms - ดึงเฉพาะห้องที่ไม่ใช่ group room
func (c *RoomController) GetNonGroupRooms(ctx *fiber.Ctx) error {
	opts := queries.ParseQueryOptions(ctx)
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}
	// Filter: metadata.isGroupRoom != true
	opts.Filter["$or"] = []map[string]interface{}{
		{"metadata.isGroupRoom": map[string]interface{}{"$ne": true}},
		{"metadata.isGroupRoom": map[string]interface{}{"$exists": false}},
	}
	response, err := c.roomService.GetRooms(ctx.Context(), opts)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}
	return ctx.Status(fiber.StatusOK).JSON(response)
}