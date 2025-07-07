package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

// CookieConfig holds cookie configuration
type CookieConfig struct {
	Domain   string
	Path     string
	Secure   bool
	HTTPOnly bool
	SameSite string
	MaxAge   int
}

// DefaultCookieConfig returns default cookie configuration
func DefaultCookieConfig() CookieConfig {
	return CookieConfig{
		Domain:   "",
		Path:     "/",
		Secure:   false, // Set to true in production with HTTPS
		HTTPOnly: true,
		SameSite: "Lax",
		MaxAge:   int((24 * time.Hour).Seconds()), // 24 hours
	}
}

// SetCookieMiddleware sets authentication cookie
func SetCookieMiddleware(config CookieConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Add cookie helper methods to context
		c.Locals("setAuthCookie", func(token string) {
			c.Cookie(&fiber.Cookie{
				Name:     "accessToken",
				Value:    token,
				Domain:   config.Domain,
				Path:     config.Path,
				Secure:   config.Secure,
				HTTPOnly: config.HTTPOnly,
				SameSite: config.SameSite,
				MaxAge:   config.MaxAge,
			})
		})

		c.Locals("clearAuthCookie", func() {
			c.Cookie(&fiber.Cookie{
				Name:     "accessToken",
				Value:    "",
				Domain:   config.Domain,
				Path:     config.Path,
				Secure:   config.Secure,
				HTTPOnly: config.HTTPOnly,
				SameSite: config.SameSite,
				MaxAge:   -1, // Delete cookie
			})
		})

		return c.Next()
	}
}

// GetCookieValue safely extracts cookie value
func GetCookieValue(c *fiber.Ctx, name string) string {
	return c.Cookies(name)
}

// SetCookieValue safely sets cookie value
func SetCookieValue(c *fiber.Ctx, name, value string, config CookieConfig) {
	c.Cookie(&fiber.Cookie{
		Name:     name,
		Value:    value,
		Domain:   config.Domain,
		Path:     config.Path,
		Secure:   config.Secure,
		HTTPOnly: config.HTTPOnly,
		SameSite: config.SameSite,
		MaxAge:   config.MaxAge,
	})
}

// ClearCookie safely clears cookie
func ClearCookie(c *fiber.Ctx, name string, config CookieConfig) {
	c.Cookie(&fiber.Cookie{
		Name:     name,
		Value:    "",
		Domain:   config.Domain,
		Path:     config.Path,
		Secure:   config.Secure,
		HTTPOnly: config.HTTPOnly,
		SameSite: config.SameSite,
		MaxAge:   -1, // Delete cookie
	})
}
