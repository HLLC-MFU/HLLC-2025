package decorator

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/request"
	"github.com/gofiber/fiber/v2"
)

type (
	HttpHandlerFunc func(c *fiber.Ctx) error
)

/**
 * WithRequestValidation is a decorator that validates the request body
 *
 * @author Dev. Bengi (Backend Team)
 */

 // WithRequestValidation is a decorator that validates the request body
func WithRequestValidation(validator interface{}) HttpHandlerFunc {
	return func(c *fiber.Ctx) error {
		wrapper := request.NewContextWrapper(c)
		if err := wrapper.Bind(validator); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return nil
	}
}

// WithErrorHandling is a decorator that handles errors
func WithErrorHandling(handler HttpHandlerFunc) HttpHandlerFunc {
	return func(c *fiber.Ctx) error {
		if err := handler(c); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return nil
	}
}
