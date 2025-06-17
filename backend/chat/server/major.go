package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/router"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/service"

	schoolRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/schools/repository"
	schoolPkg "github.com/HLLC-MFU/HLLC-2025/backend/module/schools/service"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *server) majorService() {
	// Repositories
	majorRepo := repository.NewRepository(s.db)
	schoolRepo := schoolRepo.NewRepository(s.db)

	// Service
	majorService := service.NewService(majorRepo)
	schoolService := schoolPkg.NewService(schoolRepo) // Create the school service using the repository

	// Handler
	majorHandler := handler.NewHTTPHandler(majorService, schoolService)

	// Middleware
	s.app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Content-Type, Authorization",
	}))

	// Routes
	api := s.api
	majors := api.Group("/majors")
	router.RegisterMajorRoutes(majors, majorHandler)

	// Health checks
	s.app.Get("/ping", func(c *fiber.Ctx) error {
		return c.SendString("pong")
	})

	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Println("Major service initialized")
}
