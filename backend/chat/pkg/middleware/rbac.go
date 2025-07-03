package middleware

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Available roles for RBAC
const (
	RoleAdministrator = "Administrator"
	RoleAE = "AE"
	RoleStaff        = "Staff"
	RoleStudent      = "Student"
)

// Room access permissions
const (
	PermissionWrite = "write"
	PermissionRead  = "read"
)

type RBACMiddleware struct {
	db *mongo.Database
}

func NewRBACMiddleware(db *mongo.Database) *RBACMiddleware {
	return &RBACMiddleware{db: db}
}

// JWT Claims structure matching NestJS JwtPayload
type JwtClaims struct {
	Sub      string `json:"sub"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// RequireWritePermission checks if user has write permission in read-only rooms
func (r *RBACMiddleware) RequireWritePermission() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID, err := r.getUserIDFromToken(ctx)
		if err != nil {
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Authentication required",
			})
		}

		role, err := r.GetUserRole(userID)
		if err != nil {
			return ctx.Status(500).JSON(fiber.Map{
				"error":   "INTERNAL_ERROR",
				"message": "Failed to verify user role",
			})
		}

		// Only Administrator and Staff can write in read-only rooms
		if role == RoleAdministrator || role == RoleStaff {
			return ctx.Next()
		}

		return ctx.Status(403).JSON(fiber.Map{
			"error":   "INSUFFICIENT_PERMISSIONS",
			"message": "You don't have permission to write in this room",
		})
	}
}

func (r *RBACMiddleware) RequireWritePermissionForEvoucher() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID, err := r.getUserIDFromToken(ctx)
		if err != nil {
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Authentication required",
			})
		}

		role, err := r.GetUserRole(userID)
		if err != nil {
			return ctx.Status(500).JSON(fiber.Map{
				"error":   "INTERNAL_ERROR",
				"message": "Failed to verify user role",
			})
		}

		// Only Administrator and Staff and AE can write in read-only rooms
		if role == RoleAdministrator || role == RoleStaff || role == RoleAE {
			return ctx.Next()
		}

		return ctx.Status(403).JSON(fiber.Map{
			"error":   "INSUFFICIENT_PERMISSIONS",
			"message": "You don't have permission to write in this room",
		})
	}
}

// RequireReadOnlyAccess allows read access for all authenticated users
func (r *RBACMiddleware) RequireReadOnlyAccess() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		_, err := r.getUserIDFromToken(ctx)
		if err != nil {
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Authentication required",
			})
		}
		return ctx.Next()
	}
}

// GetUserRole retrieves the role name for a given user ID
func (r *RBACMiddleware) GetUserRole(userID string) (string, error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return "", err
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{{Key: "_id", Value: objectID}}}},
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "roles"},
			{Key: "localField", Value: "role"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "roleInfo"},
		}}},
		{{Key: "$unwind", Value: "$roleInfo"}},
		{{Key: "$project", Value: bson.D{
			{Key: "roleName", Value: "$roleInfo.name"},
		}}},
	}

	cursor, err := r.db.Collection("users").Aggregate(context.TODO(), pipeline)
	if err != nil {
		return "", err
	}
	defer cursor.Close(context.TODO())

	var result struct {
		RoleName string `bson:"roleName"`
	}

	if !cursor.Next(context.TODO()) {
		return "", errors.New("user not found")
	}

	if err := cursor.Decode(&result); err != nil {
		return "", err
	}

	return result.RoleName, nil
}

// getUserIDFromToken is a helper method to extract user ID from JWT token
func (r *RBACMiddleware) getUserIDFromToken(ctx *fiber.Ctx) (string, error) {
	tokenString, err := r.extractToken(ctx)
	if err != nil {
		return "", err
	}

	return r.parseToken(tokenString)
}

// RequireRoles creates a middleware that requires any of the specified role names
func (r *RBACMiddleware) RequireRoles(allowedRoles ...string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		log.Printf("[RBAC] Middleware called for path: %s, method: %s, required roles: %v", 
			ctx.Path(), ctx.Method(), allowedRoles)
		
		// Extract JWT token
		tokenString, err := r.extractToken(ctx)
		if err != nil {
			log.Printf("[RBAC] Token extraction failed: %v", err)
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Authentication token required",
			})
		}
		
		// Parse JWT token to get user ID
		userID, err := r.parseToken(tokenString)
		if err != nil {
			log.Printf("[RBAC] Token parsing failed: %v", err)
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED", 
				"message": "Invalid authentication token",
			})
		}
		
		// Convert user ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			log.Printf("[RBAC] Invalid user ID format: %v", err)
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Invalid user ID in token",
			})
		}
		
		// Query user with role information
		pipeline := mongo.Pipeline{
			{{Key: "$match", Value: bson.D{{Key: "_id", Value: objectID}}}},
			{{Key: "$lookup", Value: bson.D{
				{Key: "from", Value: "roles"},
				{Key: "localField", Value: "role"},
				{Key: "foreignField", Value: "_id"},
				{Key: "as", Value: "roleInfo"},
			}}},
			{{Key: "$unwind", Value: "$roleInfo"}},
			{{Key: "$project", Value: bson.D{
				{Key: "_id", Value: 1},
				{Key: "username", Value: 1},
				{Key: "roleName", Value: "$roleInfo.name"},
			}}},
		}
		
		cursor, err := r.db.Collection("users").Aggregate(context.TODO(), pipeline)
		if err != nil {
			log.Printf("[RBAC] Database query error: %v", err)
			return ctx.Status(500).JSON(fiber.Map{
				"error":   "INTERNAL_ERROR",
				"message": "Failed to verify user permissions",
			})
		}
		defer cursor.Close(context.TODO())
		
		var user struct {
			ID       primitive.ObjectID `bson:"_id"`
			Username string            `bson:"username"`
			RoleName string            `bson:"roleName"`
		}
		
		if !cursor.Next(context.TODO()) {
			log.Printf("[RBAC] User not found: %s", userID)
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "User not found",
			})
		}
		
		if err := cursor.Decode(&user); err != nil {
			log.Printf("[RBAC] Failed to decode user: %v", err)
			return ctx.Status(500).JSON(fiber.Map{
				"error":   "INTERNAL_ERROR",
				"message": "Failed to process user data",
			})
		}
		
		// Check if user's role is in the required roles
		for _, role := range allowedRoles {
			if user.RoleName == role {
				log.Printf("[RBAC] Access granted: User %s (%s) has role %s", user.Username, userID, user.RoleName)
				return ctx.Next()
			}
		}
		
		log.Printf("[RBAC] Access denied: User %s (%s) has role %s, but requires one of: %v", 
			user.Username, userID, user.RoleName, allowedRoles)
		
		return ctx.Status(403).JSON(fiber.Map{
			"error":        "INSUFFICIENT_PERMISSIONS",
			"message":      "You don't have the required role to access this resource",
			"requiredRoles": allowedRoles,
			"currentRole":   user.RoleName,
		})
	}
}

// RequireAdministrator is a convenient method for Administrator-only endpoints
func (r *RBACMiddleware) RequireAdministrator() fiber.Handler {
	return r.RequireRoles(RoleAdministrator)
}

// RequireAdminAndStaff allows both Administrator and Staff roles (example for future use)
func (r *RBACMiddleware) RequireAdminAndStaff() fiber.Handler {
	return r.RequireRoles(RoleAdministrator, RoleStaff)
}

// SetUserRoleInContext creates a middleware that sets the user's role in the context
func (r *RBACMiddleware) SetUserRoleInContext() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		// Extract JWT token
		tokenString, err := r.extractToken(ctx)
		if err != nil {
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Authentication token required",
			})
		}
		
		// Parse JWT token to get user ID
		userID, err := r.parseToken(tokenString)
		if err != nil {
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED", 
				"message": "Invalid authentication token",
			})
		}

		// Get user role
		role, err := r.GetUserRole(userID)
		if err != nil {
			return ctx.Status(500).JSON(fiber.Map{
				"error":   "INTERNAL_ERROR",
				"message": "Failed to get user role",
			})
		}

		// Set role in context
		ctx.Locals("userRole", role)
		
		return ctx.Next()
	}
}

// Helper methods

// Extract JWT token from Authorization header, cookie, or query parameter
func (r *RBACMiddleware) extractToken(c *fiber.Ctx) (string, error) {
	// Try Authorization header first
	authHeader := c.Get("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
			log.Printf("[DEBUG] JWT token extracted from Authorization header: %s", parts[1])
			return parts[1], nil
		}
	}
	// Try cookie as fallback
	token := c.Cookies("accessToken")
	if token != "" {
		log.Printf("[DEBUG] JWT token extracted from cookie: %s", token)
		return token, nil
	}
	// Try query parameter (for WebSocket connections)
	token = c.Query("token")
	if token != "" {
		log.Printf("[DEBUG] JWT token extracted from query param: %s", token)
		return token, nil
	}
	log.Printf("[DEBUG] No JWT token found in header, cookie, or query param")
	return "", errors.New("no token found")
}

// Parse JWT token and extract user ID
func (r *RBACMiddleware) parseToken(tokenString string) (string, error) {
	// Get JWT secret from environment or use default from NestJS config
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "pngwpeonhgperpongp" // Default from NestJS configuration
	}
	log.Printf("[DEBUG] Using JWT_SECRET: %s", jwtSecret)

	token, err := jwt.ParseWithClaims(tokenString, &JwtClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		log.Printf("[DEBUG] JWT parse error: %v", err)
		return "", err
	}

	if claims, ok := token.Claims.(*JwtClaims); ok && token.Valid {
		log.Printf("[DEBUG] JWT claims parsed successfully: sub=%s username=%s", claims.Sub, claims.Username)
		return claims.Sub, nil
	}

	log.Printf("[DEBUG] Invalid token claims")
	return "", errors.New("invalid token claims")
}

// ExtractUserIDFromContext extracts userID from JWT token in any context (HTTP or WebSocket)
func (r *RBACMiddleware) ExtractUserIDFromContext(ctx interface{}) (string, error) {
	var tokenString string
	var err error

	// Handle different context types
	switch c := ctx.(type) {
	case *fiber.Ctx:
		// HTTP context
		tokenString, err = r.extractToken(c)
	case *websocket.Conn:
		// WebSocket context
		tokenString = c.Query("token")
		if tokenString == "" {
			return "", errors.New("no token found in query parameters")
		}
	default:
		return "", errors.New("unsupported context type")
	}

	if err != nil {
		return "", fmt.Errorf("failed to extract token: %w", err)
	}

	// Parse token to get userID
	userID, err := r.parseToken(tokenString)
	if err != nil {
		return "", fmt.Errorf("failed to parse token: %w", err)
	}

	log.Printf("[DEBUG] Successfully extracted userID %s from JWT token", userID)
	return userID, nil
}

// ExtractUserIDFromToken is a convenience function for WebSocket connections
func (r *RBACMiddleware) ExtractUserIDFromToken(tokenString string) (string, error) {
	if tokenString == "" {
		return "", errors.New("token string is empty")
	}

	userID, err := r.parseToken(tokenString)
	if err != nil {
		return "", fmt.Errorf("failed to parse token: %w", err)
	}

	log.Printf("[DEBUG] Successfully extracted userID %s from JWT token", userID)
	return userID, nil
}

 