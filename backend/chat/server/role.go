package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/roles/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/roles/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/roles/router"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/roles/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *server) roleService() {
	roleRepo := repository.NewRoleRepository(s.db)
	roleService := service.NewRoleService(roleRepo)
	roleHandler := handler.NewHTTPHandler(roleService)
	router.RegisterRoleRoutes(s.app.Group("/roles"), roleHandler)

	s.app.Use(cors.New(s.config.FiberCORSConfig()))

	// Route registration
	api := s.api
	public := api.Group("/roles")
	router.RegisterRoleRoutes(public, roleHandler)

	s.app.Get("/ping", func(c *fiber.Ctx) error {
		return c.SendString("pong")
	})

	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Println("Role service initialized")
}
