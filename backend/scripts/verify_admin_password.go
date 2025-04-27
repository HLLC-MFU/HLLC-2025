package main

// import (
// 	"context"
// 	"fmt"
// 	"log"
// 	"time"

// 	"github.com/HLLC-MFU/HLLC-2025/backend/config"
// 	"go.mongodb.org/mongo-driver/bson"
// 	"go.mongodb.org/mongo-driver/mongo"
// 	"go.mongodb.org/mongo-driver/mongo/options"
// 	"golang.org/x/crypto/bcrypt"
// )

// type User struct {
// 	Username    string `bson:"username"`
// 	Password    string `bson:"password"`
// 	IsActivated bool   `bson:"is_activated"`
// }

// func main() {
// 	// Parse command line arguments for testing password
// 	testPassword := "password123" // Default password to test

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

// 	// Find the admin user
// 	filter := bson.M{"username": "admin"}
// 	var adminUser User
// 	err = userCollection.FindOne(ctx, filter).Decode(&adminUser)
// 	if err != nil {
// 		log.Fatalf("Failed to find admin user: %v", err)
// 	}

// 	log.Printf("Found admin user, isActivated: %v", adminUser.IsActivated)
// 	log.Printf("Stored password hash: %s", adminUser.Password)

// 	// Verify the password
// 	err = bcrypt.CompareHashAndPassword([]byte(adminUser.Password), []byte(testPassword))
// 	if err != nil {
// 		log.Printf("❌ Password '%s' is NOT valid for admin user", testPassword)
// 		log.Printf("Error: %v", err)

// 		// Try to hash the password with the same method to check its format
// 		newHash, err := bcrypt.GenerateFromPassword([]byte(testPassword), bcrypt.DefaultCost)
// 		if err != nil {
// 			log.Fatalf("Failed to hash test password: %v", err)
// 		}
// 		log.Printf("For comparison, a new hash of the same password would be: %s", string(newHash))

// 		// Check if the password hash format is correct (bcrypt hashes start with $2a$)
// 		if len(adminUser.Password) < 4 || adminUser.Password[:4] != "$2a$" {
// 			log.Printf("⚠️ The stored password hash doesn't appear to be in the correct bcrypt format")
// 		}
// 	} else {
// 		log.Printf("✅ Password '%s' is valid for admin user", testPassword)
// 	}

// 	// Print extra info for debugging
// 	fmt.Println("\nDebugging info:")
// 	fmt.Printf("Admin user found: %v\n", adminUser.Username != "")
// 	fmt.Printf("Admin is activated: %v\n", adminUser.IsActivated)
// 	fmt.Printf("Password is stored: %v\n", adminUser.Password != "")
// 	fmt.Printf("Password hash length: %d characters\n", len(adminUser.Password))
// }