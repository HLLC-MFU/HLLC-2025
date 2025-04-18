package controller

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/service"
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

	majors := router.Group("/majors")
	majors.Get("/", handler.ListMajors)
	majors.Get("/:id", handler.GetMajor)
	majors.Get("/school/:schoolId", handler.ListMajorsBySchool)
}

// RegisterProtectedRoutes registers routes that require authentication
func (c *Controller) RegisterProtectedRoutes(router fiber.Router) {
	handler := handler.NewHTTPHandler(c.service)

	majors := router.Group("/majors")
	majors.Post("/", handler.CreateMajor)
	majors.Put("/:id", handler.UpdateMajor)
	majors.Delete("/:id", handler.DeleteMajor)
}

// RegisterAdminRoutes registers routes that require admin role
func (c *Controller) RegisterAdminRoutes(router fiber.Router) {
	// Add admin-specific routes here if needed
}