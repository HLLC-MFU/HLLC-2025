package middleware

import (
	"context"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/pkg/errors"
	"github.com/gofiber/fiber/v2"
)

// TimeoutMiddleware creates a middleware that adds a timeout to the request context
func TimeoutMiddleware(timeout time.Duration) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Create a context with timeout
		ctx, cancel := context.WithTimeout(c.Context(), timeout)
		defer cancel()

		// Replace the request context
		c.SetUserContext(ctx)

		// Channel for handling timeout
		done := make(chan error, 1)

		// Execute the next handler in a goroutine
		go func() {
			done <- c.Next()
		}()

		// Wait for either completion or timeout
		select {
		case err := <-done:
			if err != nil {
				return errors.MapError(c, err)
			}
			return nil
		case <-ctx.Done():
			if ctx.Err() == context.DeadlineExceeded {
				return errors.MapError(c, errors.NewTimeoutError("Request timeout exceeded", ctx.Err()))
			}
			return errors.MapError(c, errors.NewInternalError("Request cancelled", ctx.Err()))
		}
	}
} 