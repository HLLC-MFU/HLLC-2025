package main

// import (
// 	"context"
// 	"log"
// 	"time"

// 	"github.com/HLLC-MFU/HLLC-2025/backend/config"
// 	"go.mongodb.org/mongo-driver/bson"
// 	"go.mongodb.org/mongo-driver/mongo"
// 	"go.mongodb.org/mongo-driver/mongo/options"
// 	"golang.org/x/crypto/bcrypt"
// )

// func main() {
// 	// Load config with the correct path
// 	cfg := config.LoadConfig("../env/dev/.env")
// 	if cfg == nil {
// 		log.Fatal("Failed to load config")
// 	}

// 	// Connect to MongoDB
// 	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
// 	defer cancel()

// 	log.Printf("Connecting to MongoDB at %s...", cfg.Db.Url)
// 	clientOptions := options.Client().ApplyURI(cfg.Db.Url)
// 	client, err := mongo.Connect(ctx, clientOptions)
// 	if err != nil {
// 		log.Fatalf("Failed to connect to MongoDB: %v", err)
// 	}
// 	defer client.Disconnect(ctx)

// 	// Check the connection
// 	err = client.Ping(ctx, nil)
// 	if err != nil {
// 		log.Fatalf("Failed to ping MongoDB: %v", err)
// 	}
// 	log.Println("Connected to MongoDB successfully")

// 	// Get the users collection
// 	userCollection := client.Database("hllc-2025").Collection("users")

// 	// Generate new hashed password
// 	plainPassword := "password123"
// 	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
// 	if err != nil {
// 		log.Fatalf("Failed to hash password: %v", err)
// 	}

// 	// Update admin user
// 	filter := bson.M{"username": "admin"}
// 	update := bson.M{
// 		"$set": bson.M{
// 			"password":     string(hashedPassword),
// 			"is_activated": true,
// 			"updated_at":   time.Now().Format(time.RFC3339),
// 		},
// 	}

// 	updateResult, err := userCollection.UpdateOne(ctx, filter, update)
// 	if err != nil {
// 		log.Fatalf("Failed to update admin password: %v", err)
// 	}

// 	if updateResult.MatchedCount == 0 {
// 		log.Fatal("Admin user not found. Please run the migrations first to create the admin user.")
// 	}

// 	log.Printf("Admin password has been reset to '%s'", plainPassword)
// 	log.Println("You can now log in with username 'admin' and the new password.")
// }