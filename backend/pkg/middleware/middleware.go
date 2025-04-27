package middleware

import (
	"context"
	"strings"

	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/security"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// AuthMiddleware handles authentication for HTTP requests using Authorization header
func AuthMiddleware(secretKey string) fiber.Handler {
	return func(c *fiber.Ctx) error {

		// Get authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			// Try from cookie
			cookie := c.Cookies("access_token")
			if cookie != "" {
				authHeader = "Bearer " + cookie
			} else {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"status": false,
					"error":  "authorization header or cookie is required",
					"code":   "missing_auth_header",
				})
			}
		}

		// Split the header into parts
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"status": false,
				"error":  "invalid authorization format, expected 'Bearer <token>'",
				"code":   "invalid_auth_format",
			})
		}

		// Extract the token
		tokenString := tokenParts[1]

		// Validate the JWT
		claims, err := security.ParseToken(secretKey, tokenString)
		if err != nil {
			statusCode := fiber.StatusUnauthorized
			errorCode := "invalid_token"
			errorMsg := "invalid token"

			// Check if token is expired
			if err == security.ErrTokenExpired {
				errorMsg = "token expired"
				errorCode = "token_expired"
			}

			// Check if token is blacklisted
			if err == security.ErrTokenBlacklisted {
				errorMsg = "token blacklisted"
				errorCode = "token_blacklisted"
			}

			return c.Status(statusCode).JSON(fiber.Map{
				"status": false,
				"error":  errorMsg,
				"code":   errorCode,
			})
		}

		// Only accept access tokens
		if claims.TokenType != security.TokenTypeAccess {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"status": false,
				"error":  "invalid token type",
				"code":   "invalid_token_type",
			})
		}

		// Attach token claims to context for downstream access
		c.Locals("user_id", claims.UserID)
		c.Locals("username", claims.Username)
		c.Locals("role_codes", claims.RoleCodes)
		c.Locals("session_id", claims.SessionID)
		
		// For public access routes, add special permissions
		c.Locals("permissions", []string{
			"AUTH_MODULE_PUBLIC_ACCESS",  // Give all authenticated users public access permissions
			"USER_MODULE_PUBLIC_ACCESS",
			"SCHOOL_MODULE_PUBLIC_ACCESS",
			"MAJOR_MODULE_PUBLIC_ACCESS",
		})

		return c.Next()
	}
}

// PermissionLoadingMiddleware loads user permissions based on their roles
// This should be used after the AuthMiddleware
func PermissionLoadingMiddleware(db *mongo.Client) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roleCodes, ok := c.Locals("role_codes").([]string)
		if !ok || len(roleCodes) == 0 {
			// No roles, use default permissions
			return c.Next()
		}
		
		// For ADMIN role, add all permissions automatically including wildcard permissions
		for _, roleCode := range roleCodes {
			if strings.ToUpper(roleCode) == "ADMIN" {
				// Define all module permissions
				modulePermissions := []string{
					// Auth module permissions
					"AUTH_MODULE_PUBLIC_ACCESS",
					"AUTH_MODULE_USER_ACCESS",
					"AUTH_MODULE_ADMIN_ACCESS",
					
					// User module permissions
					"USER_MODULE_PUBLIC_ACCESS",
					"USER_MODULE_USER_ACCESS",
					"USER_MODULE_ADMIN_ACCESS",
					
					// School module permissions
					"SCHOOL_MODULE_PUBLIC_ACCESS",
					"SCHOOL_MODULE_USER_ACCESS",
					"SCHOOL_MODULE_ADMIN_ACCESS",
					
					// Major module permissions
					"MAJOR_MODULE_PUBLIC_ACCESS",
					"MAJOR_MODULE_USER_ACCESS",
					"MAJOR_MODULE_ADMIN_ACCESS",
					
					// School resource-specific permissions
					"SCHOOL_SCHOOL_CREATE",
					"SCHOOL_SCHOOL_READ",
					"SCHOOL_SCHOOL_UPDATE",
					"SCHOOL_SCHOOL_DELETE",
					"SCHOOL_SCHOOL_LIST",
					
					// Major resource-specific permissions
					"MAJOR_MAJOR_CREATE",
					"MAJOR_MAJOR_READ",
					"MAJOR_MAJOR_UPDATE", 
					"MAJOR_MAJOR_DELETE",
					"MAJOR_MAJOR_LIST",
					
					// User resource-specific permissions
					"USER_USER_CREATE",
					"USER_USER_READ",
					"USER_USER_UPDATE",
					"USER_USER_DELETE",
					"USER_USER_LIST",
					
					// Role resource-specific permissions
					"USER_ROLE_CREATE",
					"USER_ROLE_READ",
					"USER_ROLE_UPDATE",
					"USER_ROLE_DELETE",
					"USER_ROLE_LIST",
					
					// Permission resource-specific permissions
					"USER_PERMISSION_CREATE",
					"USER_PERMISSION_READ",
					"USER_PERMISSION_UPDATE",
					"USER_PERMISSION_DELETE",
					"USER_PERMISSION_LIST",
					
					// Wildcard permissions for complete access
					"*",                // Global wildcard - matches everything
					"AUTH_*",           // Auth module wildcards
					"USER_*",           // User module wildcards 
					"SCHOOL_*",         // School module wildcards
					"MAJOR_*",          // Major module wildcards
					
					// Resource level permissions for admin
					"USER_ROLE_*",      // All role permissions
					"USER_PERMISSION_*", // All permission operations
					"USER_USER_*",      // All user operations
					"SCHOOL_SCHOOL_*",  // All school operations
					"MAJOR_MAJOR_*",    // All major operations
				}
				
				c.Locals("permissions", modulePermissions)
				return c.Next()
			} else if strings.ToUpper(roleCode) == "USER" {
				// For USER role, add appropriate permissions
				userPermissions := []string{
					// Public/User access for all modules
					"AUTH_MODULE_PUBLIC_ACCESS",
					"AUTH_MODULE_USER_ACCESS",
					"USER_MODULE_PUBLIC_ACCESS",
					"USER_MODULE_USER_ACCESS",
					"SCHOOL_MODULE_PUBLIC_ACCESS",
					"SCHOOL_MODULE_USER_ACCESS",
					"MAJOR_MODULE_PUBLIC_ACCESS",
					"MAJOR_MODULE_USER_ACCESS",
					
					// Read-only for various resources
					"SCHOOL_SCHOOL_READ",
					"SCHOOL_SCHOOL_LIST",
					"MAJOR_MAJOR_READ",
					"MAJOR_MAJOR_LIST",
					"USER_USER_READ",
				}
				
				c.Locals("permissions", userPermissions)
				return c.Next()
			}
		}
		
		// For other roles or if no specific role found, use default permissions
		// from AuthMiddleware (these are limited to PUBLIC_ACCESS)
		return c.Next()
	}
}

func PermissionMiddleware(requiredPermissions []string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		permissions, ok := c.Locals("permissions").([]string)
		if !ok {
			// No permissions in context
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"status": false,
				"error":  "missing permissions in context, PermissionLoadingMiddleware may not be applied",
				"code":   "missing_permissions",
			})
		}

		// Check if user has a permission that matches any of the required permissions
		hasPermission := false
		roleCodes, _ := c.Locals("role_codes").([]string)
		userID, _ := c.Locals("user_id").(string)

		// Debug logging to diagnose permission issues
		// This helps diagnose why access might be denied
		logger := logging.DefaultLogger
		logger.Debug("Checking permissions",
			"user_id", userID,
			"role_codes", roleCodes,
			"user_permissions", permissions,
			"required_permissions", requiredPermissions,
		)

		// First check if user has * (wildcard permission)
		for _, perm := range permissions {
			if perm == "*" {
				hasPermission = true
				break
			}
		}

		// If no wildcard, check each permission
		if !hasPermission {
			for _, required := range requiredPermissions {
				// Check for exact match
				for _, perm := range permissions {
					if perm == required {
						hasPermission = true
						break
					}
				}

				// Check for module wildcards (MODULE_*)
				if !hasPermission && strings.Contains(required, "_") {
					moduleName := strings.Split(required, "_")[0]
					moduleWildcard := moduleName + "_*"
					
					for _, perm := range permissions {
						if perm == moduleWildcard {
							hasPermission = true
							break
						}
					}
				}

				if hasPermission {
					break
				}
			}
		}

		if !hasPermission {
			logger.Warn("Permission denied",
				"user_id", userID,
				"role_codes", roleCodes,
				"required_permissions", requiredPermissions,
			)
			
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"status": false,
				"error":  "you don't have permission to access this resource",
				"code":   "missing_permissions",
				"required_permissions": requiredPermissions,
			})
		}

		return c.Next()
	}
}

// ModulePermissionMiddleware checks if user has permissions for a specific module and action
func ModulePermissionMiddleware(module string, action string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		permissions, ok := c.Locals("permissions").([]string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"status": false,
				"error": "missing user permissions",
				"code": "missing_permissions",
			})
		}

		// Create a pattern to match module-based permissions
		// Format is typically: MODULE_RESOURCE_ACTION (e.g., USER_ROLE_CREATE)
		permissionPrefix := strings.ToUpper(module) + "_"
		actionSuffix := "_" + strings.ToUpper(action)
		
		// Check for global wildcard permission first
		for _, permission := range permissions {
			if permission == "*" {
				return c.Next()
			}
		}
		
		// Check for wildcards and specific permissions
		wildcardPermission := permissionPrefix + "*"
		
		// Check for permissions
		for _, permission := range permissions {
			// Check for direct module permission match
			if strings.HasPrefix(permission, permissionPrefix) && strings.HasSuffix(permission, actionSuffix) {
				return c.Next()
			}
			
			// Check for wildcard permission match
			if permission == wildcardPermission {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"status": false,
			"error": "insufficient module permissions",
			"code": "insufficient_module_permissions",
			"module": module,
			"action": action,
		})
	}
}

// ResourcePermissionMiddleware checks if user has permissions for a specific module, resource and action
func ResourcePermissionMiddleware(module string, resource string, action string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		permissions, ok := c.Locals("permissions").([]string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"status": false,
				"error": "missing user permissions",
				"code": "missing_permissions",
			})
		}

		// Create the specific permission code to check
		// Format: MODULE_RESOURCE_ACTION (e.g., USER_ROLE_CREATE)
		permissionCode := strings.ToUpper(module) + "_" + strings.ToUpper(resource) + "_" + strings.ToUpper(action)
		
		// Check for global wildcard first
		for _, permission := range permissions {
			if permission == "*" {
				return c.Next()
			}
		}
		
		// Also check for module-wide wildcards
		moduleWildcard := strings.ToUpper(module) + "_*"
		resourceWildcard := strings.ToUpper(module) + "_" + strings.ToUpper(resource) + "_*"
		
		// Check for permissions
		for _, permission := range permissions {
			// Check for exact permission match
			if permission == permissionCode {
				return c.Next()
			}
			
			// Check for wildcard matches
			if permission == moduleWildcard || permission == resourceWildcard {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"status": false,
			"error": "insufficient resource permissions",
			"code": "insufficient_resource_permissions",
			"module": module,
			"resource": resource,
			"action": action,
			"required_permission": permissionCode,
		})
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
		
		// Admin role has special access to everything
		for _, roleCode := range roleCodes {
			if strings.ToUpper(roleCode) == "ADMIN" {
				return c.Next()
			}
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