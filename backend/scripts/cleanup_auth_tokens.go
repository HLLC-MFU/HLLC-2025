package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// cleanup_auth_tokens.go
// This script cleans up the auth_tokens collection by removing all tokens
// This is useful when auth tokens have become corrupted or are causing login issues
// Author: Nimit Tanboontor

func main() {
	// Load config
	cfg := config.LoadConfig("./env/dev/.env.auth")
	if cfg == nil {
		log.Fatal("Failed to load config")
	}

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	clientOptions := options.Client().ApplyURI(cfg.Db.Url)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(ctx)

	// Select database and collection
	db := client.Database("hllc-2025")
	authTokens := db.Collection("auth_tokens")

	// Check how many tokens exist
	count, err := authTokens.CountDocuments(ctx, bson.M{})
	if err != nil {
		log.Fatalf("Failed to count auth tokens: %v", err)
	}
	fmt.Printf("Found %d auth tokens before cleanup\n", count)

	// Delete all tokens
	result, err := authTokens.DeleteMany(ctx, bson.M{})
	if err != nil {
		log.Fatalf("Failed to delete auth tokens: %v", err)
	}
	fmt.Printf("Deleted %d auth tokens\n", result.DeletedCount)

	// Also check the sessions collection for any issues
	sessions := db.Collection("sessions")
	
	// Mark all sessions as inactive
	_, err = sessions.UpdateMany(
		ctx, 
		bson.M{"is_active": true}, 
		bson.M{
			"$set": bson.M{
				"is_active": false,
				"updated_at": time.Now(),
			},
		},
	)
	
	if err != nil {
		log.Printf("Warning: Failed to deactivate sessions: %v", err)
	} else {
		fmt.Println("Successfully deactivated all active sessions")
	}

	fmt.Println("Auth tokens cleanup completed successfully")
	fmt.Println("You should now be able to log in without any issues")
} 