package request

import (
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type ContextWrapper struct {
	Ctx       *fiber.Ctx
	Validator *validator.Validate
}

func NewContextWrapper(ctx *fiber.Ctx) *ContextWrapper {
	return &ContextWrapper{
		Ctx:       ctx,
		Validator: validator.New(),
	}
}

func (c *ContextWrapper) Bind(data interface{}) error {
	if err := c.Ctx.BodyParser(data); err != nil {
		return err
	}

	if err := c.Validator.Struct(data); err != nil {
		return err
	}

	return nil
}