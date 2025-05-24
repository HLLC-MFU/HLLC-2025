package main

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	chatKafka "github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/chats/kafka"
	chatRoutes "github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/chats/routes"
	stickerRoutes "github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/stickers/routes"
	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Config struct {
	MongoURI      string
	RedisAddr     string
	Port          string
	HTTPTimeout   time.Duration
	DBTimeout     time.Duration
	RedisTimeout  time.Duration
	KafkaBrokers  []string
	KafkaGroupID  string
}

func loadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	httpTimeout, _ := time.ParseDuration(os.Getenv("HTTP_TIMEOUT"))
	if httpTimeout == 0 {
		httpTimeout = 30 * time.Second
	}

	dbTimeout, _ := time.ParseDuration(os.Getenv("DB_TIMEOUT"))
	if dbTimeout == 0 {
		dbTimeout = 10 * time.Second
	}

	redisTimeout, _ := time.ParseDuration(os.Getenv("REDIS_TIMEOUT"))
	if redisTimeout == 0 {
		redisTimeout = 5 * time.Second
	}

	kafkaBrokers := strings.Split(os.Getenv("KAFKA_BROKERS"), ",")
	if len(kafkaBrokers) == 0 || kafkaBrokers[0] == "" {
		kafkaBrokers = []string{"localhost:9092"}
	}

	return &Config{
		MongoURI:     os.Getenv("MONGO_URI"),
		RedisAddr:    os.Getenv("REDIS_ADDR"),
		Port:         os.Getenv("PORT"),
		HTTPTimeout:  httpTimeout,
		DBTimeout:    dbTimeout,
		RedisTimeout: redisTimeout,
		KafkaBrokers: kafkaBrokers,
		KafkaGroupID: os.Getenv("KAFKA_GROUP_ID"),
	}
}

func connectMongo(ctx context.Context, uri string) *mongo.Client {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}

	log.Println("Connected to MongoDB")
	return client
}

func connectRedis(addr string, timeout time.Duration) *redis.Client {
	client := redis.NewClient(&redis.Options{
		Addr:        addr,
		ReadTimeout: timeout,
	})

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	log.Println("Connected to Redis")
	return client
}

func main() {
	// Initialize context
	ctx := context.Background()

	// Load configuration
	cfg := loadConfig()

	// Connect to MongoDB
	mongoClient := connectMongo(ctx, cfg.MongoURI)
	defer mongoClient.Disconnect(ctx)

	// Connect to Redis
	redisClient := connectRedis(cfg.RedisAddr, cfg.RedisTimeout)
	defer redisClient.Close()

	// Create Fiber app with custom config
	app := fiber.New(fiber.Config{
		ReadTimeout:  cfg.HTTPTimeout,
		WriteTimeout: cfg.HTTPTimeout,
		IdleTimeout:  cfg.HTTPTimeout,
	})

	// Add global middlewares
	app.Use(cors.New())
	app.Use(middleware.ErrorHandler())
	app.Use(middleware.TimeoutMiddleware(cfg.HTTPTimeout))

	// WebSocket middleware
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	// Get MongoDB database
	db := mongoClient.Database("hllc")

	// Initialize Kafka publisher
	publisher := chatKafka.NewPublisher(cfg.KafkaBrokers)

	// Setup routes with Kafka publisher
	chatRoutes.SetupChatRoutes(app, db, publisher)
	stickerRoutes.SetupStickerRoutes(app, db)

	// Health check route
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	// Start server
	log.Printf("Server starting on port %s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
} 