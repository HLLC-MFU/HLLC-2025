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
	RoleStaff        = "Mentee"
	RoleStudent      = "Fresher"
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

// getUserIDFromToken is a helper method to extract user ID from JWT token
func (r *RBACMiddleware) getUserIDFromToken(ctx *fiber.Ctx) (string, error) {
	tokenString, err := r.extractToken(ctx)
	if err != nil {
		return "", err
	}
	userID, _, err := r.parseToken(tokenString)
	return userID, err
}

// getUserRoleFromToken is a helper method to extract user role from JWT token using username
func (r *RBACMiddleware) getUserRoleFromToken(ctx *fiber.Ctx) (string, error) {
	tokenString, err := r.extractToken(ctx)
	if err != nil {
		return "", err
	}
	_, username, err := r.parseToken(tokenString)
	if err != nil {
		return "", err
	}
	return r.GetUserRoleByUsername(username)
}

// RequireWritePermission checks if user has write permission in read-only rooms
func (r *RBACMiddleware) RequireWritePermission() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		role, err := r.getUserRoleFromToken(ctx)
		if err != nil {
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Authentication required",
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
		role, err := r.getUserRoleFromToken(ctx)
		if err != nil {
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Authentication required",
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

func (r *RBACMiddleware) RequireAnyRole() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		return ctx.Next()
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

// Helper: Pipeline สำหรับ lookup role
func userWithRolePipeline(userID primitive.ObjectID) mongo.Pipeline {
	return mongo.Pipeline{
		{{Key: "$match", Value: bson.D{{Key: "_id", Value: userID}}}},
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "roles"},
			{Key: "localField", Value: "role"},
			{Key: "foreignField", Value: "_id"},
			{Key: "as", Value: "roleInfo"},
		}}},
		{{Key: "$unwind", Value: "$roleInfo"}},
		{{Key: "$project", Value: bson.D{
			{Key: "roleName", Value: "$roleInfo.name"},
			{Key: "username", Value: 1},
		}}},
	}
}

// Helper: Extract roleName, username จาก cursor
func extractRoleFromCursor(cursor *mongo.Cursor) (roleName, username string, err error) {
	if !cursor.Next(context.TODO()) {
		return "", "", errors.New("user not found")
	}
	var result bson.M
	if err := cursor.Decode(&result); err != nil {
		return "", "", err
	}
	roleName, _ = result["roleName"].(string)
	username, _ = result["username"].(string)
	return roleName, username, nil
}

// GetUserRole (refactored)
func (r *RBACMiddleware) GetUserRole(userID string) (string, error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return "", err
	}
	cursor, err := r.db.Collection("users").Aggregate(context.TODO(), userWithRolePipeline(objectID))
	if err != nil {
		return "", err
	}
	defer cursor.Close(context.TODO())
	roleName, _, err := extractRoleFromCursor(cursor)
	return roleName, err
}

// GetUserRoleByUsername retrieves the role of a user by their username.
func (r *RBACMiddleware) GetUserRoleByUsername(username string) (string, error) {
	// First, find user by username
	var user bson.M
	err := r.db.Collection("users").FindOne(context.TODO(), bson.D{{Key: "username", Value: username}}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return "", errors.New("user not found")
		}
		return "", err
	}

	// Get role ID from user document
	roleID, ok := user["role"].(primitive.ObjectID)
	if !ok {
		return "", errors.New("user has no role assigned")
	}

	// Find role by role ID
	var role bson.M
	err = r.db.Collection("roles").FindOne(context.TODO(), bson.D{{Key: "_id", Value: roleID}}).Decode(&role)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return "", errors.New("role not found")
		}
		return "", err
	}

	// Get role name
	roleName, ok := role["name"].(string)
	if !ok {
		return "", errors.New("role name not found")
	}

	log.Printf("[RBAC] Found role '%s' for user '%s'", roleName, username)
	return roleName, nil
}

// RequireRoles (refactored)
func (r *RBACMiddleware) RequireRoles(allowedRoles ...string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		role, err := r.getUserRoleFromToken(ctx)
		if err != nil {
			return ctx.Status(401).JSON(fiber.Map{"error": "UNAUTHORIZED", "message": "Authentication required"})
		}
		
		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				return ctx.Next()
			}
		}
		return ctx.Status(403).JSON(fiber.Map{
			"error":         "INSUFFICIENT_PERMISSIONS",
			"message":       "You don't have the required role",
			"currentRole":   role,
		})
	}
}

// RequireAdministrator is a convenient method for Administrator-only endpoints
func (r *RBACMiddleware) RequireAdministrator() fiber.Handler {
	log.Printf("[RBAC] RequireAdministrator middleware created, requiring role: %s", RoleAdministrator)
	return r.RequireRoles(RoleAdministrator)
}

// RequireAdminAndStaff allows both Administrator and Staff roles (example for future use)
func (r *RBACMiddleware) RequireAdminAndStaff() fiber.Handler {
	return r.RequireRoles(RoleAdministrator, RoleStaff)
}

// SetUserRoleInContext creates a middleware that sets the user's role in the context
func (r *RBACMiddleware) SetUserRoleInContext() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		// Get user role directly from token
		role, err := r.getUserRoleFromToken(ctx)
		if err != nil {
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Authentication token required",
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
			log.Printf("[RBAC] JWT token extracted from Authorization header: %s", parts[1])
			return parts[1], nil
		}
	}
	// Try cookie as fallback
	token := c.Cookies("accessToken")
	if token != "" {
		log.Printf("[RBAC] JWT token extracted from cookie: %s", token)
		return token, nil
	}
	// Try query parameter (for WebSocket connections)
	token = c.Query("token")
	if token != "" {
		log.Printf("[RBAC] JWT token extracted from query param: %s", token)
		return token, nil
	}
	log.Printf("[RBAC] No JWT token found in header, cookie, or query param")
	return "", errors.New("no token found")
}

// Parse JWT token and extract user ID
func (r *RBACMiddleware) parseToken(tokenString string) (string, string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	log.Printf("[RBAC] Using JWT_SECRET: %s", jwtSecret)

	token, err := jwt.ParseWithClaims(tokenString, &JwtClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		log.Printf("[RBAC] JWT parse error: %v", err)
		return "", "", err
	}

	if claims, ok := token.Claims.(*JwtClaims); ok && token.Valid {
		log.Printf("[RBAC] JWT claims parsed successfully: sub=%s username=%s", claims.Sub, claims.Username)
		return claims.Sub, claims.Username, nil
	}

	log.Printf("[RBAC] Invalid token claims")
	return "", "", errors.New("invalid token claims")
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
	userID, _, err := r.parseToken(tokenString)
	if err != nil {
		return "", fmt.Errorf("failed to parse token: %w", err)
	}

	// Validate userID is a valid MongoDB ObjectID
	if len(userID) != 24 {
		log.Printf("[RBAC] Extracted userID from JWT is not a valid ObjectID: %s", userID)
		return "", fmt.Errorf("userID in JWT 'sub' claim is not a valid ObjectID: %s", userID)
	}
	if _, err := primitive.ObjectIDFromHex(userID); err != nil {
		log.Printf("[RBAC] Extracted userID from JWT is not a valid ObjectID: %s", userID)
		return "", fmt.Errorf("userID in JWT 'sub' claim is not a valid ObjectID: %s", userID)
	}

	log.Printf("[DEBUG] Successfully extracted userID %s from JWT token", userID)
	return userID, nil
}

// ExtractUserIDFromToken is a convenience function for WebSocket connections
func (r *RBACMiddleware) ExtractUserIDFromToken(tokenString string) (string, error) {
	if tokenString == "" {
		return "", errors.New("token string is empty")
	}

	userID, _, err := r.parseToken(tokenString)
	if err != nil {
		return "", fmt.Errorf("failed to parse token: %w", err)
	}

	log.Printf("[DEBUG] Successfully extracted userID %s from JWT token", userID)
	return userID, nil
}
