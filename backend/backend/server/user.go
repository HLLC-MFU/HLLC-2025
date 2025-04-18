package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/adapter"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/handler"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *server) userService() {
	// Initialize repositories using factory
	repoFactory := repository.NewFactory(s.db)
	userRepo := repoFactory.NewUserRepository()
	roleRepo := repoFactory.NewRoleRepository()
	permRepo := repoFactory.NewPermissionRepository()

	// Create major service adapter
	majorAdapter := adapter.NewMajorServiceAdapter(s.config.Major.GRPCAddr)

	// Initialize services
	userService := service.NewUserService(s.config, userRepo, roleRepo, permRepo, majorAdapter)

	// Initialize handlers
	httpHandler := handler.NewHTTPHandler(s.config, userService)
	grpcHandler := handler.NewGRPCHandler(s.config, userService)

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
	public := api.Group("/public")
	httpHandler.RegisterPublicRoutes(public)

	// Protected routes (auth required)
	protected := api.Group("/users")
	protected.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	httpHandler.RegisterProtectedRoutes(protected)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	admin.Use(middleware.RoleMiddleware([]string{"ADMIN"}))
	httpHandler.RegisterAdminRoutes(admin)

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
		grpcServer, lis := core.NewGrpcServer(jwtConfig, s.config.User.GRPCAddr)
		userPb.RegisterUserServiceServer(grpcServer, grpcHandler)
		
		log.Printf("User gRPC server listening on %s", s.config.User.GRPCAddr)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("gRPC server error: %v", err)
		}
	}()

	// Set up health check
	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Printf("User service initialized")
}