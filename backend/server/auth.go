package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/controller"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/handler"
	authPb "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto"
	authRepository "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/repository"
	authService "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/service"
	userRepository "github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	userService "github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *server) authService() {
	// Initialize repository factory
	repoFactory := userRepository.NewFactory(s.db)

	// Initialize repositories
	userRepo := repoFactory.NewUserRepository()
	roleRepo := repoFactory.NewRoleRepository()
	permRepo := repoFactory.NewPermissionRepository()
	authRepo := authRepository.NewAuthRepository(s.db)

	// Initialize services
	userSvc := userService.NewUserService(s.config, userRepo, roleRepo, permRepo)
	authSvc := authService.NewAuthService(s.config, userRepo, authRepo, userSvc)

	// Initialize controllers
	authController := controller.NewAuthController(s.config, authSvc)
	grpcHandler := handler.NewGRPCHandler(s.config, authSvc)

	// Set up HTTP middleware
	s.app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS,PATCH",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Add request ID, logging and recovery middleware
	s.app.Use(middleware.RequestIDMiddleware())
	s.app.Use(middleware.LoggingMiddleware())
	s.app.Use(middleware.RecoveryMiddleware())

	// Set up HTTP routes
	api := s.app.Group("/api/v1")
	
	// Public routes (no auth required)
	authController.RegisterPublicRoutes(api)

	// Protected routes (auth required)
	protected := api.Group("/protected")
	protected.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	authController.RegisterProtectedRoutes(protected)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	admin.Use(middleware.RoleMiddleware([]string{"ADMIN"}))
	authController.RegisterAdminRoutes(admin)

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
		grpcServer, lis := core.NewGrpcServer(jwtConfig, s.config.Auth.GRPCAddr)
		authPb.RegisterAuthServiceServer(grpcServer, grpcHandler)
		
		log.Printf("Auth gRPC server listening on %s", s.config.Auth.GRPCAddr)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("gRPC server error: %v", err)
		}
	}()

	// Set up health check
	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Printf("Auth service initialized")
}

