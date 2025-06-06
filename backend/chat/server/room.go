package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/router"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/service"

	kafkaUtil "github.com/HLLC-MFU/HLLC-2025/backend/pkg/kafka"

	// Members
	memberRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/members/repository"
	memberServicePkg "github.com/HLLC-MFU/HLLC-2025/backend/module/members/service"

	// Stickers
	stickerHandler "github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/handler"
	stickerRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/repository"
	stickerServicePkg "github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/service"

	// Chats
	chatHandlerPkg "github.com/HLLC-MFU/HLLC-2025/backend/module/chats/handler"
	chatRepoPkg "github.com/HLLC-MFU/HLLC-2025/backend/module/chats/repository"
	chatServicePkg "github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	userRepoPkg "github.com/HLLC-MFU/HLLC-2025/backend/module/users/repository"
	userServicePkg "github.com/HLLC-MFU/HLLC-2025/backend/module/users/service"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *server) roomService() {
	// Init Redis

	// Setup Kafka topic
	publisher := kafkaUtil.GetPublisher()
	topicName := "chat-room"
	if err := kafkaUtil.EnsureKafkaTopic("localhost:9092", topicName); err != nil {
		log.Fatalf("[Kafka] Ensure Topic error: %v", err)
	}

	// Repositories
	roomRepo := repository.NewRepository(s.db)
	memRepo := memberRepo.NewRoomMemberRepository(s.db)
	stkRepo := stickerRepo.NewStickerRepository(s.db)
	chatRepo := chatRepoPkg.NewRepository(s.db)
	userRepo := userRepoPkg.NewUserRepository(s.db)

	// Services
	memService := memberServicePkg.NewMemberService(memRepo)
	stkService := stickerServicePkg.NewStickerService(stkRepo)
	chatService := chatServicePkg.NewService(chatRepo, publisher, roomRepo)
	userService := userServicePkg.NewUserService(userRepo)
	roomService := service.NewService(roomRepo, publisher, memService, chatService, userService)

	// Handlers
	roomHandler := handler.NewHTTPHandler(roomService, memService, publisher, stkService, userService)
	stickerHandler := stickerHandler.NewHTTPHandler(stkService)
	chatHandler := chatHandlerPkg.NewHTTPHandler(chatService, memService, publisher, stkService, roomService)

	// Middleware
	s.app.Use(cors.New(s.config.FiberCORSConfig()))

	// Route registration
	api := s.api
	public := api.Group("/rooms")
	router.RegisterRoomRoutes(public, roomHandler, stickerHandler, chatHandler)

	s.app.Get("/ping", func(c *fiber.Ctx) error {
		return c.SendString("pong")
	})

	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Println("Room service initialized")
}
