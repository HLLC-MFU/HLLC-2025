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
	userSvc := userService.NewUserService(s.cfg, userRepo, roleRepo, permRepo)
	authSvc := authService.NewAuthService(s.cfg, userRepo, authRepo, userSvc)

	// Initialize controllers
	authController := controller.NewAuthController(s.cfg, authSvc)
	grpcHandler := handler.NewGRPCHandler(s.cfg, authSvc)

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
	authController.RegisterPublicRoutes(api)

	// Protected routes (auth required)
	protected := api.Group("/protected")
	protected.Use(middleware.AuthMiddleware(s.cfg.Jwt.AccessSecretKey))
	authController.RegisterProtectedRoutes(protected)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(s.cfg.Jwt.AccessSecretKey))
	admin.Use(middleware.RoleMiddleware([]string{"ADMIN"}))
	authController.RegisterAdminRoutes(admin)

	// Set up gRPC server for internal service communication
	go func() {
		grpcServer, lis := core.NewGrpcServer(&s.cfg.Jwt, s.cfg.Grpc.AuthUrl)
		authPb.RegisterAuthServiceServer(grpcServer, grpcHandler)
		
		log.Printf("Auth gRPC server listening on %s", s.cfg.Grpc.AuthUrl)
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

