package main

import (
	"context"
	"log"
	"os"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/server"
)

/**
 * Main function
 *
 * @author Dev. Bengi (Backend Team)
 */

func main() {

	// 1.Initialize context
	ctx := context.Background()

	// Load configuration from .env file
	cfg := config.LoadConfig(func() string {
		if len(os.Args) < 2 {
			log.Fatal("Error: .env path is required")
		}
		return os.Args[1]
	}())

	// Connect to the database
	db := core.DbConnect(ctx, &cfg)
	defer core.DbDisconnect(ctx, db)

	//Connect to Redis
	redis := core.RedisConnect(ctx, &cfg)
	defer core.RedisDisconnect(ctx, redis)
	
	//Start the server
	server.Start(ctx, &cfg, db, redis.Client)
}

