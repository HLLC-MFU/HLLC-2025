package middleware

import (
	"context"
	"errors"
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Available roles for RBAC
const (
	RoleAdministrator = "Administrator"
	RoleStudent       = "Student"
	// Future roles can be added here
	// RoleModerator     = "Moderator"
	// RoleTeacher       = "Teacher"
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

// RequireAdminOrStudent allows both Administrator and Student roles (example for future use)
func (r *RBACMiddleware) RequireAdminOrStudent() fiber.Handler {
	return r.RequireRoles(RoleAdministrator, RoleStudent)
}

// Helper methods

// Extract JWT token from Authorization header or cookie
func (r *RBACMiddleware) extractToken(c *fiber.Ctx) (string, error) {
	// Try Authorization header first
	authHeader := c.Get("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
			return parts[1], nil
		}
	}
	
	// Try cookie as fallback
	token := c.Cookies("accessToken")
	if token != "" {
		return token, nil
	}
	
	return "", errors.New("no token found")
}

// Parse JWT token and extract user ID
func (r *RBACMiddleware) parseToken(tokenString string) (string, error) {
	// Get JWT secret from environment or use default from NestJS config
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "pngwpeonhgperpongp" // Default from NestJS configuration
	}
	
	token, err := jwt.ParseWithClaims(tokenString, &JwtClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(jwtSecret), nil
	})
	
	if err != nil {
		return "", err
	}
	
	if claims, ok := token.Claims.(*JwtClaims); ok && token.Valid {
		return claims.Sub, nil
	}
	
	return "", errors.New("invalid token claims")
}

 