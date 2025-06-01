package decorator

import (
	"context"
	"log"

	"github.com/gofiber/fiber/v2"
)

/**
 * Controller decorators for HTTP and gRPC handlers
 * Implements clean architecture patterns with middleware support
 *
 * @author Dev. Bengi (Backend Team)
 */

type (
	// HTTPHandlerFunc is the standard HTTP handler function
	HTTPHandlerFunc func(*fiber.Ctx) error

	// ControllerDecorator wraps controller methods with additional functionality
	ControllerDecorator func(HTTPHandlerFunc) HTTPHandlerFunc

	// BaseController provides common controller functionality
	BaseController struct {
		Router fiber.Router
	}
)

// WithLogging adds logging to the handler
func WithLogging(handler HTTPHandlerFunc) HTTPHandlerFunc {
	return func(c *fiber.Ctx) error {
		// Pre-request logging
		method := c.Method()
		path := c.Path()
		c.Context().Logger().Printf("Request: %s %s", method, path)

		err := handler(c)

		// Post-request logging
		if err != nil {
			c.Context().Logger().Printf("Error: %s %s - %v", method, path, err)
		} else {
			c.Context().Logger().Printf("Success: %s %s", method, path)
		}

		return err
	}
}

// WithGenericLogging adds logging to generic controller methods
// T is the return type of the controller method
func WithGenericLogging[T any](fn func(context.Context) (T, error), operationName string) func(context.Context) (T, error) {
	return func(ctx context.Context) (T, error) {
		var result T
		
		// Pre-operation logging
		log.Printf("Starting operation: %s", operationName)
		
		// Execute the function
		result, err := fn(ctx)
		
		// Post-operation logging
		if err != nil {
			log.Printf("Error in operation %s: %v", operationName, err)
		} else {
			log.Printf("Successfully completed operation: %s", operationName)
		}
		
		return result, err
	}
}

// WithError adds error handling to the handler
func WithError(handler HTTPHandlerFunc) HTTPHandlerFunc {
	return func(c *fiber.Ctx) error {
		err := handler(c)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return nil
	}
}

// WithValidation adds request validation to the handler
func WithValidation(handler HTTPHandlerFunc) HTTPHandlerFunc {
	return func(c *fiber.Ctx) error {
		// Add validation logic here
		return handler(c)
	}
}

// WithTransaction adds transaction support to the handler
func WithTransaction(handler HTTPHandlerFunc) HTTPHandlerFunc {
	return func(c *fiber.Ctx) error {
		// Start transaction
		// Implement your transaction logic here
		err := handler(c)
		if err != nil {
			// Rollback transaction
			return err
		}
		// Commit transaction
		return nil
	}
}

// ComposeDecorators combines multiple decorators into one
func ComposeDecorators(decorators ...ControllerDecorator) ControllerDecorator {
	return func(handler HTTPHandlerFunc) HTTPHandlerFunc {
		for i := len(decorators) - 1; i >= 0; i-- {
			handler = decorators[i](handler)
		}
		return handler
	}
}

// RegisterRoute registers a route with decorators
func (b *BaseController) RegisterRoute(method string, path string, handler HTTPHandlerFunc, decorators ...ControllerDecorator) {
	// Apply all decorators
	decorated := handler
	for _, decorator := range decorators {
		decorated = decorator(decorated)
	}

	// Register the route
	switch method {
	case "GET":
		b.Router.Get(path, decorated)
	case "POST":
		b.Router.Post(path, decorated)
	case "PUT":
		b.Router.Put(path, decorated)
	case "DELETE":
		b.Router.Delete(path, decorated)
	case "PATCH":
		b.Router.Patch(path, decorated)
	}
}
