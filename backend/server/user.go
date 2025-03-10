package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"

	pb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/userpb"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func (s *server) userService() {
	// Initialize repositories
	userRepository := repository.NewUserRepository(s.db)
	
	// Initialize services
	userService := service.NewUserService(userRepository)
	
	// Initialize handlers
	httpHandler := handler.NewHTTPHandler(s.cfg, userService)
	grpcHandler := handler.NewGRPCHandler(s.cfg, userService)

	// Set up HTTP middleware
	s.app.Use(cors.New())
	s.app.Use(logger.New())
	s.app.Use(recover.New())

	// Set up HTTP routes
	api := s.app.Group("/api/v1")
	
	users := api.Group("/users")
	users.Post("/", httpHandler.CreateUser)
	users.Get("/:username", httpHandler.GetUser)
	users.Post("/validate", httpHandler.ValidateCredentials)

	// Set up gRPC server
	go func() {
		grpcServer, lis := core.NewGrpcServer(&s.cfg.Jwt, s.cfg.Grpc.UserUrl)
		pb.RegisterUserServiceServer(grpcServer, grpcHandler)
		
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