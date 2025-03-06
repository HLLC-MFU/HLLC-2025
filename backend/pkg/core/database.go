package core

import (
	"context"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Database struct {
	Client *mongo.Client
	DB     *mongo.Database
}

func NewDatabase(cfg *config.Config) *Database {
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(cfg.MongoDB.URI))
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}

	// Ping the database
	if err := client.Ping(context.Background(), nil); err != nil {
		log.Fatal("Failed to ping MongoDB:", err)
	}

	return &Database{
		Client: client,
		DB:     client.Database(cfg.MongoDB.Database),
	}
}

func (d *Database) Disconnect(ctx context.Context) error {
	return d.Client.Disconnect(ctx)
}
