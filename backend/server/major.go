package server

import (
	"context"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/controller"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/handler"
	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"google.golang.org/grpc"
)

func (s *server) majorService() {
	// Initialize repository
	repo := repository.NewRepository(s.db)

	// Create gRPC client factory
	clientFactory := core.NewGrpcClientFactory(s.config.School.GRPCAddr)
	
	// Get school client with timeout context
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	schoolClient, err := clientFactory.School(ctx)
	if err != nil {
		log.Printf("Warning: Failed to create school client: %v. Service will continue but school data may be unavailable.", err)
		// Continue without school client - we'll handle the nil client in the service
	}

	// Initialize service with school client (which might be nil)
	svc := service.NewService(repo, schoolClient)
	
	// Create gRPC handler
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

	// Create gRPC connection to self for controller with timeout and no blocking
	dialCtx, dialCancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer dialCancel()
	
	majorConn, err := grpc.DialContext(dialCtx, s.config.Major.GRPCAddr, 
		grpc.WithInsecure(),
		// Remove the WithBlock() option to prevent blocking
	)
	if err != nil {
		log.Printf("Warning: Failed to connect to major gRPC server: %v. Using direct service instead.", err)
		// Continue without majorConn - we'll handle this in the controller
	}
	
	var majorClient majorPb.MajorServiceClient
	if majorConn != nil {
		majorClient = majorPb.NewMajorServiceClient(majorConn)
	}

	// Initialize controller with major client
	ctrl := controller.NewController(s.config, svc, majorClient)

	// Set up HTTP routes
	api := s.app.Group("/api/v1")

	// Public routes (no auth required)
	public := api.Group("/public")
	ctrl.RegisterPublicRoutes(public)

	// Protected routes (auth required)
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	ctrl.RegisterProtectedRoutes(protected)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	admin.Use(middleware.RoleMiddleware([]string{"ADMIN"}))
	ctrl.RegisterAdminRoutes(admin)

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