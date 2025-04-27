package response

import "github.com/gofiber/fiber/v2"

/**
 * Response struct
 *
 * @author Dev. Bengi (Backend Team)
 */

// Response is the standard API response structure
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// Success returns a successful response with the given data
func Success(c *fiber.Ctx, statusCode int, data interface{}) error {
	return c.Status(statusCode).JSON(Response{
		Success: true,
		Data:    data,
	})
}

// Error returns an error response with the given message
func Error(c *fiber.Ctx, statusCode int, message string) error {
	return c.Status(statusCode).JSON(Response{
		Success: false,
		Message: message,
	})
}

func SuccessWithMessage(c *fiber.Ctx, statusCode int, message string, data interface{}) error {
	return c.Status(statusCode).JSON(Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}