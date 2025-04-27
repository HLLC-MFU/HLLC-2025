package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/bootstrap"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/routes"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// Initialize logger
	logging.Init(logging.InfoLevel, true)
	logging.DefaultLogger.Info("Starting application...")
	logging.DefaultLogger.Info("Environment", "env", os.Getenv("APP_ENV"))

	// Load config
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "dev"
	}
	configPath := getConfigPath(env)
	cfg := config.LoadConfig(configPath)

	// --- [ TRY TO CONNECT DATABASE ] ---
	logging.DefaultLogger.Info("Trying to connect MongoDB...")

	clientOptions := options.Client().ApplyURI(cfg.Db.Url)
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		log.Fatalf("Failed to connect MongoDB: %v", err)
	}

	// Try ping database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}

	logging.DefaultLogger.Info("Successfully connected to MongoDB!")

	// Initialize database collections and indexes
	if err := bootstrap.InitializeMongoDB(ctx, client, cfg.Db.Database); err != nil {
		log.Fatalf("Failed to initialize MongoDB: %v", err)
	}

	// Get database instance
	db := client.Database(cfg.Db.Database)

	defer func() {
		if err := client.Disconnect(context.Background()); err != nil {
			log.Fatalf("Error disconnecting MongoDB: %v", err)
		}
	}()

	// Initialize Fiber
	app := fiber.New()

	// Register all routes
	routes.RegisterRoutes(app, db)

	// Start server
	port := cfg.App.Port
	if port == "" {
		port = "8080"
	}

	logging.DefaultLogger.Info("Listening on port " + port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start Fiber server: %v", err)
	}
}

// getConfigPath returns the path to the environment-specific config file
func getConfigPath(env string) string {
	envDir := filepath.Join("env", env)
	if _, err := os.Stat(envDir); os.IsNotExist(err) {
		log.Printf("Environment directory %s not found, using .env file in root", envDir)
		return ".env"
	}

	envFile := filepath.Join(envDir, ".env")
	if _, err := os.Stat(envFile); os.IsNotExist(err) {
		log.Printf("Environment file %s not found, using .env file in root", envFile)
		return ".env"
	}

	return envFile
}
