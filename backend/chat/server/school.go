package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/schools/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/schools/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/schools/router"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/schools/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *server) schoolService() {
	schoolRepo := repository.NewRepository(s.db)
	schoolService := service.NewService(schoolRepo)
	schoolHandler := handler.NewHTTPHandler(schoolService)
	router.RegisterSchoolRoutes(s.app.Group("/schools"), schoolHandler)

	// Middleware
	s.app.Use(cors.New(s.config.FiberCORSConfig()))

	// Route registration
	api := s.api
	public := api.Group("/schools")
	router.RegisterSchoolRoutes(public, schoolHandler)

	s.app.Get("/ping", func(c *fiber.Ctx) error {
		return c.SendString("pong")
	})

	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Println("School service initialized")
}
