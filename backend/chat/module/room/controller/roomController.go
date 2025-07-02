package controller

import (
	"chat/module/room/dto"
	"chat/module/room/service"
	roomUtils "chat/module/room/utils"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"
	"chat/pkg/utils"
	"chat/pkg/validator"
	"mime/multipart"

	"github.com/gofiber/fiber/v2"
)

type (
	RoomController struct {
		*decorators.BaseController
		service           *service.RoomService
		uploadHandler     *utils.FileUploadHandler
		validationHelper  *roomUtils.RoomValidationHelper
	}

	UpdateRoomImageDto struct {
		Image *multipart.FileHeader `form:"image" validate:"required"`
	}
)

func NewRoomController(app *fiber.App, service *service.RoomService) *RoomController {
	uploadConfig := utils.GetModuleConfig("room")

	controller := &RoomController{
		BaseController:   decorators.NewBaseController(app, "/api/rooms"),
		service:          service,
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
	c.Post("/", c.CreateRoom)
	c.Delete("/:id", c.DeleteRoom)
	c.Post("/:id/join", c.JoinRoom)
	c.Post("/:id/leave", c.LeaveRoom)
	c.Patch("/:id/type", c.UpdateRoomType)
	c.Patch("/:id/image", c.UpdateRoomImage)
	
	c.SetupRoutes()
}

// GetRooms ดึงรายการห้องทั้งหมด
func (c *RoomController) GetRooms(ctx *fiber.Ctx) error {
	opts := queries.ParseQueryOptions(ctx)
	
	response, err := c.service.GetRooms(ctx.Context(), opts)
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

	room, err := c.service.GetRoomById(ctx.Context(), roomObjID)
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

	// Handle image upload if present
	imagePath, err := c.handleImageUpload(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	// Create room
	room, err := c.service.CreateRoom(ctx.Context(), &createDto)
	if err != nil {
		c.cleanupUploadedFile(imagePath)
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// Update room with image if uploaded
	if imagePath != "" {
		room.Image = imagePath
		room, err = c.service.UpdateRoom(ctx.Context(), room.ID.Hex(), room)
		if err != nil {
			c.cleanupUploadedFile(imagePath)
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

	room, err := c.service.UpdateRoom(ctx.Context(), roomObjID.Hex(), updateDto.ToRoom())
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

	deletedRoom, err := c.service.DeleteRoom(ctx.Context(), roomObjID.Hex())
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

	err = c.service.JoinRoom(ctx.Context(), roomObjID, joinDto.UserID)
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

	err = c.service.LeaveRoom(ctx.Context(), roomObjID, leaveDto.UserID)
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
	room, err := c.service.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return c.validationHelper.BuildNotFoundErrorResponse(ctx, "Room")
	}

	// Update room type
	room.Type = updateDto.Type
	updatedRoom, err := c.service.UpdateRoom(ctx.Context(), roomObjID.Hex(), room)
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
	room, err := c.service.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		c.cleanupUploadedFile(imagePath)
		return c.validationHelper.BuildNotFoundErrorResponse(ctx, "Room")
	}

	// Store old image path for cleanup
	oldImagePath := room.Image

	// Update room image
	room.Image = imagePath
	updatedRoom, err := c.service.UpdateRoom(ctx.Context(), roomObjID.Hex(), room)
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