package controller

import (
	"chat/module/room/dto"
	"chat/module/room/model"
	"chat/module/room/service"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"
	controllerHelper "chat/pkg/helpers/controller"
	"chat/pkg/utils"
	"chat/pkg/validator"

	"mime/multipart"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	RoomController struct {
		*decorators.BaseController
		service       *service.RoomService
		uploadHandler *utils.FileUploadHandler
		imageValidator *validator.ImageUploadValidator
	}

	UpdateRoomImageDto struct {
		Image *multipart.FileHeader `form:"image" validate:"required"`
	}
)

func NewRoomController(app *fiber.App, service *service.RoomService) *RoomController {
	// Get room-specific file upload config
	uploadConfig := utils.GetModuleConfig("room")

	// Create image validator
	imageValidator := validator.NewImageUploadValidator(
		uploadConfig.MaxSize,
		uploadConfig.AllowedTypes,
	)

	controller := &RoomController{
		BaseController: decorators.NewBaseController(app, "/api/rooms"),
		service:       service,
		uploadHandler: utils.NewModuleFileHandler("room"),
		imageValidator: imageValidator,
	}

	controller.Get("/", controller.GetRooms)
	controller.Post("/", controller.CreateRoom)
	controller.Get("/:id", controller.GetRoomById)
	controller.Put("/:id", controller.UpdateRoom)
	controller.Delete("/:id", controller.DeleteRoom)
	controller.Post("/:id/members", controller.AddRoomMember)
	controller.Delete("/:id/members/:userId", controller.RemoveRoomMember)
	controller.SetupRoutes()

	return controller
}

func (c *RoomController) GetRooms(ctx *fiber.Ctx) error {
	opts := queries.ParseQueryOptions(ctx)
	
	response, err := c.service.GetRooms(ctx.Context(), opts)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}
	
	return ctx.Status(fiber.StatusOK).JSON(response)
}

func (c *RoomController) GetRoomById(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	
	roomObjID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "invalid room ID",
		})
	}
	room, err := c.service.GetRoomById(ctx.Context(), roomObjID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}
	
	return ctx.Status(fiber.StatusOK).JSON(room)
}

func (c *RoomController) CreateRoom(ctx *fiber.Ctx) error {
	// Parse multipart form
	if form, err := ctx.MultipartForm(); err == nil {
		defer form.RemoveAll()
	}

	// Get room data
	var createDto dto.CreateRoomDto
	if err := ctx.BodyParser(&createDto); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	// Validate the DTO including image if present
	if err := validator.ValidateMultipartForm(&createDto); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	// Handle image upload if exists
	var imagePath string
	file, err := ctx.FormFile("image")
	if err == nil && file != nil {
		// Validate image
		if err := c.imageValidator.ValidateFile(file); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		// Save image
		imagePath, err = c.uploadHandler.HandleFileUpload(ctx, "image")
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
	}

	// Create room
	room, err := c.service.CreateRoom(ctx.Context(), &createDto)
	if err != nil {
		// Clean up uploaded file if room creation fails
		if imagePath != "" {
			_ = c.uploadHandler.DeleteFile(imagePath)
		}
		return err
	}

	// Set the image path in the room model
	if imagePath != "" {
		room.Image = imagePath
		room, err = c.service.UpdateRoom(ctx.Context(), room.ID.Hex(), room)
		if err != nil {
			// Clean up uploaded file if update fails
			_ = c.uploadHandler.DeleteFile(imagePath)
			return err
		}
	}

	return ctx.Status(fiber.StatusCreated).JSON(room)
}

func (c *RoomController) UpdateRoom(ctx *fiber.Ctx) error {
	return controllerHelper.ControllerAction(ctx, func(room *model.Room) (any, error) {
		room.CreatedBy = controllerHelper.GetUserID(ctx)

		return c.service.UpdateRoom(ctx.Context(), ctx.Params("id"), room)
	})
}

func (c *RoomController) DeleteRoom(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	
	deletedRoom, err := c.service.DeleteRoom(ctx.Context(), id)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}
	
	return ctx.Status(fiber.StatusOK).JSON(deletedRoom)
}

func (c *RoomController) AddRoomMember(ctx *fiber.Ctx) error {
	return controllerHelper.ControllerAction(ctx, func(addDto *dto.AddRoomMembersDto) (any, error) {
		// Validate the DTO
		if err := validator.ValidateStruct(addDto); err != nil {
			return nil, fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		// Add members
		return c.service.AddRoomMember(ctx.Context(), ctx.Params("id"), addDto)
	})
}

func (c *RoomController) RemoveRoomMember(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	userId := ctx.Params("userId")
	
	// Create DTO with single user ID
	addDto := &dto.AddRoomMembersDto{
		Members: []string{userId},
	}

	// Validate the DTO
	if err := validator.ValidateStruct(addDto); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	// Remove member
	removedMember, err := c.service.AddRoomMember(ctx.Context(), id, addDto)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return ctx.Status(fiber.StatusOK).JSON(removedMember)
}