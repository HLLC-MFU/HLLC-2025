package routes

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/service"
	"github.com/gofiber/fiber/v2"
)

type Controller struct {
	cfg     *config.Config
	service service.Service
}

func NewController(cfg *config.Config, service service.Service) *Controller {
	return &Controller{
		cfg:     cfg,
		service: service,
	}
}

// RegisterPublicRoutes registers routes that don't require authentication
func (c *Controller) RegisterPublicRoutes(router fiber.Router) {
	handler := handler.NewHTTPHandler(c.service)

	schools := router.Group("/schools")
	schools.Get("/", handler.ListSchools)
	schools.Get("/:id", handler.GetSchool)
}

// RegisterProtectedRoutes registers routes that require authentication
func (c *Controller) RegisterProtectedRoutes(router fiber.Router) {
	handler := handler.NewHTTPHandler(c.service)

	router.Post("/", handler.CreateSchool)
	router.Put("/:id", handler.UpdateSchool)
	router.Delete("/:id", handler.DeleteSchool)
}

// RegisterAdminRoutes registers routes that require admin role
func (c *Controller) RegisterAdminRoutes(router fiber.Router) {
	handler := handler.NewHTTPHandler(c.service)

	router.Get("/", handler.ListSchools)
	router.Get("/:id", handler.GetSchool)
	router.Post("/", handler.CreateSchool)
	router.Put("/:id", handler.UpdateSchool)
	router.Delete("/:id", handler.DeleteSchool)
} 