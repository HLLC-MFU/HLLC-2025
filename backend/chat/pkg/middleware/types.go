package middleware

import "github.com/gofiber/fiber/v2"

// IRBACMiddleware defines the contract for RBAC middleware
// This interface can be imported by controllers to avoid redeclaration
type IRBACMiddleware interface {
	RequireAdministrator() fiber.Handler
	RequireRoles(roles ...string) fiber.Handler
	RequireWritePermission() fiber.Handler
	RequireReadOnlyAccess() fiber.Handler
	GetUserRole(userID string) (string, error)
	SetUserRoleInContext() fiber.Handler
	ExtractUserIDFromContext(ctx interface{}) (string, error)
	ExtractUserIDFromToken(tokenString string) (string, error)
}

// Ensure RBACMiddleware implements IRBACMiddleware
var _ IRBACMiddleware = (*RBACMiddleware)(nil) 