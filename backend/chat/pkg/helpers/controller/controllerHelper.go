package controllerHelper

import (
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func Handle[T any](ctx *fiber.Ctx, dto *T, action func() (any, error)) error {
	if err := ctx.BodyParser(dto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body: " + err.Error(),
		})
	}

	result, err := action()
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(result)
}

func GetUserID(ctx *fiber.Ctx) primitive.ObjectID {
	userID, ok := ctx.Locals("user").(string)
	if !ok {
		return primitive.NilObjectID
	}
	id, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return primitive.NilObjectID
	}
	return id
}

func ControllerAction[T any](ctx *fiber.Ctx, callback func(*T) (any, error)) error {
	var payload T
	if err := ctx.BodyParser(&payload); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	result, err := callback(&payload)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": err.Error()})
	}

	return ctx.JSON(result)
}