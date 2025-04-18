package middleware

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

// LoggingMiddleware logs request details
func LoggingMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		
		// Store the request ID if present
		requestID := c.Get("X-Request-ID")
		if requestID == "" {
			requestID = fmt.Sprintf("%d", time.Now().UnixNano())
		}
		c.Locals("request_id", requestID)

		// Process request
		err := c.Next()

		// Log request details
		duration := time.Since(start)
		status := c.Response().StatusCode()
		method := c.Method()
		path := c.Path()
		ip := c.IP()

		fmt.Printf(
			"[%s] %s %s %d %v %s\n",
			requestID,
			method,
			path,
			status,
			duration,
			ip,
		)

		return err
	}
}

// RequestIDMiddleware adds request ID to response headers
func RequestIDMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		requestID := c.Get("X-Request-ID")
		if requestID == "" {
			requestID = fmt.Sprintf("%d", time.Now().UnixNano())
		}
		
		c.Set("X-Request-ID", requestID)
		return c.Next()
	}
} 