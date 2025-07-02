package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"sort"
	"strings"
	"syscall"

	chatController "chat/module/chat/controller"
	chatService "chat/module/chat/service"
	restrictionController "chat/module/restriction/controller"
	restrictionService "chat/module/restriction/service"
	roomController "chat/module/room/controller"
	roomService "chat/module/room/service"
	evoucherController "chat/module/sendEvoucher/controller"
	evoucherService "chat/module/sendEvoucher/service"
	stickerController "chat/module/sticker/controller"
	stickerService "chat/module/sticker/service"
	userController "chat/module/user/controller"
	userService "chat/module/user/service"
	"chat/pkg/config"
	mananger "chat/pkg/core/connection"
	"chat/pkg/core/kafka"
	"chat/pkg/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/websocket/v2"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Route structure to store route information
type Route struct {
	Method      string
	Path        string
	Handler     string
	Module      string
	Middleware  []string
}

// Package-level variable for connection manager
var connManager *mananger.ConnectionManager

// Helper functions for database connections
func connectMongoDB(cfg *config.Config) (*mongo.Database, error) {
	ctx := context.Background()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.Mongo.URI))
	if err != nil {
		return nil, err
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	return client.Database(cfg.Mongo.Database), nil
}

func connectRedis(cfg *config.Config) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Addr,
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})

	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, err
	}

	return client, nil
}

func main() {
	// Print current working directory for debugging
	pwd, err := os.Getwd()
	if err != nil {
		log.Printf("Warning: Could not get working directory: %v", err)
	} else {
		log.Printf("Current working directory: %s", pwd)
	}

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Printf("Error details: %v", err)
		log.Fatalf("Failed to load config: %v", err)
	}

	// Print loaded configuration for debugging
	log.Printf("Loaded configuration: App Port=%s, MongoDB URI=%s", 
		cfg.App.Port, 
		cfg.Mongo.URI,
	)

	// Initialize MongoDB connection
	mongoDB, err := connectMongoDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	// Initialize Redis connection
	redisClient, err := connectRedis(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	// Initialize Kafka bus
	kafkaBus := kafka.New(cfg.Kafka.Brokers, "chat-service")
	if err := kafkaBus.Start(); err != nil {
		log.Fatalf("Failed to start Kafka bus: %v", err)
	}

	// Create connection manager with default config
	connManager = mananger.NewConnectionManager(mananger.DefaultConfig())

	// Initialize Fiber app with matching buffer sizes
	app := fiber.New(fiber.Config{
		ReadBufferSize:  32 * 1024,  // Match WebSocket buffer size
		WriteBufferSize: 32 * 1024,  // Match WebSocket buffer size
	})

	// Setup middleware
	setupMiddleware(app)

	// Initialize services
	chatSvc := chatService.NewChatService(mongoDB, redisClient, kafkaBus, cfg)
	chatHub := chatSvc.GetHub()

	// Initialize all services
	schoolSvc := userService.NewSchoolService(mongoDB)
	majorSvc := userService.NewMajorService(mongoDB)
	roleSvc := userService.NewRoleService(mongoDB)
	userSvc := userService.NewUserService(mongoDB)
	roomSvc := roomService.NewRoomService(mongoDB, redisClient, cfg, chatHub)
	groupRoomSvc := roomService.NewGroupRoomService(mongoDB, redisClient, cfg, chatHub, roomSvc, kafkaBus)
	stickerSvc := stickerService.NewStickerService(mongoDB)
	restrictionSvc := restrictionService.NewRestrictionService(mongoDB, chatHub)
	evoucherSvc := evoucherService.NewEvoucherService(mongoDB, redisClient, restrictionSvc, chatSvc.GetNotificationService(), chatHub)

	// Initialize RBAC middleware
	rbacMiddleware := middleware.NewRBACMiddleware(mongoDB)

	// Initialize controllers
	userController.NewUserController(app, userSvc, rbacMiddleware)
	userController.NewRoleController(app, roleSvc, rbacMiddleware)
	userController.NewSchoolController(app, schoolSvc)
	userController.NewMajorController(app, majorSvc)
	roomController.NewRoomController(app, roomSvc)
	roomController.NewGroupRoomController(app, groupRoomSvc, roomSvc, rbacMiddleware)
	stickerController.NewStickerController(app, stickerSvc, rbacMiddleware)
	chatController.NewChatController(app,chatSvc,roomSvc,stickerSvc,restrictionSvc,rbacMiddleware,
		connManager,
	)
	chatController.NewMentionController(app, chatSvc, roomSvc)
	chatController.NewReactionController(app, chatSvc, roomSvc)
	evoucherController.NewEvoucherController(app, evoucherSvc, roomSvc, rbacMiddleware)
	
	// Restriction controller (was moderation)
	restrictionController.NewModerationController(app, restrictionSvc, rbacMiddleware)

	// Log all registered routes
	logRegisteredRoutes(app)

	// **NEW: Setup graceful shutdown**
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	// Start server in goroutine
	port := fmt.Sprintf(":%s", cfg.App.Port)
	log.Printf("🚀 Server starting on port %s", port)
	
	go func() {
		if err := app.Listen(port); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for shutdown signal
	<-c
	log.Printf("🛑 Shutdown signal received, starting graceful shutdown...")

	// **NEW: Graceful shutdown sequence**
	// 1. Stop accepting new connections
	log.Printf("📡 Stopping HTTP server...")
	if err := app.Shutdown(); err != nil {
		log.Printf("❌ Error shutting down HTTP server: %v", err)
	}

	// 2. Shutdown chat service worker pools  
	log.Printf("👷 Shutting down worker pools...")
	chatSvc.Shutdown()

	// 3. Stop Kafka bus
	log.Printf("📤 Stopping Kafka bus...")
	kafkaBus.Stop()

	log.Printf("✅ Graceful shutdown completed")
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
			// Check connection limits
			if err := connManager.HandleNewConnection(c.IP()); err != nil {
				return fiber.NewError(fiber.StatusServiceUnavailable, err.Error())
			}

			c.Locals("allowed", true)
			c.Locals("ws_config", connManager.GetWebSocketConfig())
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
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
