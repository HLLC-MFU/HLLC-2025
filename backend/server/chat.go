package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/kafka"
	chatPb "github.com/HLLC-MFU/HLLC-2025/backend/module/chats/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	kafkaUtil "github.com/HLLC-MFU/HLLC-2025/backend/pkg/kafka"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
)

func (s *server) chatService() {
	// Start chat hub loop
	publisher := kafka.GetPublisher()

	topicName := "chat-room"
	err := kafkaUtil.EnsureKafkaTopic("localhost:9092", topicName)
	if err != nil {
		log.Fatalf("[Kafka] Ensure Topic error: %v", err)
	}

	repo := repository.NewRepository(s.db)
	roomService := service.NewService(repo, publisher)
	roomService.InitChatHub()

	// ✅ เพิ่ม Kafka Consumer ตรงนี้
	kafka.StartKafkaConsumer(
		"localhost:9092",
		[]string{}, // ตอน start ยังไม่มี topic
		"chat-group",
		roomService,
	)

	httpHandler := handler.NewHTTPHandler(roomService, publisher)
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
		jwtConfig := &core.JwtConfig{
			AccessSecretKey:  s.config.Jwt.AccessSecretKey,
			RefreshSecretKey: s.config.Jwt.RefreshSecretKey,
			ApiSecretKey:     s.config.Jwt.ApiSecretKey,
			AccessDuration:   s.config.Jwt.AccessDuration,
			RefreshDuration:  s.config.Jwt.RefreshDuration,
			ApiDuration:      s.config.Jwt.ApiDuration,
		}
		grpcServer, lis := core.NewGrpcServer(jwtConfig, s.config.Chat.GRPCAddr)
		chatPb.RegisterRoomServiceServer(grpcServer, grpcHandler)

		log.Printf("Room gRPC server listening on %s", s.config.Chat.GRPCAddr)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("gRPC server error: %v", err)
		}
	}()

	// Set up health check
	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Printf("Room service initialized")

	// HTTP WebSocket route
	s.app.Get("/ws/:roomId/:userId", websocket.New(httpHandler.HandleWebSocket()))

	// Simple ping route (optional)
	s.app.Get("/ping", func(c *fiber.Ctx) error {
		return c.SendString("pong")
	})

	log.Println("Chat service initialized")
}
