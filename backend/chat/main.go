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
	"time"

	chatController "chat/module/chat/controller"
	uploadController "chat/module/chat/controller"
	chatService "chat/module/chat/service"
	"chat/module/chat/utils"
	restrictionController "chat/module/restriction/controller"
	restrictionService "chat/module/restriction/service"
	groupController "chat/module/room/group/controller"
	groupService "chat/module/room/group/service"
	roomController "chat/module/room/room/controller"
	roomService "chat/module/room/room/service"
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
	// Load config
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	uploadPath := cfg.Upload.Path

	// Print upload path (or use it in your routes, etc.)
	fmt.Println("Upload Path:", uploadPath)

	// Setup logging
	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds)
	log.SetPrefix("[SERVER] ")

	// Add test log handler
	testLogChan := make(chan string, 1000)
	go func() {
		for msg := range testLogChan {
			log.Printf("[TEST] %s", msg)
		}
	}()

	// Connect to MongoDB
	db, err := connectMongoDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	// Connect to Redis
	redis, err := connectRedis(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	// Create Kafka bus
	kafkaBus := kafka.New(cfg.Kafka.Brokers, "chat-service")

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	})
	apiGroup := app.Group(cfg.App.APIBasePath)
	wsChatGroup := app.Group(cfg.App.WS_BASE_PATH)

	usersGroup := apiGroup.Group("/users")
	rolesGroup := apiGroup.Group("/roles")
	schoolsGroup := apiGroup.Group("/schools")
	majorsGroup := apiGroup.Group("/majors")
	roomsGroup := apiGroup.Group("/rooms")
	stickersGroup := apiGroup.Group("/stickers")
	chatGroup := apiGroup.Group("/chat")
	uploadsGroup := apiGroup.Group("/uploads")
	evouchersGroup := apiGroup.Group("/evouchers")
	restrictionGroup := apiGroup.Group("/restriction")

	// Initialize connection manager with default config
	connManager = mananger.NewConnectionManager(mananger.DefaultConfig())

	// Setup middleware
	setupMiddleware(app)
	
	// Setup cookie middleware
	cookieConfig := middleware.DefaultCookieConfig()
	app.Use(middleware.SetCookieMiddleware(cookieConfig))
	

	// Setup static file serving for uploads
	app.Static(uploadPath, "./uploads", fiber.Static{
		Browse:        false,  
		MaxAge:       86400,  
		Compress:     true,   
		ByteRange:    true,   
		CacheDuration: 24 * 60 * 60 * time.Second, 
		Next: func(c *fiber.Ctx) bool { 
			return c.Method() != fiber.MethodGet
		},
	})
	// Initialize services
	chatSvc := chatService.NewChatService(db, redis, kafkaBus, cfg)
	chatHub := chatSvc.GetHub()
	// Initialize all services
	schoolSvc := userService.NewSchoolService(db)
	majorSvc := userService.NewMajorService(db)
	roleSvc := userService.NewRoleService(db)
	userSvc := userService.NewUserService(db)
	roomSvc := roomService.NewRoomService(db, redis, cfg, chatHub)
	groupRoomSvc := groupService.NewGroupRoomService(db, redis, cfg, chatHub, roomSvc, kafkaBus)
	stickerSvc := stickerService.NewStickerService(db)
	chatEmitter := utils.NewChatEventEmitter(chatHub, kafkaBus, redis, db)
	restrictionSvc := restrictionService.NewRestrictionService(db, chatHub, chatEmitter, chatSvc.GetNotificationService(), kafkaBus)
	evoucherSvc := evoucherService.NewEvoucherService(db, redis, restrictionSvc, chatSvc.GetNotificationService(), chatHub, kafkaBus)

	// Initialize RBAC middleware
	rbacMiddleware := middleware.NewRBACMiddleware(db)

	userController.NewUserController(usersGroup, userSvc, rbacMiddleware)
	userController.NewRoleController(rolesGroup, roleSvc, rbacMiddleware)
	userController.NewSchoolController(schoolsGroup, schoolSvc)
	userController.NewMajorController(majorsGroup, majorSvc)
	roomController.NewRoomController(roomsGroup, roomSvc, rbacMiddleware, db)
	groupController.NewGroupRoomController(roomsGroup, groupRoomSvc, roomSvc, rbacMiddleware)
	stickerController.NewStickerController(stickersGroup, stickerSvc, rbacMiddleware)
	chatController.NewChatController(chatGroup, chatSvc, roomSvc, stickerSvc, restrictionSvc, rbacMiddleware, connManager, roleSvc, db)
	uploadController.NewUploadController(uploadsGroup, rbacMiddleware, chatSvc, userSvc)
	evoucherController.NewEvoucherController(evouchersGroup, evoucherSvc, roomSvc, rbacMiddleware)
	// Restriction controller (was moderation)
	restrictionController.NewModerationController(restrictionGroup, restrictionSvc, rbacMiddleware)
	// Health controller
	chatController.NewHealthController(chatGroup, chatSvc, rbacMiddleware)

	// Create WebSocket controller using wsChatGroup
	chatController.NewChatController(wsChatGroup, chatSvc, roomSvc, stickerSvc, restrictionSvc, rbacMiddleware, connManager, roleSvc, db)

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

	// CORS middleware with cookie support
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000,http://localhost:8080", // ระบุ domain ที่อนุญาต
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS,PATCH",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-Requested-With, Cookie",
		AllowCredentials: true, // สำคัญ! ต้องเป็น true เพื่อให้ส่ง cookies ได้
		ExposeHeaders:    "Set-Cookie",
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
		"User":        {},
		"Room":        {},
		"Chat":        {},
		"Sticker":     {},
		"Upload":      {},
		"Evoucher":    {},
		"Restriction": {},
		"Other":       {},
	}

	for _, route := range app.GetRoutes() {
		// Determine module based on path
		module := "Other"
		switch {
		case strings.Contains(route.Path, "/users") ||
			strings.Contains(route.Path, "/roles") ||
			strings.Contains(route.Path, "/schools") ||
			strings.Contains(route.Path, "/majors"):
			module = "User"
		case strings.Contains(route.Path, "/rooms"):
			module = "Room"
		case strings.Contains(route.Path, "/chat"):
			module = "Chat"
		case strings.Contains(route.Path, "/stickers"):
			module = "Sticker"
		case strings.Contains(route.Path, "/uploads"):
			module = "Upload"
		case strings.Contains(route.Path, "/evouchers"):
			module = "Evoucher"
		case strings.Contains(route.Path, "/restriction"):
			module = "Restriction"
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