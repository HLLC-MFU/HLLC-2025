package main

import (
	"context"
	"log"
	"os"
	"path/filepath"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/server"
)

/**
 * Main function for monolithic application
 *
 * @author Dev. Bengi (Backend Team)
 */

func main() {
	// Initialize context
	ctx := context.Background()

	// Set default environment file path
	defaultEnvPath := filepath.Join("env", "dev", ".env")
	
	// Allow override through command line argument
	envPath := defaultEnvPath
	if len(os.Args) >= 2 {
		envPath = os.Args[1]
	}
	
	log.Printf("Loading configuration from %s", envPath)
	cfg := config.LoadConfig(envPath)

	// Connect to the database
	db := core.DbConnect(ctx, cfg)
	defer core.DbDisconnect(ctx, db)

	// Connect to Redis
	redis := core.RedisConnect(ctx, cfg)
	defer core.RedisDisconnect(ctx, redis)

	// Create server instance - now it will initialize all modules
	srv := server.NewServer(cfg, db)

	// Start the monolithic server
	if err := srv.Start(); err != nil {
		log.Fatalf("Failed to start monolithic server: %v", err)
	}
}

