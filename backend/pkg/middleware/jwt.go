// HLLC-2025/backend/pkg/middleware/jwt.go

package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func JWTMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract token from query parameter or Authorization header
		tokenString := c.Query("token")
		if tokenString == "" {
			authHeader := c.Get("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			}
		}

		if tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing token",
			})
		}

		// Validate the JWT token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid token",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid token claims",
			})
		}

		// Extract user information
		userId, ok := claims["sub"].(string)
		if !ok || userId == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing or invalid user ID",
			})
		}

		// Validate that the user ID is a valid MongoDB ObjectID
		if _, err := primitive.ObjectIDFromHex(userId); err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid user ID format",
			})
		}

		username, _ := claims["username"].(string)
		role, _ := claims["role"].(string)

		// Attach the claims to the request context
		c.Locals("userId", userId)
		c.Locals("username", username)
		c.Locals("role", role)

		return c.Next()
	}
}
