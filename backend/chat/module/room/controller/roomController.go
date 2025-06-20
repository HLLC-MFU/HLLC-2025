package controller

import (
	"chat/module/room/dto"
	"chat/module/room/model"
	"chat/module/room/service"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"
	controllerHelper "chat/pkg/helpers/controller"
	"chat/pkg/validator"

	"github.com/gofiber/fiber/v2"
)

type (
	RoomController struct {
		*decorators.BaseController
		service *service.RoomService
	}
)

func NewRoomController(app *fiber.App, service *service.RoomService) *RoomController {
	controller := &RoomController{
		BaseController: decorators.NewBaseController(app, "/api/rooms"),
		service:       service,
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
	
	room, err := c.service.GetRoomById(ctx.Context(), id)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}
	
	return ctx.Status(fiber.StatusOK).JSON(room)
}

func (c *RoomController) CreateRoom(ctx *fiber.Ctx) error {
	return controllerHelper.ControllerAction(ctx, func(createDto *dto.CreateRoomDto) (any, error) {
		if createDto.CreatedBy == "" {
			userID := controllerHelper.GetUserID(ctx)
			if !userID.IsZero() {
				createDto.CreatedBy = userID.Hex()
			}
		}
		
		if createDto.CreatedBy == "" {
			return nil, fiber.NewError(fiber.StatusBadRequest, "createdBy is required")
		}

		return c.service.CreateRoom(ctx.Context(), createDto)
	})
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
		UserIDs: []string{userId},
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