package main

import (
	"context"
	"log"
	"os"
	"path/filepath"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/HLLC-MFU/HLLC-2025/backend/server"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

/**
 * Main function for monolithic application
 *
 * @author Dev. Bengi (Backend Team)
 */

func main() {
	// Initialize structured logger
	logging.Init(logging.InfoLevel, true) // Use pretty console output in development
	logging.DefaultLogger.Info("Starting application...")
	logging.DefaultLogger.Info("Environment: ", os.Getenv("APP_ENV"))

	// Determine environment and load configs
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "dev" // Default to development environment
	}

	configPath := getConfigPath(env)
	cfg := config.LoadConfig(configPath)

	// Connect to MongoDB
	clientOptions := options.Client().ApplyURI(cfg.Db.Url)
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	// Create and start server
	srv := server.NewServer(cfg, client)
	if err := srv.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// getConfigPath returns the path to the environment-specific config file
func getConfigPath(env string) string {
	// Check if the env directory exists
	envDir := filepath.Join("env", env)
	if _, err := os.Stat(envDir); os.IsNotExist(err) {
		log.Printf("Environment directory %s not found, using .env file in root", envDir)
		return ".env"
	}

	// Check if .env file exists in the environment directory
	envFile := filepath.Join(envDir, ".env")
	if _, err := os.Stat(envFile); os.IsNotExist(err) {
		log.Printf("Environment file %s not found, using .env file in root", envFile)
		return ".env"
	}

	return envFile
}

