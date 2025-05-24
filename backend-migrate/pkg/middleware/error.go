package middleware

import (
	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/pkg/errors"
	"github.com/gofiber/fiber/v2"
)

// ErrorHandler middleware catches any unhandled errors
func ErrorHandler() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Try to handle the request
		err := c.Next()
		
		// If there's an error, map it to our error response format
		if err != nil {
			return errors.MapError(c, err)
		}
		
		return nil
	}
} 