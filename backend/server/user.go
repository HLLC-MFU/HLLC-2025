package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/handler"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func (s *server) userService() {
	// Initialize repositories using factory
	repoFactory := repository.NewFactory(s.db)
	userRepo := repoFactory.NewUserRepository()
	roleRepo := repoFactory.NewRoleRepository()
	permRepo := repoFactory.NewPermissionRepository()

	// Initialize services
	userService := service.NewUserService(s.cfg, userRepo, roleRepo, permRepo)

	// Initialize handlers
	httpHandler := handler.NewHTTPHandler(s.cfg, userService)
	grpcHandler := handler.NewGRPCHandler(s.cfg, userService)

	// Set up HTTP middleware
	s.app.Use(cors.New())
	s.app.Use(logger.New())
	s.app.Use(recover.New())

	// Set up HTTP routes
	api := s.app.Group("/api/v1")
	httpHandler.RegisterRoutes(api)

	// Set up gRPC server
	go func() {
		grpcServer, lis := core.NewGrpcServer(&s.cfg.Jwt, s.cfg.Grpc.UserUrl)
		userPb.RegisterUserServiceServer(grpcServer, grpcHandler)
		
		log.Printf("User gRPC server listening on %s", s.cfg.Grpc.UserUrl)
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