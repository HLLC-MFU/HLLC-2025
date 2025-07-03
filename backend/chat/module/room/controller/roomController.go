package controller

import (
	"chat/module/room/dto"
	"chat/module/room/model"
	"chat/module/room/service"
	roomUtils "chat/module/room/utils"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"chat/pkg/utils"
	"chat/pkg/validator"
	"mime/multipart"

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
	c.Get("/", c.GetRooms)
	c.Get("/:id", c.GetRoomById)
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
		createDto.Image = filename // set string filename
	}

	// Create room
	room, err := c.roomService.CreateRoom(ctx.Context(), &createDto)
	if err != nil {
		c.cleanupUploadedFile(createDto.Image)
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// Update room with image if uploaded
	if createDto.Image != "" {
		room.Image = createDto.Image
		room, err = c.roomService.UpdateRoom(ctx.Context(), room.ID.Hex(), room)
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

	var updateDto dto.UpdateRoomDto
	if err := ctx.BodyParser(&updateDto); err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	room, err := c.roomService.UpdateRoom(ctx.Context(), roomObjID.Hex(), updateDto.ToRoom())
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	return c.validationHelper.BuildSuccessResponse(ctx, room, "Room updated successfully")
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

	// ใช้ JoinRoomDto แทนการ parse manual
	var joinDto dto.JoinRoomDto
	if err := ctx.BodyParser(&joinDto); err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	// Validate DTO
	if err := validator.ValidateStruct(&joinDto); err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	err = c.roomService.JoinRoom(ctx.Context(), roomObjID, joinDto.UserID)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	return c.validationHelper.BuildSuccessResponse(ctx, fiber.Map{
		"roomId": roomObjID.Hex(),
		"userId": joinDto.UserID,
	}, "Successfully joined room")
}

// LeaveRoom ออกจากห้อง
func (c *RoomController) LeaveRoom(ctx *fiber.Ctx) error {
	roomObjID, err := c.validationHelper.ParseAndValidateRoomID(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	// ใช้ LeaveRoomDto แทนการ parse manual
	var leaveDto dto.LeaveRoomDto
	if err := ctx.BodyParser(&leaveDto); err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	// Validate DTO
	if err := validator.ValidateStruct(&leaveDto); err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	err = c.roomService.LeaveRoom(ctx.Context(), roomObjID, leaveDto.UserID)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	return c.validationHelper.BuildSuccessResponse(ctx, fiber.Map{
		"roomId": roomObjID.Hex(),
		"userId": leaveDto.UserID,
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

	if err := c.validationHelper.ValidateRoomType(updateDto.Type); err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	// Get current room
	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return c.validationHelper.BuildNotFoundErrorResponse(ctx, "Room")
	}

	// Update room type
	room.Type = updateDto.Type
	updatedRoom, err := c.roomService.UpdateRoom(ctx.Context(), roomObjID.Hex(), room)
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

	// Handle image upload
	imagePath, err := c.handleImageUpload(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	if imagePath == "" {
		return c.validationHelper.BuildValidationErrorResponse(ctx, fiber.NewError(fiber.StatusBadRequest, "image is required"))
	}

	// Get current room
	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		c.cleanupUploadedFile(imagePath)
		return c.validationHelper.BuildNotFoundErrorResponse(ctx, "Room")
	}

	// Store old image path for cleanup
	oldImagePath := room.Image

	// Update room image
	room.Image = imagePath
	updatedRoom, err := c.roomService.UpdateRoom(ctx.Context(), roomObjID.Hex(), room)
	if err != nil {
		c.cleanupUploadedFile(imagePath)
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// Clean up old image
	if oldImagePath != "" {
		c.cleanupUploadedFile(oldImagePath)
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
	updatedRoom, err := c.roomService.UpdateRoom(ctx.Context(), roomID, room)
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