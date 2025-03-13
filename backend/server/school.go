package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/handler"
	schoolPb "github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *server) schoolService() {
	// Initialize repository
	repo := repository.NewRepository(s.db.Database("hllc"))

	// Initialize service
	schoolService := service.NewService(repo)

	// Initialize handlers and controller
	httpHandler := handler.NewHTTPHandler(schoolService)
	grpcHandler := handler.NewGrpcHandler(schoolService)

	// Set up HTTP middleware
	s.app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     "http://localhost:3000",  // Frontend development URL
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE",
	}))
	s.app.Use(middleware.RequestIDMiddleware())
	s.app.Use(middleware.LoggingMiddleware())
	s.app.Use(middleware.RecoveryMiddleware())

	// Set up HTTP routes
	api := s.app.Group("/api/v1")

	// Public routes (no auth required)
	public := api.Group("/public/schools")
	public.Get("/", httpHandler.ListSchools)
	public.Get("/:id", httpHandler.GetSchool)

	// Protected routes (auth required)
	protected := api.Group("/schools")
	protected.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	protected.Get("/", httpHandler.ListSchools)
	protected.Get("/:id", httpHandler.GetSchool)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/schools")
	admin.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	admin.Use(middleware.RoleMiddleware([]string{"ADMIN"}))
	admin.Post("/", httpHandler.CreateSchool)
	admin.Put("/:id", httpHandler.UpdateSchool)
	admin.Delete("/:id", httpHandler.DeleteSchool)

	// Set up gRPC server for internal service communication
	go func() {
		jwtConfig := &core.JwtConfig{
			AccessSecretKey:  s.config.Jwt.AccessSecretKey,
			RefreshSecretKey: s.config.Jwt.RefreshSecretKey,
			ApiSecretKey:    s.config.Jwt.ApiSecretKey,
			AccessDuration:   s.config.Jwt.AccessDuration,
			RefreshDuration:  s.config.Jwt.RefreshDuration,
			ApiDuration:     s.config.Jwt.ApiDuration,
		}
		grpcServer, lis := core.NewGrpcServer(jwtConfig, s.config.School.GRPCAddr)
		schoolPb.RegisterSchoolServiceServer(grpcServer, grpcHandler)
		
		log.Printf("School gRPC server listening on %s", s.config.School.GRPCAddr)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("gRPC server error: %v", err)
		}
	}()

	// Set up health check
	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Printf("School service initialized")
} 