package server

import (
	"context"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/handler"
	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *server) majorService() {
	// Initialize repository, service, and handlers
	repo := repository.NewRepository(s.db.Database("hllc"))

	// Create gRPC client factory
	clientFactory := core.NewGrpcClientFactory(s.config.School.GRPCAddr)
	
	// Get school client
	schoolClient, err := clientFactory.School(context.Background())
	if err != nil {
		log.Fatalf("Failed to create school client: %v", err)
	}

	// Initialize service with school client
	svc := service.NewService(repo, schoolClient)
	httpHandler := handler.NewHTTPHandler(svc)
	grpcHandler := handler.NewGrpcHandler(svc)

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
	public := api.Group("/public/majors")
	public.Get("/", httpHandler.ListMajors)
	public.Get("/:id", httpHandler.GetMajor)
	public.Get("/school/:schoolId", httpHandler.ListMajorsBySchool)

	// Protected routes (auth required)
	protected := api.Group("/majors")
	protected.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	protected.Get("/", httpHandler.ListMajors)
	protected.Get("/:id", httpHandler.GetMajor)
	protected.Get("/school/:schoolId", httpHandler.ListMajorsBySchool)
	protected.Post("/", httpHandler.CreateMajor)
	protected.Put("/:id", httpHandler.UpdateMajor)
	protected.Delete("/:id", httpHandler.DeleteMajor)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/majors")
	admin.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	admin.Use(middleware.RoleMiddleware([]string{"ADMIN"}))
	admin.Post("/", httpHandler.CreateMajor)
	admin.Put("/:id", httpHandler.UpdateMajor)
	admin.Delete("/:id", httpHandler.DeleteMajor)

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
		grpcServer, lis := core.NewGrpcServer(jwtConfig, s.config.Major.GRPCAddr)
		majorPb.RegisterMajorServiceServer(grpcServer, grpcHandler)
		
		log.Printf("Major gRPC server listening on %s", s.config.Major.GRPCAddr)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("gRPC server error: %v", err)
		}
	}()

	// Set up health check
	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Printf("Major service initialized")
} 