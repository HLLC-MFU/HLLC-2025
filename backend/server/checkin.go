package server

import (
	"log"

	activityRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/activity/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/controller"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/service"
	userRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func (s *server) checkinService() {
	log.Println("Initializing check-in service...")

	// Initialize MongoDB repositories
	checkInRepo := repository.NewCheckInRepository(s.db)
	
	// Initialize repositories from other modules
	userRepoFactory := userRepo.NewFactory(s.db)
	userRepository := userRepoFactory.NewUserRepository()
	activityRepository := activityRepo.NewActivityRepository(s.db)

	// Initialize services
	checkInService := service.NewCheckInService(s.config, checkInRepo, userRepository, activityRepository)

	// Initialize controllers
	checkInController := controller.NewCheckInController(checkInService)

	// Initialize HTTP handlers
	httpHandler := handler.NewHTTPHandler(s.config, checkInController)

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
	public := api.Group("/public/checkins")
	httpHandler.RegisterPublicRoutes(public)

	// Protected routes (auth required)
	protected := api.Group("/checkins")
	protected.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	httpHandler.RegisterProtectedRoutes(protected)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/checkins")
	admin.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	admin.Use(middleware.RoleMiddleware([]string{"ADMIN"}))
	httpHandler.RegisterAdminRoutes(admin)

	// Set up health check
	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Printf("CheckIn service initialized")
} 