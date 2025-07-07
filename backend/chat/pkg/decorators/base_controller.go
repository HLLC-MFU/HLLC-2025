package decorators

import (
	"github.com/gofiber/fiber/v2"
)

type (
	RouteDefinition struct {
		Method      string
		Path        string
		Handler     fiber.Handler
		Middleware  []fiber.Handler
		Description string
	}

	BaseController struct {
		*Controller
		routes []RouteDefinition
	}

	Route struct {
		Method      string
		Path        string
		Handlers    []fiber.Handler
	}

	Controller struct {
		App    fiber.Router
		Prefix string
	}
	
)

func NewController(app fiber.Router, prefix string, guards ...fiber.Handler) *Controller {
    return &Controller{
        App:    app,
        Prefix: prefix,
    }
}

func (b *BaseController) AddRoute(route Route) {
    b.App.Add(route.Method, b.Prefix+route.Path, route.Handlers...)
}

// NewBaseController creates a new base controller
func NewBaseController(app fiber.Router, prefix string, guards ...fiber.Handler) *BaseController {
	controller := &BaseController{
		Controller: NewController(app, prefix, guards...),
		routes:    make([]RouteDefinition, 0),
	}

	// Setup static file serving for uploads with optimized configuration
	// Note: Static file serving should be set up on the main app, not on router groups

	return controller
}

// RegisterRoute adds a route definition to the controller
func (b *BaseController) RegisterRoute(method, path string, handler fiber.Handler, middleware ...fiber.Handler) {
	b.routes = append(b.routes, RouteDefinition{
		Method:     method,
		Path:      path,
		Handler:    handler,
		Middleware: middleware,
	})
}

// RegisterRoutes registers multiple route definitions at once
func (b *BaseController) RegisterRoutes(routes []RouteDefinition) {
	b.routes = append(b.routes, routes...)
}

// SetupRoutes sets up all registered routes
func (b *BaseController) SetupRoutes() {
	for _, route := range b.routes {
		handlers := route.Middleware
		handlers = append(handlers, route.Handler)
		
		b.AddRoute(Route{
			Method:   route.Method,
			Path:     route.Path,
			Handlers: handlers,
		})
	}
}

// Common HTTP method registration helpers
func (b *BaseController) Get(path string, handler fiber.Handler, middleware ...fiber.Handler) {
	b.RegisterRoute("GET", path, handler, middleware...)
}

func (b *BaseController) Post(path string, handler fiber.Handler, middleware ...fiber.Handler) {
	b.RegisterRoute("POST", path, handler, middleware...)
}

func (b *BaseController) Put(path string, handler fiber.Handler, middleware ...fiber.Handler) {
	b.RegisterRoute("PUT", path, handler, middleware...)
}

func (b *BaseController) Delete(path string, handler fiber.Handler, middleware ...fiber.Handler) {
	b.RegisterRoute("DELETE", path, handler, middleware...)
}

func (b *BaseController) Patch(path string, handler fiber.Handler, middleware ...fiber.Handler) {
	b.RegisterRoute("PATCH", path, handler, middleware...)
}

// ResourceController provides REST-like resource routing
type ResourceController struct {
	*BaseController
	resourcePath string
}

// NewResourceController creates a new resource controller
func NewResourceController(app fiber.Router, prefix, resourcePath string, guards ...fiber.Handler) *ResourceController {
	return &ResourceController{
		BaseController: NewBaseController(app, prefix, guards...),
		resourcePath:   resourcePath,
	}
}

// Resource registers standard REST routes for a resource
func (r *ResourceController) Resource(
	index fiber.Handler,
	create fiber.Handler,
	show fiber.Handler,
	update fiber.Handler,
	delete fiber.Handler,
) {
	if index != nil {
		r.Get(r.resourcePath, index)
	}
	if create != nil {
		r.Post(r.resourcePath, create)
	}
	if show != nil {
		r.Get(r.resourcePath+"/:id", show)
	}
	if update != nil {
		r.Put(r.resourcePath+"/:id", update)
	}
	if delete != nil {
		r.Delete(r.resourcePath+"/:id", delete)
	}
} 