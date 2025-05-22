package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/kafka"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/redis"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	kafkaUtil "github.com/HLLC-MFU/HLLC-2025/backend/pkg/kafka"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"

	// "github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	stickerRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/repository"
	stickerService "github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	websocket "github.com/gofiber/websocket/v2"
)

func (s *server) chatService() {
	redis.InitRedis()

	publisher := kafka.GetPublisher()
	topicName := "chat-room"
	err := kafkaUtil.EnsureKafkaTopic("localhost:9092", topicName)
	if err != nil {
		log.Fatalf("[Kafka] Ensure Topic error: %v", err)
	}

	repo := repository.NewRepository(s.db)
	roomService := service.NewService(repo, publisher)
	memberRepo := repository.NewRoomMemberRepository(s.db)
	memberService := service.NewMemberService(memberRepo)
	stickerRepo := stickerRepo.NewStickerRepository(s.db)
	stickerService := stickerService.NewStickerService(stickerRepo)
	roomService.SyncRoomMembers()
	roomService.InitChatHub()

	kafka.StartKafkaConsumer(
		"localhost:9092",
		[]string{},
		"chat-group",
		roomService,
	)

	httpHandler := handler.NewHTTPHandler(roomService, memberService, publisher, stickerService)

	s.app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     "http://localhost:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE",
	}))

	s.app.Use("/ws/:roomId", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	s.app.Get("/ws/:roomId", middleware.WrapWebSocketWithJWT(
		middleware.JWTMiddleware(),
		func(conn *websocket.Conn, userID, username, roomID string) {
			httpHandler.HandleWebSocket(conn, userID, username, roomID)
		},
	))

	api := s.app.Group("/api/v1")

	public := api.Group("/rooms")
	httpHandler.RegisterRoutes(public)

	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	s.app.Static("/uploads", "./uploads")

	httpHandler.RegisterRoutes(public)

	s.app.Get("/ping", func(c *fiber.Ctx) error {
		return c.SendString("pong")
	})

	log.Println("Chat service initialized")
}
