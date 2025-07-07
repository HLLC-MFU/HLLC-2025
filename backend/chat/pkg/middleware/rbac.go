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

// GetUserRole retrieves the role name for a given user ID
func (r *RBACMiddleware) GetUserRole(userID string) (string, error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("[RBAC] Invalid user ID format: %s, error: %v", userID, err)
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

	log.Printf("[RBAC] Querying user role for userID: %s", userID)
	cursor, err := r.db.Collection("users").Aggregate(context.TODO(), pipeline)
	if err != nil {
		log.Printf("[RBAC] Database query error: %v", err)
		return "", err
	}
	defer cursor.Close(context.TODO())

	if !cursor.Next(context.TODO()) {
		log.Printf("[RBAC] User not found in database: %s", userID)
		return "", errors.New("user not found")
	}

	// Use bson.M to decode the result
	var result bson.M
	if err := cursor.Decode(&result); err != nil {
		log.Printf("[RBAC] Failed to decode user role: %v", err)
		return "", err
	}

	log.Printf("[RBAC] Raw result from pipeline: %+v", result)
	
	// Extract roleName from the result
	roleName, ok := result["roleName"].(string)
	if !ok {
		log.Printf("[RBAC] roleName is not a string or is missing: %v", result["roleName"])
		return "", errors.New("role name not found or invalid")
	}

	log.Printf("[RBAC] Found role for user %s: %s", userID, roleName)
	return roleName, nil
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
		log.Printf("[RBAC] ===== RequireRoles middleware START =====")
		log.Printf("[RBAC] RequireRoles middleware called for path: %s, method: %s, required roles: %v",
			ctx.Path(), ctx.Method(), allowedRoles)

		// Extract JWT token
		log.Printf("[RBAC] Extracting JWT token...")
		tokenString, err := r.extractToken(ctx)
		if err != nil {
			log.Printf("[RBAC] Token extraction failed: %v", err)
			log.Printf("[RBAC] ===== RequireRoles middleware END (TOKEN_EXTRACTION_FAILED) =====")
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Authentication token required",
			})
		}

		// Parse JWT token to get user ID
		log.Printf("[RBAC] Parsing JWT token...")
		userID, err := r.parseToken(tokenString)
		if err != nil {
			log.Printf("[RBAC] Token parsing failed: %v", err)
			log.Printf("[RBAC] ===== RequireRoles middleware END (TOKEN_PARSING_FAILED) =====")
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Invalid authentication token",
			})
		}

		log.Printf("[RBAC] Successfully extracted userID: %s", userID)

		// Convert user ID to ObjectID
		log.Printf("[RBAC] Converting userID to ObjectID: %s", userID)
		objectID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			log.Printf("[RBAC] Invalid user ID format: %v", err)
			log.Printf("[RBAC] ===== RequireRoles middleware END (OBJECTID_CONVERSION_FAILED) =====")
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "Invalid user ID in token",
			})
		}

		log.Printf("[RBAC] Successfully converted to ObjectID: %s", objectID.Hex())

		// Query user with role information
		log.Printf("[RBAC] Querying user with role for userID: %s", userID)
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
				{Key: "name", Value: "$roleInfo.name"},
			}}},
		}

		log.Printf("[RBAC] Executing MongoDB aggregation pipeline...")
		cursor, err := r.db.Collection("users").Aggregate(context.TODO(), pipeline)
		if err != nil {
			log.Printf("[RBAC] Database query error: %v", err)
			log.Printf("[RBAC] ===== RequireRoles middleware END (DATABASE_QUERY_FAILED) =====")
			return ctx.Status(500).JSON(fiber.Map{
				"error":   "INTERNAL_ERROR",
				"message": "Failed to verify user permissions",
			})
		}
		defer cursor.Close(context.TODO())

		log.Printf("[RBAC] Database query completed successfully")

		log.Printf("[RBAC] Checking if cursor has next document...")
		if !cursor.Next(context.TODO()) {
			log.Printf("[RBAC] User not found in database: %s", userID)
			log.Printf("[RBAC] ===== RequireRoles middleware END (USER_NOT_FOUND) =====")
			return ctx.Status(401).JSON(fiber.Map{
				"error":   "UNAUTHORIZED",
				"message": "User not found",
			})
		}

		log.Printf("[RBAC] Cursor has next document, decoding...")
		
		// Debug: decode to bson.M to see the actual document structure
		var rawDoc bson.M
		if err := cursor.Decode(&rawDoc); err != nil {
			log.Printf("[RBAC] Failed to decode to bson.M: %v", err)
			log.Printf("[RBAC] ===== RequireRoles middleware END (CURSOR_DECODE_FAILED) =====")
			return ctx.Status(500).JSON(fiber.Map{
				"error":   "INTERNAL_ERROR",
				"message": "Failed to process user data",
			})
		}
		log.Printf("[RBAC] Raw document from MongoDB: %+v", rawDoc)
		
		// Extract values from raw document
		userIDObj, ok := rawDoc["_id"].(primitive.ObjectID)
		if !ok {
			log.Printf("[RBAC] _id is not an ObjectID: %v", rawDoc["_id"])
			log.Printf("[RBAC] ===== RequireRoles middleware END (INVALID_ID) =====")
			return ctx.Status(500).JSON(fiber.Map{
				"error":   "INTERNAL_ERROR",
				"message": "Invalid user ID format",
			})
		}
		
		username, ok := rawDoc["username"].(string)
		if !ok {
			log.Printf("[RBAC] username is not a string: %v", rawDoc["username"])
			username = "unknown"
		}
		
		roleName, ok := rawDoc["name"].(string)
		if !ok {
			log.Printf("[RBAC] name is not a string: %v", rawDoc["name"])
			log.Printf("[RBAC] ===== RequireRoles middleware END (INVALID_ROLE) =====")
			return ctx.Status(500).JSON(fiber.Map{
				"error":   "INTERNAL_ERROR",
				"message": "Invalid role format",
			})
		}
		
		log.Printf("[RBAC] Extracted values: ID=%s, Username=%s, RoleName='%s'", userIDObj.Hex(), username, roleName)
		
		// Create user struct manually
		user := struct {
			ID       primitive.ObjectID
			Username string
			RoleName string
		}{
			ID:       userIDObj,
			Username: username,
			RoleName: roleName,
		}

		log.Printf("[RBAC] User found: ID=%s, Username=%s, RoleName='%s'", user.ID.Hex(), user.Username, user.RoleName)
		log.Printf("[RBAC] Checking role access: user role='%s', required roles=%v", user.RoleName, allowedRoles)
		for i, role := range allowedRoles {
			log.Printf("[RBAC] Comparing [%d]: '%s' == '%s' (length: %d vs %d)", i, user.RoleName, role, len(user.RoleName), len(role))
			if user.RoleName == role {
				log.Printf("[RBAC] Access granted: User %s (%s) has role '%s'", user.Username, userID, user.RoleName)
				log.Printf("[RBAC] ===== RequireRoles middleware END (GRANTED) =====")
				return ctx.Next()
			}
		}

		log.Printf("[RBAC] Access denied: User %s (%s) has role '%s', but requires one of: %v",
			user.Username, userID, user.RoleName, allowedRoles)

		log.Printf("[RBAC] Sending 403 Forbidden response")
		log.Printf("[RBAC] ===== RequireRoles middleware END (DENIED) =====")
		return ctx.Status(403).JSON(fiber.Map{
			"error":         "INSUFFICIENT_PERMISSIONS",
			"message":       "You don't have the required role to access this resource",
			"requiredRoles": allowedRoles,
			"currentRole":   user.RoleName,
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
func (r *RBACMiddleware) parseToken(tokenString string) (string, error) {
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
		return "", err
	}

	if claims, ok := token.Claims.(*JwtClaims); ok && token.Valid {
		log.Printf("[RBAC] JWT claims parsed successfully: sub=%s username=%s", claims.Sub, claims.Username)
		return claims.Sub, nil
	}

	log.Printf("[RBAC] Invalid token claims")
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

	userID, err := r.parseToken(tokenString)
	if err != nil {
		return "", fmt.Errorf("failed to parse token: %w", err)
	}

	log.Printf("[DEBUG] Successfully extracted userID %s from JWT token", userID)
	return userID, nil
}
