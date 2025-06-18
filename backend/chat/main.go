package main

import (
	"context"
	"fmt"
	"log"

	"chat/module/chat/controller"
	"chat/module/chat/service"
	"chat/pkg/config"
	"chat/pkg/core"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Create Fiber app
	app := fiber.New()

	// Setup MongoDB
	mongo, err := setupMongo(cfg)
	if err != nil {
		log.Fatalf("Failed to setup MongoDB: %v", err)
	}

	// Setup Redis
	redis, err := setupRedis(cfg)
	if err != nil {
		log.Fatalf("Failed to setup Redis: %v", err)
	}

	// Setup middleware
	setupMiddleware(app)

	// Setup controllers
	setupControllers(app, mongo, redis)

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

func setupRedis(cfg *config.Config) (*core.RedisCache, error) {
	redisConfig := &core.RedisConfig{
		Host:     cfg.Redis.Host,
		Port:     cfg.Redis.Port,
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	}

	return core.NewRedisCache(redisConfig)
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
}

func setupControllers(app *fiber.App, mongo *mongo.Database, redis *core.RedisCache) {
	// Initialize services
	chatService := service.NewChatService(mongo, redis)

	// Initialize controllers
	controller.NewChatController(app, chatService)
}