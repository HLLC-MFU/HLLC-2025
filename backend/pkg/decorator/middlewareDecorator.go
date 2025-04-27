package decorator

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type (
	MiddlewareDecorator func(fiber.Handler) fiber.Handler
)

/**
 * Middleware decorators for HTTP handlers
 *
 * @author Dev. Bengi (Backend Team)
 */

/**
 * WithRequestValidation is a decorator that validates the request body
 *
 * @author Dev. Bengi (Backend Team)
 */

// WithErrorHandling is a decorator that handles errors
func WithErrorHandling(handler HTTPHandlerFunc) HTTPHandlerFunc {
	return func(c *fiber.Ctx) error {
		if err := handler(c); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return nil
	}
}

// --- Permission-Based Decorators ---

func WithPermission(permissionCode string) MiddlewareDecorator {
	return func(next fiber.Handler) fiber.Handler {
		return func(c *fiber.Ctx) error {
			perms, ok := c.Locals("permissions").([]string)
			if !ok {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"status": false,
					"error": "missing user permissions",
					"code": "missing_permissions",
				})
			}

			if !hasPermission(perms, permissionCode) {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"status": false,
					"error": "insufficient permissions",
					"code": "insufficient_permissions",
					"required_permission": permissionCode,
				})
			}

			return next(c)
		}
	}
}

func WithModulePermission(module string, action string) MiddlewareDecorator {
	permissionCode := fmt.Sprintf("%s_%s", strings.ToUpper(module), strings.ToUpper(action))
	return WithPermission(permissionCode)
}

func WithResourcePermission(module, resource, action string) MiddlewareDecorator {
	permissionCode := fmt.Sprintf("%s_%s_%s", strings.ToUpper(module), strings.ToUpper(resource), strings.ToUpper(action))
	return WithPermission(permissionCode)
}

func ResourcePermissionMiddleware(module, resource, action string) fiber.Handler {
	return WithResourcePermission(module, resource, action)(func(c *fiber.Ctx) error {
		return c.Next()
	})
}

func WithDynamicPermission(permissionBuilder func(c *fiber.Ctx) string) MiddlewareDecorator {
	return func(next fiber.Handler) fiber.Handler {
		return func(c *fiber.Ctx) error {
			perms, ok := c.Locals("permissions").([]string)
			if !ok {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"status": false,
					"error": "missing user permissions",
					"code": "missing_permissions",
				})
			}

			permissionCode := permissionBuilder(c)

			if !hasPermission(perms, permissionCode) {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"status": false,
					"error": "insufficient permissions",
					"code": "insufficient_permissions",
					"required_permission": permissionCode,
				})
			}

			return next(c)
		}
	}
}

func WithPermissionCheck(checker func(c *fiber.Ctx, perms []string) bool, errorMsg string) MiddlewareDecorator {
	return func(next fiber.Handler) fiber.Handler {
		return func(c *fiber.Ctx) error {
			perms, ok := c.Locals("permissions").([]string)
			if !ok {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"status": false,
					"error": "missing user permissions",
					"code": "missing_permissions",
				})
			}

			if !checker(c, perms) {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"status": false,
					"error": "insufficient permissions",
					"code": "insufficient_permissions",
					"message": errorMsg,
				})
			}

			return next(c)
		}
	}
}

// Helper function to check if the user has the required permission
func hasPermission(userPermissions []string, requiredPermission string) bool {
	for _, p := range userPermissions {
		if p == requiredPermission || p == "ADMIN" || p == "SUPERADMIN" {
			return true
		}

		// Check for wildcard permissions - e.g., CMS_* should grant access to all CMS permissions
		if strings.HasSuffix(p, "_*") {
			prefix := strings.TrimSuffix(p, "_*")
			if strings.HasPrefix(requiredPermission, prefix) {
				return true
			}
		}
	}
	return false
}

// AdaptMiddlewareToController converts a MiddlewareDecorator to a ControllerDecorator
// This allows using permission middlewares in controller route registrations
func AdaptMiddlewareToController(middleware MiddlewareDecorator) RouteDecorator {
	return func(handler HTTPHandlerFunc) HTTPHandlerFunc {
		// Apply the middleware to the handler
		h := middleware(handler)
		// Convert the middleware's return value back to HTTPHandlerFunc
		return func(c *fiber.Ctx) error {
			return h(c)
		}
	}
}
