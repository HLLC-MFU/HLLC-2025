package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"

	chatController "chat/module/chat/controller"
	chatService "chat/module/chat/service"
	chatUtils "chat/module/chat/utils"
	roomController "chat/module/room/controller"
	roomService "chat/module/room/service"
	stickerController "chat/module/sticker/controller"
	stickerService "chat/module/sticker/service"
	"chat/module/user/controller"
	"chat/module/user/service"
	"chat/pkg/config"
	"chat/pkg/core/kafka"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/websocket/v2"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Route structure to store route information
type Route struct {
	Method     string
	Path       string
	Handler    string
	Module     string
	Middleware []string
}

func main() {
	// Load environment variables from .env file
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	log.Println("KAFKA_HOST:", os.Getenv("KAFKA_HOST"))

	// Initialize context
	ctx := context.Background()

	// Load configuration from environment
	cfg := config.LoadConfig(".env")

	// Connect to the database
	db := core.DbConnect(ctx, cfg)
	defer core.DbDisconnect(ctx, db)

	// Connect to Redis
	redis := core.RedisConnect(ctx, cfg)
	defer core.RedisDisconnect(ctx, redis)

	// Create server instance
	srv := server.NewServer(cfg, db)

	// Start server
	port := fmt.Sprintf(":%s", cfg.App.Port)
	log.Printf("Server starting on port %s", port)
	if err := app.Listen(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func setupMongo(cfg *config.Config) (*mongo.Database, error) {
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(cfg.Mongo.URI))
	if err != nil {
		return nil, err
	}

	if err := client.Ping(context.Background(), nil); err != nil {
		return nil, err
	}

	return client.Database(cfg.Mongo.Database), nil
}

func setupMiddleware(app *fiber.App) {
	// Recovery middleware
	app.Use(recover.New())

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	// Logger middleware
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path}\n",
	}))

	// WebSocket middleware - apply to all WebSocket routes
	app.Use("/chat/ws/*", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
}

func setupControllers(app *fiber.App, mongo *mongo.Database, redisClient *redis.Client, cfg *config.Config) {
	// Initialize services
	schoolService := service.NewSchoolService(mongo)
	majorService := service.NewMajorService(mongo)
	roleService := service.NewRoleService(mongo)
	userService := service.NewUserService(mongo)
	stickerService := stickerService.NewStickerService(mongo)

	// Initialize Kafka bus for chat
	bus := kafka.New([]string{"localhost:9092"}, "chat-service")

	// Create required topics
	if err := bus.CreateTopics([]string{
		"room-events",                   // For room events (create, update, delete)
		chatUtils.RoomTopicPrefix + "*", // For room-specific chat messages
	}); err != nil {
		log.Printf("[ERROR] Failed to create Kafka topics: %v", err)
	}

	chatService := chatService.NewChatService(mongo, redisClient, bus, cfg)
	roomAndMemberService := roomService.NewRoomService(mongo, redisClient, cfg, chatService.GetHub())

	// Initialize controllers
	controller.NewSchoolController(app, schoolService)
	controller.NewMajorController(app, majorService)
	controller.NewRoleController(app, roleService)
	controller.NewUserController(app, userService)
	roomController.NewRoomController(app, roomAndMemberService)
	stickerController.NewStickerController(app, stickerService)
	chatController.NewChatController(app, chatService, roomAndMemberService, stickerService)
}

// logRegisteredRoutes prints all registered routes in a formatted way
func logRegisteredRoutes(app *fiber.App) {
	// Group routes by module
	modules := map[string][]Route{
		"User":    {},
		"Room":    {},
		"Chat":    {},
		"Sticker": {},
		"Other":   {},
	}

	for _, route := range app.GetRoutes() {
		// Determine module based on path
		module := "Other"
		switch {
		case strings.Contains(route.Path, "/api/users") ||
			strings.Contains(route.Path, "/api/roles") ||
			strings.Contains(route.Path, "/api/schools") ||
			strings.Contains(route.Path, "/api/majors"):
			module = "User"
		case strings.Contains(route.Path, "/api/rooms"):
			module = "Room"
		case strings.Contains(route.Path, "/chat"):
			module = "Chat"
		case strings.Contains(route.Path, "/api/stickers"):
			module = "Sticker"
		}

		// Get middleware names
		var middleware []string
		for _, m := range route.Handlers {
			name := fmt.Sprintf("%T", m)
			if strings.Contains(name, "middleware") {
				middleware = append(middleware, strings.TrimPrefix(name, "*"))
			}
		}

		r := Route{
			Method:     route.Method,
			Path:       route.Path,
			Handler:    route.Name,
			Module:     module,
			Middleware: middleware,
		}

		modules[module] = append(modules[module], r)
	}

	// Print routes grouped by module
	log.Println("\nRegistered Routes:")
	log.Println(strings.Repeat("=", 120))

	for module, routes := range modules {
		if len(routes) == 0 {
			continue
		}

		// Sort routes within each module
		sort.Slice(routes, func(i, j int) bool {
			return routes[i].Path < routes[j].Path
		})

		// Print module header
		log.Printf("\n[%s Module]\n", module)
		log.Println(strings.Repeat("-", 120))
		log.Printf("%-7s %-50s %-30s %s\n", "METHOD", "PATH", "MIDDLEWARE", "HANDLER")
		log.Println(strings.Repeat("-", 120))

		for _, route := range routes {
			middleware := "none"
			if len(route.Middleware) > 0 {
				middleware = strings.Join(route.Middleware, ", ")
			}
			log.Printf("%-7s %-50s %-30s %s\n",
				route.Method,
				route.Path,
				middleware,
				route.Handler,
			)
		}
	}

	log.Println(strings.Repeat("=", 120))
	log.Printf("\nTotal Routes: %d\n", len(app.GetRoutes()))
}
