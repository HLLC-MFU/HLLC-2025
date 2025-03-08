package decorator

import (
	"github.com/gofiber/fiber"
	"github.com/labstack/echo/v4/middleware"
)

/**
 * BaseController is a base controller for all controllers
 *
 * @author Dev. Bengi (Backend Team)
 */

type BaseController struct {
	Router *fiber.Router
}

// RegisterRoute is a function that registers a route
func (b *BaseController) RegisterRoute(method string, path string, handler middleware.HTTPHandlerFunc, middlewares ...middleware.HTTPHandlerFunc) {
	finalHandler := composeMiddlewares(append(middlewares, handler))
	(*b.Router).Add(method, path, finalHandler)
}

// composeMiddlewares is a function that composes middlewares
func composeMiddlewares(middlewares []middleware.HTTPHandlerFunc) middleware.HTTPHandlerFunc {
	return func(c *fiber.Ctx) error {
		for _, middleware := range middlewares {
			if err := middleware(c); err != nil {
				return err
			}
		}
		return nil
	}
}
