package middleware

import "github.com/gofiber/fiber/v2"

// IRBACMiddleware defines the contract for RBAC middleware
// This interface can be imported by controllers to avoid redeclaration
type IRBACMiddleware interface {
	RequireAdministrator() fiber.Handler
	RequireRoles(roles ...string) fiber.Handler
}

// Ensure RBACMiddleware implements IRBACMiddleware
var _ IRBACMiddleware = (*RBACMiddleware)(nil) 