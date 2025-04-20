package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/controller"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func (s *server) activityService() {
	log.Println("Initializing activity service...")

	// Initialize MongoDB repositories
	activityRepo := repository.NewActivityRepository(s.db)

	// Initialize services
	activityService := service.NewActivityService(s.config, activityRepo)

	// Initialize controllers
	activityController := controller.NewActivityController(activityService)

	// Initialize HTTP handlers
	httpHandler := handler.NewHTTPHandler(s.config, activityController)

	// Set up HTTP middleware
	s.app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     "http://localhost:3000",  // Frontend development URL
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE",
	}))
	s.app.Use(logger.New())
	s.app.Use(recover.New())
	s.app.Use(middleware.RequestIDMiddleware())
	s.app.Use(middleware.LoggingMiddleware())
	
	// Set up HTTP routes
	api := s.app.Group("/api/v1")

	// Public routes (no auth required)
	public := api.Group("/public/activities")
	httpHandler.RegisterPublicRoutes(public)

	// Protected routes (auth required)
	protected := api.Group("/activities")
	protected.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	httpHandler.RegisterProtectedRoutes(protected)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/activities")
	admin.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	admin.Use(middleware.RoleMiddleware([]string{"ADMIN"}))
	httpHandler.RegisterAdminRoutes(admin)

	// Set up health check
	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Printf("Activity service initialized")
} 