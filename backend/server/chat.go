package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/handler"
	chatPb "github.com/HLLC-MFU/HLLC-2025/backend/module/chats/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	"google.golang.org/grpc"
)

func (s *server) chatService() {
	// Start chat hub loop

	repo := repository.NewRepository(s.db)
	roomService := service.NewService(repo)
	roomService.InitChatHub()

	httpHandler := handler.NewHTTPHandler(roomService)
	grpcHandler := handler.NewGrpcHandler(roomService)

	// Set up HTTP middleware
	s.app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     "http://localhost:3000", // Frontend development URL
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE",
	}))
	s.app.Use(middleware.RequestIDMiddleware())
	s.app.Use(middleware.LoggingMiddleware())
	s.app.Use(middleware.RecoveryMiddleware())

	api := s.app.Group("/api/v1")

	public := api.Group("/public/rooms")
	public.Get("/", httpHandler.ListRooms)
	public.Get("/:id", httpHandler.GetRoom)

	// Protected routes (auth required)
	protected := api.Group("/rooms")
	protected.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	protected.Get("/", httpHandler.ListRooms)
	protected.Get("/:id", httpHandler.GetRoom)
	protected.Post("/", httpHandler.CreateRoom)
	protected.Put("/:id", httpHandler.UpdateRoom)
	protected.Delete("/:id", httpHandler.DeleteRoom)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/rooms")
	admin.Use(middleware.AuthMiddleware(s.config.Jwt.AccessSecretKey))
	admin.Use(middleware.RoleMiddleware([]string{"ADMIN"}))
	admin.Post("/", httpHandler.CreateRoom)
	admin.Put("/:id", httpHandler.UpdateRoom)
	admin.Delete("/:id", httpHandler.DeleteRoom)

	// Set up gRPC server for internal service communication
	go func() {
		if err := core.RegisterGRPCService("chat", func(server *grpc.Server) {
			chatPb.RegisterRoomServiceServer(server, grpcHandler)
		}); err != nil {
			log.Fatalf("Failed to register chat gRPC service: %v", err)
		}
	}()

	// Set up health check
	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Printf("Room service initialized")

	// HTTP WebSocket route
	s.app.Get("/ws/:roomId/:userId", websocket.New(handler.HandleWebSocket(roomService)))

	// Simple ping route (optional)
	s.app.Get("/ping", func(c *fiber.Ctx) error {
		return c.SendString("pong")
	})

	log.Println("Chat service initialized")
}
