package response

import "github.com/gofiber/fiber/v2"

/**
 * Response struct
 *
 * @author Dev. Bengi (Backend Team)
 */

type Response struct {
	Status  bool        `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

func Error(c *fiber.Ctx, statusCode int, message string) error {
	return c.Status(statusCode).JSON(Response{
		Status:  false,
		Message: message,
	})
}

func Success(c *fiber.Ctx, statusCode int, data interface{}) error {
	return c.Status(statusCode).JSON(Response{
		Status: true,
		Data:   data,
	})
}

func SuccessWithMessage(c *fiber.Ctx, statusCode int, message string, data interface{}) error {
	return c.Status(statusCode).JSON(Response{
		Status:  true,
		Message: message,
		Data:    data,
	})
}