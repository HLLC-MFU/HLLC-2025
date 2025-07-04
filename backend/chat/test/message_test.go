package test

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	chatModel "chat/module/chat/model"
	chatService "chat/module/chat/service"
	chatUtils "chat/module/chat/utils"
	"chat/pkg/config"
	"chat/pkg/core/kafka"
	"chat/test/testutil"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	gorillaWs "github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type (
	Message struct {
		Type      string                 `json:"type"`
		EventType string                 `json:"eventType"`
		Payload   map[string]interface{} `json:"payload"`
	}

	Response struct {
		Type      string                 `json:"type"`
		EventType string                 `json:"eventType"`
		Payload   map[string]interface{} `json:"payload"`
	}

	RawMessage struct {
		Data []byte
		Err  error
	}
)

// Integration Test: This test connects to the real production server and services
// Make sure the production server is running and the roomId/userIds exist in the production database before running this test.
// NOTE: This test will NOT clean up any data after running. Messages will remain in DB/Kafka for inspection.
func TestMassiveMessages(t *testing.T) {
	// 1. Start test server and get cleanup function
	cleanup, port := testutil.StartTestServer(t)
	defer cleanup()

	// 2. Connect to MongoDB
	ctx := context.Background()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(testutil.MongoURI))
	if err != nil {
		t.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(ctx)
	db := client.Database(testutil.DbName)

	// 3. Create test users
	if err := testutil.CreateTestUsers(ctx, db); err != nil {
		t.Fatalf("Failed to create test users: %v", err)
	}

	// 4. Create test room
	roomID, err := testutil.CreateTestRoom(ctx, db)
	if err != nil {
		t.Fatalf("Failed to create test room: %v", err)
	}

	// 5. Get test users
	userIDs := testutil.GetTestUsers()
	if len(userIDs) < 2 {
		t.Fatal("Not enough test users")
	}

	// 6. Add users to room
	if err := testutil.AddUsersToRoom(ctx, db, roomID, userIDs); err != nil {
		t.Fatalf("Failed to add users to room: %v", err)
	}

	// Test parameters
	const (
		numConnections   = 10
		messagesPerUser  = 10
		requiredSuccess  = 0.8 // 80% success rate required
		messageTemplate  = "Test message %d from user %s"
	)

	// Create semaphore to limit concurrent connections
	sem := make(chan struct{}, 5)
	var wg sync.WaitGroup
	var failureCount int32

	// Connect users and send messages
	for i := 0; i < numConnections; i++ {
		wg.Add(1)
		sem <- struct{}{} // Acquire semaphore

		go func(userID string) {
			defer func() {
				<-sem // Release semaphore
				wg.Done()
			}()

			// Connect to test WebSocket server
			url := fmt.Sprintf("ws://localhost:%d/chat/ws/%s/%s", port, roomID.Hex(), userID)
			log.Printf("[TEST] Connecting user %s to room %s", userID, roomID.Hex())

			// Create WebSocket connection using Gorilla websocket
			dialer := gorillaWs.Dialer{
				HandshakeTimeout: 45 * time.Second,
				ReadBufferSize:   1024,
				WriteBufferSize:  1024,
			}

			c, _, err := dialer.Dial(url, nil)
			if err != nil {
				log.Printf("[ERROR] Failed to connect to WebSocket server: %v", err)
				atomic.AddInt32(&failureCount, 1)
				return
			}
			defer c.Close()

			// Send messages
			for j := 0; j < messagesPerUser; j++ {
				// Create message payload
				message := fmt.Sprintf(messageTemplate, j+1, userID)
				log.Printf("[TEST] Creating message %d for user %s: %s", j+1, userID, message)

				event := Message{
					Type:      "message",
					EventType: "chat",
					Payload: map[string]interface{}{
						"message": message,
						"room": map[string]interface{}{
							"id": roomID.Hex(),
						},
						"user": map[string]interface{}{
							"id": userID,
						},
						"timestamp": time.Now(),
					},
				}

				// Send message
				messageBytes, err := json.Marshal(event)
				if err != nil {
					log.Printf("[ERROR] Failed to marshal message: %v", err)
					atomic.AddInt32(&failureCount, 1)
					continue
				}

				log.Printf("[TEST] Sending message for user %s: %s", userID, string(messageBytes))

				if err := c.WriteMessage(gorillaWs.TextMessage, messageBytes); err != nil {
					log.Printf("[ERROR] Failed to send message: %v", err)
					atomic.AddInt32(&failureCount, 1)
					continue
				}

				log.Printf("[TEST] Successfully sent message for user %s", userID)

				// Wait a bit for message to be persisted
				time.Sleep(100 * time.Millisecond)

				// Convert user ID to ObjectID
				userObjID, err := primitive.ObjectIDFromHex(userID)
				if err != nil {
					log.Printf("[ERROR] Invalid user ID: %v", err)
					atomic.AddInt32(&failureCount, 1)
					continue
				}

				// Verify message was saved
				filter := bson.M{
					"user_id": userObjID,
					"message": message,
				}
				log.Printf("[TEST] Checking MongoDB for message from user %s with filter: %v", userID, filter)

				var result bson.M
				err = db.Collection("chat-messages").FindOne(ctx, filter).Decode(&result)
				if err != nil {
					log.Printf("[ERROR] Message not found in database for user %s: %v", userID, err)
					atomic.AddInt32(&failureCount, 1)
					continue
				}

				log.Printf("[TEST] Successfully verified message in MongoDB for user %s", userID)
			}
		}(userIDs[i%len(userIDs)]) // Cycle through available users
	}

	// Wait for all goroutines to complete
	wg.Wait()

	// Calculate success rate
	totalMessages := numConnections * messagesPerUser
	failures := int(atomic.LoadInt32(&failureCount))
	successRate := float64(totalMessages-failures) / float64(totalMessages)

	log.Printf("[SUMMARY] Total messages: %d, Success: %d, Failure: %d, Success rate: %.2f%%",
		totalMessages, totalMessages-failures, failures, successRate*100)

	if successRate < requiredSuccess {
		t.Errorf("Success rate %.2f%% is below required %.2f%%", successRate*100, requiredSuccess*100)
	}
}

func TestMessagePersistence(t *testing.T) {
	// Setup test environment
	ctx := context.Background()

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(testutil.MongoURI))
	if err != nil {
		t.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(ctx)

	db := client.Database(testutil.DbName)

	// Connect to Redis
	redisClient := redis.NewClient(&redis.Options{
		Addr: testutil.RedisAddr,
	})
	defer redisClient.Close()

	// Create Kafka bus
	kafkaBus := kafka.New([]string{"localhost:9092"}, "test-group")
	defer kafkaBus.Stop()

	// Create config
	cfg := &config.Config{
		Mongo: config.MongoConfig{
			URI:      testutil.MongoURI,
			Database: testutil.DbName,
		},
		Redis: config.RedisConfig{
			Addr: testutil.RedisAddr,
		},
		Kafka: config.KafkaConfig{
			Brokers: []string{"localhost:9092"},
		},
	}

	// Create chat service
	chatSvc := chatService.NewChatService(db, redisClient, kafkaBus, cfg)

	// Create test users
	if err := testutil.CreateTestUsers(ctx, db); err != nil {
		t.Fatalf("Failed to create test users: %v", err)
	}

	// Create test room
	roomID, err := testutil.CreateTestRoom(ctx, db)
	if err != nil {
		t.Fatalf("Failed to create test room: %v", err)
	}

	// Get test users
	userIDs := testutil.GetTestUsers()
	if len(userIDs) < 2 {
		t.Fatal("Not enough test users available")
	}

	// Add users to room
	if err := testutil.AddUsersToRoom(ctx, db, roomID, userIDs[:2]); err != nil {
		t.Fatalf("Failed to add users to room: %v", err)
	}

	// Convert first user ID to ObjectID
	userObjID, err := primitive.ObjectIDFromHex(userIDs[0])
	if err != nil {
		t.Fatalf("Invalid user ID: %v", err)
	}

	// Create WebSocket handler
	app := fiber.New()
	app.Use("/chat/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/chat/ws/:roomId/:userId", websocket.New(func(c *websocket.Conn) {
		// Register client with hub
		chatSvc.GetHub().Register(chatUtils.Client{
			Conn:   c,
			RoomID: roomID,
			UserID: userObjID,
		})

		// Send test message
		testMessage := &chatModel.ChatMessage{
			ID:        primitive.NewObjectID(),
			RoomID:    roomID,
			UserID:    userObjID,
			Message:   "Test message",
			Timestamp: time.Now(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		// Send message through WebSocket
		messagePayload := map[string]interface{}{
			"type":    "message",
			"payload": testMessage,
		}

		messageBytes, err := json.Marshal(messagePayload)
		if err != nil {
			t.Fatalf("Failed to marshal message: %v", err)
		}

		if err := c.WriteMessage(gorillaWs.TextMessage, messageBytes); err != nil {
			t.Fatalf("Failed to send message: %v", err)
		}

		// Wait for message to be processed
		time.Sleep(2 * time.Second)

		// Verify message was saved in MongoDB
		var savedMessage chatModel.ChatMessage
		err = db.Collection("messages").FindOne(ctx, bson.M{"_id": testMessage.ID}).Decode(&savedMessage)
		if err != nil {
			t.Errorf("Failed to find message in MongoDB: %v", err)
		}

		// Verify message was saved in Redis
		cachedMessages, err := chatSvc.GetChatHistoryByRoom(ctx, roomID.Hex(), 10)
		if err != nil {
			t.Errorf("Failed to get messages from Redis: %v", err)
		}

		if len(cachedMessages) == 0 {
			t.Error("No messages found in Redis cache")
		}

		// Unregister client when connection closes
		chatSvc.GetHub().Unregister(chatUtils.Client{
			Conn:   c,
			RoomID: roomID,
			UserID: userObjID,
		})
	}))

	// Start server
	go func() {
		if err := app.Listen(fmt.Sprintf(":%d", 0)); err != nil {
			log.Printf("Server error: %v", err)
		}
	}()

	// Wait for server to start
	time.Sleep(100 * time.Millisecond)

	// Cleanup test data
	testutil.CleanupTestData(ctx, roomID.Hex())
}
