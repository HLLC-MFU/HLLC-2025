package middleware

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/golang-jwt/jwt/v5"
)

func ParseJWT(c *fiber.Ctx) (userID string, username string, err error) {
	authHeader := c.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return "", "", fmt.Errorf("missing or malformed Authorization header")
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil || !token.Valid {
		return "", "", fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", "", fmt.Errorf("invalid token claims")
	}

	userID, _ = claims["sub"].(string)
	username, _ = claims["username"].(string)

	if userID == "" || username == "" {
		return "", "", fmt.Errorf("missing fields in token")
	}

	return userID, username, nil
}


// ใช้แทน websocket.New(...) โดยจะ inject JWT ก่อน
func WrapWebSocketWithJWT(_ fiber.Handler, handler func(*websocket.Conn, string, string, string)) fiber.Handler {
	return func(c *fiber.Ctx) error {
		log.Println("[WrapWS] Attempting WebSocket auth for room:", c.Params("roomId"))

		userID, username, err := ParseJWT(c)
		if err != nil {
			log.Println("[WrapWS] JWT error:", err)
			return fiber.ErrUnauthorized
		}

		roomID := c.Params("roomId")
		if userID == "" || username == "" || roomID == "" {
			log.Println("[WrapWS] missing locals:", userID, username, roomID)
			return fiber.ErrUnauthorized
		}

		log.Println("[WrapWS] Authorized:", username, "room:", roomID)

		return websocket.New(func(conn *websocket.Conn) {
			handler(conn, userID, username, roomID)
		})(c)
	}
}




