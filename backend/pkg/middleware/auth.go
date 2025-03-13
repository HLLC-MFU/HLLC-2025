package middleware

import (
	"strings"

	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/security"
	"github.com/gofiber/fiber/v2"
)

// AuthMiddleware handles authentication for HTTP requests
func AuthMiddleware(secretKey string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Check for token in Authorization header
		authHeader := c.Get("Authorization")
		var tokenString string

		if authHeader != "" {
			// Extract token from Bearer scheme
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			// If not in header, try to get from cookies
			cookie := c.Cookies("access_token")
			if cookie == "" {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "missing authentication token",
				})
			}
			tokenString = cookie
		}

		// Validate token
		claims, err := security.ParseToken(secretKey, tokenString)
		if err != nil {
			if err == security.ErrTokenExpired {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "token expired",
				})
			}
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid token",
			})
		}

		// Check token type
		if claims.TokenType != security.TokenTypeAccess {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid token type",
			})
		}

		// Store claims in context
		c.Locals("user_id", claims.UserID)
		c.Locals("username", claims.Username)
		c.Locals("role_ids", claims.RoleIds)

		return c.Next()
	}
}

// RoleMiddleware checks if user has required roles
func RoleMiddleware(requiredRoles []string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRoles := c.Locals("role_ids").([]string)
		
		// Check if user has any of the required roles
		hasRole := false
		for _, required := range requiredRoles {
			for _, userRole := range userRoles {
				if required == userRole {
					hasRole = true
					break
				}
			}
			if hasRole {
				break
			}
		}

		if !hasRole {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "insufficient permissions",
			})
		}

		return c.Next()
	}
} 