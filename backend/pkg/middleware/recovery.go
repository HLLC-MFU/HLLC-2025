package middleware

import (
	"fmt"
	"runtime/debug"

	"github.com/gofiber/fiber/v2"
)

// RecoveryMiddleware handles panics and recovers gracefully
func RecoveryMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				err, ok := r.(error)
				if !ok {
					err = fmt.Errorf("%v", r)
				}

				// Log the error and stack trace
				fmt.Printf("Panic recovered: %v\nStack trace:\n%s\n", err, debug.Stack())

				// Return a 500 error to the client
				c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Internal server error",
				})
			}
		}()

		return c.Next()
	}
} 