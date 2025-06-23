package server

import (
	"context"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	majorRepoPkg "github.com/HLLC-MFU/HLLC-2025/backend/module/majors/repository"
	majorServicePkg "github.com/HLLC-MFU/HLLC-2025/backend/module/majors/service"
	memberRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/members/repository"
	memberService "github.com/HLLC-MFU/HLLC-2025/backend/module/members/service"
	roomKafka "github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/kafka"
	RoomRepository "github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/repository"
	RoomService "github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/service"
	stickerRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/repository"
	stickerServicePkg "github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/service"
	userRepoPkg "github.com/HLLC-MFU/HLLC-2025/backend/module/users/repository"
	userServicePkg "github.com/HLLC-MFU/HLLC-2025/backend/module/users/service"
	kafkaUtil "github.com/HLLC-MFU/HLLC-2025/backend/pkg/kafka"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (s *server) chatService() {
	publisher := kafkaUtil.GetPublisher(s.config)

	kafkaTopics := []string{
		"chat-notifications",
	}

	for _, topic := range kafkaTopics {
		if err := kafkaUtil.EnsureKafkaTopic(s.config.KafkaAddress(), topic); err != nil {
			log.Fatalf("[Kafka] Ensure Topic %s error: %v", topic, err)
		}
		if err := kafkaUtil.ForceCreateTopic(s.config.KafkaAddress(), topic); err != nil {
			log.Fatalf("[Kafka] Force create Topic %s error: %v", topic, err)
		}
	}

	// Chats logic
	chatRepo := repository.NewRepository(s.db)
	roomRepo := RoomRepository.NewRepository(s.db)

	// Members logic
	memRepo := memberRepo.NewRoomMemberRepository(s.db)
	memberService := memberService.NewMemberService(memRepo)

	// Stickers logic
	stkRepo := stickerRepo.NewStickerRepository(s.db)
	stickerService := stickerServicePkg.NewStickerService(stkRepo)

	// Users logic
	userRepo := userRepoPkg.NewUserRepository(s.db)
	majorRepo := majorRepoPkg.NewRepository(s.db)
	majorService := majorServicePkg.NewService(majorRepo)
	userService := userServicePkg.NewUserService(userRepo, majorService)
	chatService := service.NewService(chatRepo, publisher, roomRepo, userService, memberService, s.config)

	// Rooms logic
	roomService := RoomService.NewService(roomRepo, publisher, memberService, chatService, userService, s.config)

	// Background services
	chatService.SyncRoomMembers()
	chatService.InitChatHub()

	// Start room-specific Kafka consumer
	roomKafka.StartKafkaConsumer(s.config.KafkaAddress(), chatService)

	// HTTP/WebSocket handler
	httpHandler := handler.NewHTTPHandler(chatService, memberService, publisher, stickerService, roomService, userService)

	// Fiber Middleware
	s.app.Use(cors.New(s.config.FiberCORSConfig()))

	s.app.Use("/ws/:roomId/:userId", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	s.app.Get("/ws/:roomId/:userId", websocket.New(func(conn *websocket.Conn) {
		roomID := conn.Params("roomId")
		userID := conn.Params("userId")

		// Get user information
		userObjID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			conn.Close()
			return
		}

		user, err := userService.GetById(context.Background(), userObjID)
		var username string
		if err == nil && user != nil {
			username = user.Username
		} else {
			username = userID
		}

		httpHandler.HandleWebSocket(conn, userID, username, roomID)
	}))

	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})
	s.app.Get("/ping", func(c *fiber.Ctx) error {
		return c.SendString("pong")
	})

	log.Println("Chat service initialized")
}
