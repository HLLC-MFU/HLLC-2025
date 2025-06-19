package controller

import (
	"chat/module/room/model"
	"chat/module/room/service"
	"chat/pkg/database/queries"
	"chat/pkg/decorators"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
	room := new(model.Room)
	if err := ctx.BodyParser(room); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	// Set a default CreatedBy ID
	defaultID := primitive.NewObjectID()
	room.CreatedBy = defaultID

	createdRoom, err := c.service.CreateRoom(ctx.Context(), room, defaultID.Hex())
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(createdRoom)
}

func (c *RoomController) UpdateRoom(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	room := new(model.Room)
	if err := ctx.BodyParser(room); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	updatedRoom, err := c.service.UpdateRoom(ctx.Context(), id, room)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(updatedRoom)
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
	id := ctx.Params("id")
	member := new(model.RoomMember)
	if err := ctx.BodyParser(member); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	addedMember, err := c.service.AddRoomMember(ctx.Context(), id, member)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(addedMember)
}

func (c *RoomController) RemoveRoomMember(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	userId := ctx.Params("userId")
	
	userObjectId, err := primitive.ObjectIDFromHex(userId)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid user ID format",
		})
	}
	
	removedMember, err := c.service.AddRoomMember(ctx.Context(), id, &model.RoomMember{
		UserIDs: []primitive.ObjectID{userObjectId},
	})
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}
	
	return ctx.Status(fiber.StatusOK).JSON(removedMember)
}