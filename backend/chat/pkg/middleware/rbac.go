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
	RoleAE            = "AE"
	RoleStaff         = "Mentee"
	RoleMentor        = "Mentor"
	RoleStudent       = "Fresher"
	RoleSMO           = "SMO" // Add SMO role
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

// getUserRoleFromToken is a helper method to extract user role from JWT token using sub (userID)
func (r *RBACMiddleware) getUserRoleFromToken(ctx *fiber.Ctx) (string, error) {
	log.Printf("[RBAC] Starting getUserRoleFromToken")

	// Extract userID using the improved context extraction method
	userID, err := r.ExtractUserIDFromContext(ctx)
	if err != nil {
		log.Printf("[RBAC] Failed to extract userID from context: %v", err)
		return "", err
	}
	log.Printf("[RBAC] UserID extracted successfully: %s", userID)

	role, err := r.GetUserRole(userID)
	if err != nil {
		log.Printf("[RBAC] Failed to get user role: %v", err)
		return "", err
	}
	log.Printf("[RBAC] User role retrieved successfully: %s", role)

	return role, nil
}

// FindUserByID finds a user by their userID (sub from JWT)
func (r *RBACMiddleware) FindUserByID(userID string) (bson.M, error) {
	log.Printf("[RBAC] Looking for user with ID: %s", userID)

	// Convert string userID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("[RBAC] Invalid user ID format: %s - %v", userID, err)
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}
	log.Printf("[RBAC] User ID converted to ObjectID: %s", objectID.Hex())

	// Find user by userID
	var user bson.M
	err = r.db.Collection("users").FindOne(context.TODO(), bson.D{{Key: "_id", Value: objectID}}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("[RBAC] User not found in database: %s", userID)
			return nil, errors.New("user not found")
		}
		log.Printf("[RBAC] Database error while finding user: %s - %v", userID, err)
		return nil, err
	}

	log.Printf("[RBAC] User found successfully - ID: %s, Username: %s", userID, user["username"])
	return user, nil
}

// GetRoleNameByID finds a role name by role ID
func (r *RBACMiddleware) GetRoleNameByID(roleID primitive.ObjectID) (string, error) {
	log.Printf("[RBAC] Looking for role with ID: %s", roleID.Hex())

	// Find role by role ID in roles collection
	var role bson.M
	err := r.db.Collection("roles").FindOne(context.TODO(), bson.D{{Key: "_id", Value: roleID}}).Decode(&role)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("[RBAC] Role not found in database: %s", roleID.Hex())
			return "", errors.New("role not found")
		}
		log.Printf("[RBAC] Database error while finding role: %s - %v", roleID.Hex(), err)
		return "", err
	}

	// Get role name from role document
	roleName, ok := role["name"].(string)
	if !ok {
		log.Printf("[RBAC] Role name field not found in role document: %s", roleID.Hex())
		return "", errors.New("role name not found")
	}

	log.Printf("[RBAC] Role found successfully - ID: %s, Name: %s", roleID.Hex(), roleName)
	return roleName, nil
}

// RequireWritePermission checks if user has write permission in read-only rooms
func (r *RBACMiddleware) RequireWritePermission() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		log.Printf("[RBAC] RequireWritePermission - Checking permissions for path: %s", ctx.Path())

		role, err := r.getUserRoleFromToken(ctx)
		if err != nil {
			log.Printf("[RBAC] RequireWritePermission - Authentication failed: %v", err)
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Authentication required",
			})
		}

		log.Printf("[RBAC] RequireWritePermission - User role: %s, Required roles: [%s, %s]", role, RoleAdministrator, RoleStaff)

		// Only Administrator and Staff can write in read-only rooms
		if role == RoleAdministrator || role == RoleStaff {
			log.Printf("[RBAC] RequireWritePermission - Access GRANTED for role: %s", role)
			return ctx.Next()
		}

		log.Printf("[RBAC] RequireWritePermission - Access DENIED for role: %s", role)
		return ctx.Status(403).JSON(fiber.Map{
			"error":   "INSUFFICIENT_PERMISSIONS",
			"message": "You don't have permission to write in this room",
		})
	}
}

func (r *RBACMiddleware) RequireWritePermissionForEvoucher() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		log.Printf("[RBAC] RequireWritePermissionForEvoucher - Checking permissions for path: %s", ctx.Path())

		role, err := r.getUserRoleFromToken(ctx)
		if err != nil {
			log.Printf("[RBAC] RequireWritePermissionForEvoucher - Authentication failed: %v", err)
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Authentication required",
			})
		}

		log.Printf("[RBAC] RequireWritePermissionForEvoucher - User role: %s, Required roles: [%s, %s, %s]", role, RoleAdministrator, RoleStaff, RoleAE)

		// Only Administrator and Staff and AE can write in read-only rooms
		if role == RoleAdministrator || role == RoleStaff || role == RoleAE {
			log.Printf("[RBAC] RequireWritePermissionForEvoucher - Access GRANTED for role: %s", role)
			return ctx.Next()
		}

		log.Printf("[RBAC] RequireWritePermissionForEvoucher - Access DENIED for role: %s", role)
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

// GetUserRole retrieves the role of a user by their userID (sub from JWT)
func (r *RBACMiddleware) GetUserRole(userID string) (string, error) {
	log.Printf("[RBAC] Getting role for user ID: %s", userID)

	// Find user by userID using FindUserByID
	user, err := r.FindUserByID(userID)
	if err != nil {
		log.Printf("[RBAC] Failed to find user: %v", err)
		return "", err
	}

	// Get role ID from user document (user.role field)
	roleID, ok := user["role"].(primitive.ObjectID)
	if !ok {
		log.Printf("[RBAC] User has no role assigned - userID: %s", userID)
		return "", errors.New("user has no role assigned")
	}
	log.Printf("[RBAC] User role ID extracted: %s", roleID.Hex())

	// Get role name by role ID
	roleName, err := r.GetRoleNameByID(roleID)
	if err != nil {
		log.Printf("[RBAC] Failed to get role name: %v", err)
		return "", err
	}

	log.Printf("[RBAC] Role lookup completed - User: %s, Role: %s, RoleID: %s", userID, roleName, roleID.Hex())
	return roleName, nil
}

// RequireRoles (refactored)
func (r *RBACMiddleware) RequireRoles(allowedRoles ...string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		log.Printf("[RBAC] RequireRoles - Checking permissions for path: %s", ctx.Path())
		log.Printf("[RBAC] RequireRoles - Allowed roles: %v", allowedRoles)

		role, err := r.getUserRoleFromToken(ctx)
		if err != nil {
			log.Printf("[RBAC] RequireRoles - Authentication failed: %v", err)
			return ctx.Status(401).JSON(fiber.Map{"error": "UNAUTHORIZED", "message": "Authentication required"})
		}

		log.Printf("[RBAC] RequireRoles - User role: %s", role)

		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				log.Printf("[RBAC] RequireRoles - Access GRANTED for role: %s (matches: %s)", role, allowedRole)
				return ctx.Next()
			}
		}

		log.Printf("[RBAC] RequireRoles - Access DENIED for role: %s (no match found)", role)
		return ctx.Status(403).JSON(fiber.Map{
			"error":       "INSUFFICIENT_PERMISSIONS",
			"message":     "You don't have the required role",
			"currentRole": role,
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

// Extract JWT token from query parameter first (for WebSocket), then Authorization header, then cookie
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
	log.Printf("[RBAC] Parsing JWT token...")

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Printf("[RBAC] WARNING: JWT_SECRET environment variable is not set")
		return "", "", errors.New("JWT_SECRET not configured")
	}
	log.Printf("[RBAC] JWT_SECRET is configured (length: %d)", len(jwtSecret))

	token, err := jwt.ParseWithClaims(tokenString, &JwtClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			log.Printf("[RBAC] Unexpected signing method: %v", token.Method.Alg())
			return nil, errors.New("unexpected signing method")
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		log.Printf("[RBAC] JWT parse error: %v", err)
		return "", "", err
	}

	if claims, ok := token.Claims.(*JwtClaims); ok && token.Valid {
		log.Printf("[RBAC] JWT claims parsed successfully - sub: %s, username: %s, exp: %v",
			claims.Sub, claims.Username, claims.ExpiresAt)
		return claims.Sub, claims.Username, nil
	}

	log.Printf("[RBAC] Invalid token claims or token not valid")
	return "", "", errors.New("invalid token claims")
}

// ExtractUserIDFromContext extracts userID from JWT token in any context (HTTP or WebSocket)
func (r *RBACMiddleware) ExtractUserIDFromContext(ctx any) (string, error) {
	var tokenString string
	var err error

	// Handle different context types
	switch c := ctx.(type) {
	case *fiber.Ctx:
		// HTTP context - try query parameter first for WebSocket upgrade requests
		tokenString = c.Query("token")
		if tokenString == "" {
			// Fallback to normal token extraction for HTTP requests
			tokenString, err = r.extractToken(c)
			if err != nil {
				return "", fmt.Errorf("failed to extract token: %w", err)
			}
		}
	case *websocket.Conn:
		// WebSocket context
		tokenString = c.Query("token")
		if tokenString == "" {
			return "", errors.New("no token found in query parameters")
		}
	default:
		return "", fmt.Errorf("unsupported context type: %T", ctx)
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

// ExtractRoleNameFromToken extracts the role name from a JWT token
func (r *RBACMiddleware) ExtractRoleNameFromToken(tokenString string) (string, error) {
	if tokenString == "" {
		return "", errors.New("token string is empty")
	}

	userID, roleName, err := r.parseToken(tokenString)
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

	log.Printf("[DEBUG] Successfully extracted roleName %s from JWT token", roleName)
	return roleName, nil
}

// RequireRoleParam checks ?role=... in query param and matches it to roleName in JWT (?token=...)
func (r *RBACMiddleware) RequireRoleParam() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		requiredRole := ctx.Query("role")
		if requiredRole == "" {
			return ctx.Status(400).SendString("Missing role param")
		}
		tokenString := ctx.Query("token")
		roleName, err := r.ExtractRoleNameFromToken(tokenString)
		if err != nil {
			return ctx.Status(401).SendString("Invalid token or role")
		}
		if strings.ToLower(roleName) != strings.ToLower(requiredRole) {
			return ctx.Status(403).SendString("Insufficient role")
		}
		return ctx.Next()
	}
}
