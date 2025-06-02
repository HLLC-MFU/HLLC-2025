package middleware

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func WrapWebSocketHandler(jwt fiber.Handler, handler func(*websocket.Conn, string, string, string)) func(*fiber.Ctx) error {
	return func(c *fiber.Ctx) error {
		if err := jwt(c); err != nil {
			return err
		}

		userID, ok := c.Locals("userId").(string)
		if !ok {
			log.Println("[WS Middleware] Missing userId in Locals")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
		}

		username, ok := c.Locals("username").(string)
		if !ok {
			log.Println("[WS Middleware] Missing username in Locals")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
		}

		roomID := c.Params("roomId")
		log.Println("[WS Middleware] user:", userID, username, "room:", roomID)

		return websocket.New(func(conn *websocket.Conn) {
			handler(conn, userID, username, roomID)
		})(c)
	}
}


