package middleware

import (
	"context"
	"strings"

	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/security"
	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// AuthMiddleware handles authentication for HTTP requests
func AuthMiddleware(secretKey string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Check for token in Authorization header
		authHeader := c.Get("Authorization")
		var tokenString string

		if authHeader != "" {
			// Extract token from Bearer scheme
			tokenParts := strings.Split(authHeader, " ")
			if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"status": false,
					"error": "invalid authorization format, use Bearer token",
					"code": "invalid_auth_format",
				})
			}
			tokenString = tokenParts[1]
		} else {
			// If not in header, try to get from cookies
			cookie := c.Cookies("access_token")
			if cookie == "" {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"status": false,
					"error": "missing authentication token",
					"code": "missing_token",
				})
			}
			tokenString = cookie
		}

		// Validate token
		claims, err := security.ParseToken(secretKey, tokenString)
		if err != nil {
			statusCode := fiber.StatusUnauthorized
			errorCode := "invalid_token"
			errorMsg := "invalid token"
			
			if err == security.ErrTokenExpired {
				errorMsg = "token expired"
				errorCode = "token_expired"
			}
			
			return c.Status(statusCode).JSON(fiber.Map{
				"status": false,
				"error": errorMsg,
				"code": errorCode,
			})
		}

		// Check token type
		if claims.TokenType != security.TokenTypeAccess {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"status": false,
				"error": "invalid token type",
				"code": "invalid_token_type",
			})
		}

		// Store claims in context
		c.Locals("user_id", claims.UserID)
		c.Locals("username", claims.Username)
		c.Locals("role_codes", claims.RoleCodes)
		c.Locals("session_id", claims.SessionID)

		return c.Next()
	}
}

// RoleMiddleware checks if user has required roles
func RoleMiddleware(requiredRoles []string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get role codes from context
		roleCodes, ok := c.Locals("role_codes").([]string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"status": false,
				"error": "missing user roles",
				"code": "missing_roles",
			})
		}
		
		// Check if user has any of the required roles
		hasRole := false
		for _, required := range requiredRoles {
			for _, roleCode := range roleCodes {
				if required == roleCode {
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
				"status": false,
				"error": "insufficient permissions",
				"code": "insufficient_permissions",
				"required_roles": requiredRoles,
			})
		}

		return c.Next()
	}
}

// AuthInterceptor is a gRPC interceptor for authentication
func AuthInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	// Skip authentication for certain methods
	if isPublicMethod(info.FullMethod) {
		return handler(ctx, req)
	}

	// Get metadata from context
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "missing metadata")
	}

	// Get authorization token
	authHeader := md.Get("authorization")
	if len(authHeader) == 0 {
		return nil, status.Error(codes.Unauthenticated, "missing authorization header")
	}

	// Extract token from Bearer scheme
	token := strings.TrimPrefix(authHeader[0], "Bearer ")
	if token == authHeader[0] {
		return nil, status.Error(codes.Unauthenticated, "invalid authorization format")
	}

	// TODO: Validate token with auth service
	// For now, we'll just check if the token is not empty
	if token == "" {
		return nil, status.Error(codes.Unauthenticated, "invalid token")
	}

	// Call the handler
	return handler(ctx, req)
}

// isPublicMethod checks if the method is public (doesn't require authentication)
func isPublicMethod(method string) bool {
	publicMethods := map[string]bool{
		"/school.SchoolService/ListSchools": true,
		"/school.SchoolService/GetSchool":   true,
		"/major.MajorService/ListMajors":    true,
		"/major.MajorService/GetMajor":      true,
	}
	return publicMethods[method]
} 