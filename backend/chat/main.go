package main

import (
	"context"
	"log"
	"os"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/server"
	"github.com/joho/godotenv"
)

/**
 * Main function
 *
 * @author Dev. Bengi (Backend Team)
 */

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

	// Start the server
	if err := srv.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
