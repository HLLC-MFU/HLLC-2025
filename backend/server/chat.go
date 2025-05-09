package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/kafka"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/redis"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	kafkaUtil "github.com/HLLC-MFU/HLLC-2025/backend/pkg/kafka"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
)

func (s *server) chatService() {

	redis.InitRedis()

	// Start chat hub loop
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
	roomService.SyncRoomMembers()
	roomService.InitChatHub()

	// ✅ เพิ่ม Kafka Consumer ตรงนี้
	kafka.StartKafkaConsumer(
		"localhost:9092",
		[]string{}, // ตอน start ยังไม่มี topic
		"chat-group",
		roomService,
	)

	httpHandler := handler.NewHTTPHandler(roomService, memberService, publisher)

	// Set up HTTP middleware
	s.app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     "http://localhost:3000", // Frontend development URL
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE",
	}))

	api := s.app.Group("/api/v1")

	public := api.Group("/public/rooms")
	public.Get("/", httpHandler.ListRooms)
	public.Get("/:id", httpHandler.GetRoom)

	// Protected routes (auth required)
	protected := api.Group("/rooms")
	protected.Get("/", httpHandler.ListRooms)
	protected.Get("/:id", httpHandler.GetRoom)
	protected.Post("/", httpHandler.CreateRoom)
	protected.Put("/:id", httpHandler.UpdateRoom)
	protected.Delete("/:id", httpHandler.DeleteRoom)

	// ✅ Add Join and Leave routes here
	protected.Post("/:roomId/:userId/join", httpHandler.JoinRoom)
	protected.Post("/:roomId/:userId/leave", httpHandler.LeaveRoom)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/rooms")
	admin.Post("/", httpHandler.CreateRoom)
	admin.Put("/:id", httpHandler.UpdateRoom)
	admin.Delete("/:id", httpHandler.DeleteRoom)

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
