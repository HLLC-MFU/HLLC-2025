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
	"mime/multipart"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

type (
	RoomController struct {
		*decorators.BaseController
		roomService      service.RoomService
		rbac             middleware.IRBACMiddleware
		db               *mongo.Database
		uploadHandler    *utils.FileUploadHandler
		validationHelper *roomUtils.RoomValidationHelper
		controllerHelper *roomUtils.RoomControllerHelper
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
		controllerHelper: roomUtils.NewRoomControllerHelper(),
	}

	controller.setupRoutes()
	return controller
}

func (c *RoomController) setupRoutes() {
	c.Get("/all-for-user", c.rbac.RequireReadOnlyAccess(), c.GetAllRoomForUser)
	c.Get("/me", c.rbac.RequireReadOnlyAccess(), c.GetRoomsForMe)
	c.Get("/", c.rbac.RequireAdministrator(), c.GetRooms)
	c.Get("/:id", c.rbac.RequireReadOnlyAccess(), c.GetRoomById)
	c.Get("/:id/members", c.rbac.RequireReadOnlyAccess(), c.GetRoomMembers)
	c.Patch("/:id", c.UpdateRoom)
	c.Post("/", c.CreateRoom, c.rbac.RequireAnyRole())
	c.Delete("/:id", c.DeleteRoom)
	c.Post("/:id/join", c.JoinRoom)
	c.Post("/:id/leave", c.LeaveRoom)
	c.Patch("/:id/type", c.UpdateRoomType)
	c.Patch("/:id/image", c.UpdateRoomImage)
	c.Put("/:id/readonly", c.handleSetRoomReadOnly, c.rbac.RequireAdministrator())
	c.SetupRoutes()
}

// GetRooms ดึงรายการห้องทั้งหมด
func (c *RoomController) GetRooms(ctx *fiber.Ctx) error {
	opts := queries.ParseQueryOptions(ctx)
	userID, err := c.rbac.ExtractUserIDFromContext(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	response, err := c.roomService.GetRooms(ctx.Context(), opts, userID)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	return c.validationHelper.BuildSuccessResponse(ctx, response.Data, "Rooms retrieved successfully")
}

func (c *RoomController) GetRoomMembers(ctx *fiber.Ctx) error {
	roomObjID, err := c.validationHelper.ParseAndValidateRoomID(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	roomMember, err := c.roomService.GetRoomMemberById(ctx.Context(), roomObjID)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	return c.validationHelper.BuildSuccessResponse(ctx, roomMember, "Room members retrieved successfully")
}

// GetRoomById ดึงข้อมูลห้องตาม ID
func (c *RoomController) GetRoomById(ctx *fiber.Ctx) error {
	roomObjID, err := c.validationHelper.ParseAndValidateRoomID(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	userID, err := c.rbac.ExtractUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"success": false, "message": "Invalid authentication token"})
	}

	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return c.validationHelper.BuildNotFoundErrorResponse(ctx, "Room")
	}

	return ctx.JSON(c.controllerHelper.BuildRoomResponse(room, userID))
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

	// Role-based validation for room type
	userID, err := c.rbac.ExtractUserIDFromContext(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	userRole, err := c.rbac.GetUserRole(userID)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// Students can only create "normal" type rooms
	isValid, allowedType, _ := c.controllerHelper.ValidateStudentRoomType(userRole, createDto.Type)
	if !isValid {
		return c.controllerHelper.BuildStudentRoomTypeError(ctx, createDto.Type, allowedType)
	}
	createDto.Type = allowedType

	// Handle image upload
	if err := c.controllerHelper.CreateRoomWithImage(ctx, &createDto, c.validationHelper, c.uploadHandler); err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	room, err := c.roomService.CreateRoom(ctx.Context(), &createDto)
	if err != nil {
		c.controllerHelper.CleanupUploadedFile(createDto.Image, c.uploadHandler)
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// If image was uploaded, update room with UpdateRoomDto
	if createDto.Image != "" {
		stringMembers := c.controllerHelper.ConvertMembersToStrings(room.Members)
		updateDto := &dto.UpdateRoomDto{
			Name:     room.Name,
			Type:     room.Type,
			Capacity: room.Capacity,
			Members:  stringMembers,
			Image:    createDto.Image,
		}
		room, err = c.roomService.UpdateRoom(ctx.Context(), room.ID.Hex(), updateDto)
		if err != nil {
			c.controllerHelper.CleanupUploadedFile(createDto.Image, c.uploadHandler)
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

	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// Authorization check
	authResult := c.controllerHelper.CheckRoomAuthorization(ctx, room, c.rbac)
	if authResult.Error != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, authResult.Error)
	}

	if !authResult.IsAuthorized {
		return c.controllerHelper.BuildUnauthorizedResponse(ctx, "update", authResult)
	}

	// Parse multipart form and update room
	updateDto, err := c.controllerHelper.ParseAndUpdateRoom(ctx, room, c.validationHelper, c.uploadHandler)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
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

	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// Authorization check
	authResult := c.controllerHelper.CheckRoomAuthorization(ctx, room, c.rbac)
	if authResult.Error != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, authResult.Error)
	}

	if !authResult.IsAuthorized {
		return c.controllerHelper.BuildUnauthorizedResponse(ctx, "delete", authResult)
	}

	deletedRoom, err := c.roomService.DeleteRoom(ctx.Context(), roomObjID.Hex())
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// Clean up room image if exists
	if deletedRoom.Image != "" {
		c.controllerHelper.CleanupUploadedFile(deletedRoom.Image, c.uploadHandler)
	}

	return c.validationHelper.BuildSuccessResponse(ctx, deletedRoom, "Room deleted successfully")
}

// JoinRoom เข้าร่วมห้อง
func (c *RoomController) JoinRoom(ctx *fiber.Ctx) error {
	roomObjID, err := c.validationHelper.ParseAndValidateRoomID(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	userObjID, err := roomUtils.ExtractUserIDFromJWT(ctx)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}

	err = c.roomService.JoinRoom(ctx.Context(), roomObjID, userObjID.Hex())
	if err != nil {
		return c.controllerHelper.HandleJoinRoomError(ctx, err, c.validationHelper)
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

	userObjID, err := roomUtils.ExtractUserIDFromJWT(ctx)
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
	
	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// Authorization check
	authResult := c.controllerHelper.CheckRoomAuthorization(ctx, room, c.rbac)
	if authResult.Error != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, authResult.Error)
	}

	if !authResult.IsAuthorized {
		return c.controllerHelper.BuildUnauthorizedResponse(ctx, "update_type", authResult)
	}

	var updateDto dto.UpdateRoomTypeDto
	if err := ctx.BodyParser(&updateDto); err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}
	
	updateRoomDto := c.controllerHelper.BuildRoomUpdateDto(room, updateDto.Type)
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

	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}

	// Authorization check
	authResult := c.controllerHelper.CheckRoomAuthorization(ctx, room, c.rbac)
	if authResult.Error != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, authResult.Error)
	}

	if !authResult.IsAuthorized {
		return c.controllerHelper.BuildUnauthorizedResponse(ctx, "update_image", authResult)
	}

	imagePath, err := c.controllerHelper.UpdateRoomWithImage(ctx, room, c.validationHelper, c.uploadHandler)
	if err != nil {
		return c.validationHelper.BuildValidationErrorResponse(ctx, err)
	}
	
	updateRoomDto := c.controllerHelper.BuildRoomUpdateDto(room, room.Type)
	updateRoomDto.Image = imagePath
	updatedRoom, err := c.roomService.UpdateRoom(ctx.Context(), roomObjID.Hex(), updateRoomDto)
	if err != nil {
		c.controllerHelper.CleanupUploadedFile(imagePath, c.uploadHandler)
		return c.validationHelper.BuildInternalErrorResponse(ctx, err)
	}
	return c.validationHelper.BuildSuccessResponse(ctx, updatedRoom, "Room image updated successfully")
}

// SetRoomReadOnly sets a room's read-only status
func (c *RoomController) handleSetRoomReadOnly(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	isReadOnly := ctx.QueryBool("readOnly", true)

	roomObjID, err := c.controllerHelper.ValidateRoomIDParam(ctx, c.validationHelper)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid room ID",
		})
	}

	room, err := c.roomService.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "Room not found",
		})
	}

	// Authorization check
	authResult := c.controllerHelper.CheckRoomAuthorization(ctx, room, c.rbac)
	if authResult.Error != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Invalid authentication token",
		})
	}

	if !authResult.IsAuthorized {
		return c.controllerHelper.BuildUnauthorizedResponse(ctx, "set_readonly", authResult)
	}

	// Set room type
	room.Type = model.RoomTypeReadOnly
	if !isReadOnly {
		room.Type = model.RoomTypeNormal
	}

	updateDto := c.controllerHelper.BuildRoomUpdateDto(room, room.Type)
	updatedRoom, err := c.roomService.UpdateRoom(ctx.Context(), roomID, updateDto)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update room type",
			"error":   err.Error(),
		})
	}

	return ctx.JSON(c.controllerHelper.BuildReadOnlyResponse(roomID, isReadOnly, updatedRoom))
}

// GetAllRoomForUser - ดึงห้องทั้งหมดที่ user มองเห็น (ไม่เอา group room)
func (c *RoomController) GetAllRoomForUser(ctx *fiber.Ctx) error {
	userID, err := c.rbac.ExtractUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"success": false, "message": "Invalid authentication token"})
	}
	
	_, err = c.validationHelper.ValidateUserID(userID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "message": err.Error()})
	}
	
	rooms, err := c.roomService.GetAllRoomForUser(ctx.Context(), userID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to get rooms", "error": err.Error()})
	}
	return ctx.JSON(fiber.Map{"success": true, "data": rooms})
}

// GetRoomsForMe - ดึงเฉพาะห้องที่ user เป็น member
func (c *RoomController) GetRoomsForMe(ctx *fiber.Ctx) error {
	userID, err := c.rbac.ExtractUserIDFromContext(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"success": false, "message": "Invalid authentication token"})
	}
	
	_, err = c.validationHelper.ValidateUserID(userID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "message": err.Error()})
	}
	
	rooms, err := c.roomService.GetRoomsForMe(ctx.Context(), userID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to get rooms", "error": err.Error()})
	}
	return ctx.JSON(fiber.Map{"success": true, "data": rooms})
}
