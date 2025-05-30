package core

import (
	"context"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

/**
 * Database connection functions
 *
 * @author Dev. Bengi (Backend Team)
 */

func NewMongoDbConnection(ctx context.Context, url string) *mongo.Client {
	ctx, cancle := context.WithTimeout(ctx, 10*time.Second)
	defer cancle()

	clientOptions := options.Client()
	clientOptions.ApplyURI(url)
	clientOptions.SetMaxPoolSize(100)
	clientOptions.SetMinPoolSize(10)
	clientOptions.SetMaxConnIdleTime(20 * time.Second)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}

	log.Println("Connected to MongoDB")
	return client
}

func DbConnect(ctx context.Context, cfg *config.Config) *mongo.Client {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.Db.Url))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	log.Println("Connected to MongoDB")
	return client
}

func DbDisconnect(ctx context.Context, client *mongo.Client) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	client.Disconnect(ctx)
}