package testutil

import (
	"bufio"
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"regexp"
	"strings"
	"time"

	userModel "chat/module/user/model"
	"chat/pkg/common"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const (
	WsEndpoint = "ws://localhost:1334/chat/ws/%s/%s" // roomId/userId
	MongoURI   = "mongodb://localhost:27017"
	DbName     = "hllc-2025"
	RedisAddr  = "localhost:6379"
)

var (
	// 🔧 ดึง ObjectId string จาก ObjectId(...) ด้วย regex
	objectIdRegex = regexp.MustCompile(`ObjectId\(([^)]+)\)`)
	testUsers     []string
)

func init() {
	var err error
	testUsers, err = LoadUserIDsFromCSV("./hllc-2025.users.csv")
	if err != nil {
		log.Fatalf("❌ Failed to load user IDs from CSV: %v", err)
	}
	log.Printf("✅ Loaded %d user IDs from CSV", len(testUsers))
}

// GetTestUsers returns the loaded test users
func GetTestUsers() []string {
	return testUsers
}

// ✅ ฟังก์ชันโหลด user id จากไฟล์ CSV
func LoadUserIDsFromCSV(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	lines, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	var ids []string
	for i, line := range lines {
		if i == 0 {
			continue // skip header
		}
		id := strings.TrimSpace(line[0])
		if id != "" {
			ids = append(ids, id)
		}
	}

	return ids, nil
}

// LoadUserIDs loads user IDs from a CSV file
func LoadUserIDs(filename string) ([]string, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(bufio.NewReader(file))
	var userIDs []string

	// Skip header if exists
	_, err = reader.Read()
	if err != nil && err != io.EOF {
		return nil, fmt.Errorf("failed to read header: %v", err)
	}

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to read record: %v", err)
		}
		if len(record) > 0 {
			userIDs = append(userIDs, record[0])
		}
	}

	log.Printf("✅ Loaded %d user IDs from CSV", len(userIDs))
	return userIDs, nil
}

// CreateTestUsers creates test users in the database
func CreateTestUsers(ctx context.Context, db *mongo.Database) error {
	collection := db.Collection("users")

	// Create a default role first
	roleID := primitive.NewObjectID()
	roleCollection := db.Collection("roles")
	role := bson.M{
		"_id":         roleID,
		"name":        "test_role",
		"permissions": []string{"chat:read", "chat:write"},
		"createdAt":   time.Now(),
		"updatedAt":   time.Now(),
	}
	if _, err := roleCollection.InsertOne(ctx, role); err != nil {
		return fmt.Errorf("failed to create test role: %w", err)
	}

	// Create test users
	for _, userID := range testUsers {
		objID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			log.Printf("[WARN] Invalid user ID %s: %v", userID, err)
			continue
		}

		// Check if user already exists
		count, err := collection.CountDocuments(ctx, bson.M{"_id": objID})
		if err != nil {
			return fmt.Errorf("failed to check user existence: %w", err)
		}
		if count > 0 {
			continue // Skip if user already exists
		}

		// Create user
		user := &userModel.User{
			ID: objID,
			Name: common.Name{
				First:  fmt.Sprintf("Test"),
				Middle: fmt.Sprintf("User"),
				Last:   userID[:8], // Use first 8 chars of ID as last name
			},
			Username:  fmt.Sprintf("test_user_%s", userID[:8]),
			Role:      roleID,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if _, err := collection.InsertOne(ctx, user); err != nil {
			log.Printf("[WARN] Failed to create test user %s: %v", userID, err)
			continue
		}
	}

	return nil
}

// CreateTestRoom creates a test room in the database
func CreateTestRoom(ctx context.Context, db *mongo.Database) (primitive.ObjectID, error) {
	roomID := primitive.NewObjectID()
	room := bson.M{
		"_id":        roomID,
		"name":       map[string]string{"th": "ห้องทดสอบ", "en": "Test Room"},
		"type":       "group",
		"members":    []primitive.ObjectID{},
		"created_at": time.Now(),
		"updated_at": time.Now(),
	}

	_, err := db.Collection("rooms").InsertOne(ctx, room)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("failed to create test room: %v", err)
	}

	return roomID, nil
}

// AddUsersToRoom adds the specified users to the room
func AddUsersToRoom(ctx context.Context, db *mongo.Database, roomID primitive.ObjectID, userIDs []string) error {
	// Convert string IDs to ObjectIDs
	memberIDs := make([]primitive.ObjectID, 0, len(userIDs))
	for _, id := range userIDs {
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("[WARN] Invalid user ID %s: %v", id, err)
			continue
		}
		memberIDs = append(memberIDs, objID)
	}

	// Update room with member IDs
	_, err := db.Collection("rooms").UpdateOne(
		ctx,
		bson.M{"_id": roomID},
		bson.M{"$addToSet": bson.M{"members": bson.M{"$each": memberIDs}}},
	)
	if err != nil {
		return fmt.Errorf("failed to add users to room: %v", err)
	}

	return nil
}
