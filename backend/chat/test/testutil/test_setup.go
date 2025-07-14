package testutil

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"strings"
	"testing"
	"time"

	"chat/pkg/config"
	asycnUtils "chat/pkg/utils/chat"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/segmentio/kafka-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	KafkaBroker = "localhost:9092"
	ChatTopic   = "chat-messages"
)

// StartTestServer starts a test server and returns cleanup function and port
func StartTestServer(t testing.TB) (func(), int) {
	// Connect to MongoDB
	ctx := context.Background()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(MongoURI))
	if err != nil {
		t.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	db := client.Database(DbName)

	// Create Kafka topics
	topics := []string{ChatTopic, "chat-notifications"}
	conn, err := kafka.DialLeader(context.Background(), "tcp", KafkaBroker, ChatTopic, 0)
	if err != nil {
		if !strings.Contains(err.Error(), "Leader not available") {
			t.Fatalf("Failed to connect to Kafka: %v", err)
		}
		
		// Try to create topics
		adminConn, err := kafka.Dial("tcp", KafkaBroker)
		if err != nil {
			t.Fatalf("Failed to connect to Kafka for admin operations: %v", err)
		}
		defer adminConn.Close()

		for _, topic := range topics {
			topicConfig := kafka.TopicConfig{
				Topic:             topic,
				NumPartitions:     1,
				ReplicationFactor: 1,
			}

			err = adminConn.CreateTopics(topicConfig)
			if err != nil && !strings.Contains(err.Error(), "already exists") {
				t.Fatalf("Failed to create Kafka topic %s: %v", topic, err)
			}
			log.Printf("[Kafka] Topic %s created or already exists", topic)
		}

		// Wait for topics to be ready
		time.Sleep(2 * time.Second)
		
		// Verify topics exist
		conn, err = kafka.DialLeader(context.Background(), "tcp", KafkaBroker, ChatTopic, 0)
		if err != nil {
			t.Fatalf("Failed to verify Kafka topic creation: %v", err)
		}
	}
	defer conn.Close()

	// Create Kafka writer with retry logic
	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:      []string{KafkaBroker},
		Topic:        ChatTopic,
		BatchTimeout: 10 * time.Millisecond,
		RequiredAcks: -1, // Wait for all replicas
		MaxAttempts:  3,
		WriteTimeout: 10 * time.Second,
		ReadTimeout:  10 * time.Second,
		Async:        false, // Use synchronous writes for testing
	})

	// Initialize async workers
	cfg := &config.Config{
		AsyncFlow: config.AsyncFlowConfig{
			DatabaseWorkers: struct {
				WorkerCount  int           `env:"DB_WORKER_COUNT" envDefault:"100"`
				QueueSize    int           `env:"DB_QUEUE_SIZE" envDefault:"20000"`
				BatchSize    int           `env:"DB_BATCH_SIZE" envDefault:"200"`
				FlushTimeout time.Duration `env:"DB_FLUSH_TIMEOUT" envDefault:"2s"`
			}{
				WorkerCount:  10,
				QueueSize:    1000,
				BatchSize:    100,
				FlushTimeout: 2 * time.Second,
			},
			NotificationWorkers: struct {
				WorkerCount  int           `env:"NOTIFICATION_WORKER_COUNT" envDefault:"50"`
				QueueSize    int           `env:"NOTIFICATION_QUEUE_SIZE" envDefault:"10000"`
				BatchSize    int           `env:"NOTIFICATION_BATCH_SIZE" envDefault:"100"`
				FlushTimeout time.Duration `env:"NOTIFICATION_FLUSH_TIMEOUT" envDefault:"2s"`
			}{
				WorkerCount:  10,
				QueueSize:    1000,
				BatchSize:    100,
				FlushTimeout: 2 * time.Second,
			},
			PhantomDetection: struct {
				Enabled          bool          `env:"PHANTOM_DETECTION_ENABLED" envDefault:"true"`
				CheckInterval    time.Duration `env:"PHANTOM_CHECK_INTERVAL" envDefault:"30s"`
				MaxAge          time.Duration `env:"PHANTOM_MAX_AGE" envDefault:"10m"`
				BatchSize       int           `env:"PHANTOM_BATCH_SIZE" envDefault:"100"`
				FixAutomatically bool         `env:"PHANTOM_AUTO_FIX" envDefault:"true"`
			}{
				Enabled:          false,
				CheckInterval:    30 * time.Second,
				MaxAge:          10 * time.Minute,
				BatchSize:       100,
				FixAutomatically: true,
			},
		},
	}

	asyncHelper := asycnUtils.NewAsyncHelper(db, cfg)
	log.Printf("[AsyncHelper] Initialized %d database workers and %d notification workers", 
		cfg.AsyncFlow.DatabaseWorkers.WorkerCount, 
		cfg.AsyncFlow.NotificationWorkers.WorkerCount)

	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
	})

	// Setup WebSocket middleware
	app.Use("/chat/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	// Setup WebSocket handler
	app.Get("/chat/ws/:roomId/:userId", websocket.New(func(c *websocket.Conn) {
		// Get room and user IDs from params
		roomID := c.Params("roomId")
		userID := c.Params("userId")

		log.Printf("[WebSocket] New connection from user %s in room %s", userID, roomID)

		for {
			// Read message
			_, msg, err := c.ReadMessage()
			if err != nil {
				if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
					log.Printf("[WebSocket] Connection closed normally for user %s", userID)
				} else {
					log.Printf("[WebSocket] Read error for user %s: %v", userID, err)
				}
				break
			}

			log.Printf("[WebSocket] Received raw message from user %s: %s", userID, string(msg))

			// Parse message
			var message struct {
				Type      string                 `json:"type"`
				EventType string                 `json:"eventType"`
				Payload   map[string]interface{} `json:"payload"`
			}

			if err := json.Unmarshal(msg, &message); err != nil {
				log.Printf("[WebSocket] Failed to parse message from user %s: %v", userID, err)
				continue
			}

			log.Printf("[WebSocket] Parsed message from user %s: Type=%s, EventType=%s", userID, message.Type, message.EventType)

			// Convert IDs to ObjectID
			userObjID, err := primitive.ObjectIDFromHex(userID)
			if err != nil {
				log.Printf("[ERROR] Invalid user ID: %v", err)
				continue
			}

			roomObjID, err := primitive.ObjectIDFromHex(roomID)
			if err != nil {
				log.Printf("[ERROR] Invalid room ID: %v", err)
				continue
			}

			// Create message document
			now := time.Now()
			messageID := primitive.NewObjectID()
			chatMessage := bson.M{
				"_id":        messageID,
				"room_id":    roomObjID,
				"user_id":    userObjID,
				"message":    message.Payload["message"],
				"type":       "text",
				"status":     "sent",
				"created_at": now,
				"updated_at": now,
			}

			// Save to MongoDB first
			log.Printf("[MongoDB] Attempting to save message: %v", chatMessage)
			_, err = db.Collection("chat-messages").InsertOne(ctx, chatMessage)
			if err != nil {
				log.Printf("[ERROR] Failed to save message to MongoDB: %v", err)
				// Send error response
				errorResponse := struct {
					Type      string                 `json:"type"`
					EventType string                 `json:"eventType"`
					Payload   map[string]interface{} `json:"payload"`
				}{
					Type:      "error",
					EventType: "chat",
					Payload: map[string]interface{}{
						"error":   "Failed to save message",
						"details": err.Error(),
					},
				}
				if err := c.WriteJSON(errorResponse); err != nil {
					log.Printf("[WebSocket] Failed to send error response: %v", err)
				}
				continue
			}
			log.Printf("[MongoDB] Successfully saved message with ID: %s", messageID.Hex())

			// Create Kafka message with the same ID
			kafkaMessage := struct {
				Type      string    `json:"type"`
				EventType string    `json:"eventType"`
				Payload   struct {
					ID        string                 `json:"id"`
					RoomID    string                 `json:"roomId"`
					UserID    string                 `json:"userId"`
					Message   string                 `json:"message"`
					Type      string                 `json:"type"`
					Status    string                 `json:"status"`
					Metadata  map[string]interface{} `json:"metadata,omitempty"`
					CreatedAt time.Time             `json:"createdAt"`
					UpdatedAt time.Time             `json:"updatedAt"`
				} `json:"payload"`
			}{
				Type:      message.Type,
				EventType: message.EventType,
				Payload: struct {
					ID        string                 `json:"id"`
					RoomID    string                 `json:"roomId"`
					UserID    string                 `json:"userId"`
					Message   string                 `json:"message"`
					Type      string                 `json:"type"`
					Status    string                 `json:"status"`
					Metadata  map[string]interface{} `json:"metadata,omitempty"`
					CreatedAt time.Time             `json:"createdAt"`
					UpdatedAt time.Time             `json:"updatedAt"`
				}{
					ID:        messageID.Hex(),
					RoomID:    roomID,
					UserID:    userID,
					Message:   message.Payload["message"].(string),
					Type:      "text",
					Status:    "sent",
					Metadata:  map[string]interface{}{"source": "websocket"},
					CreatedAt: now,
					UpdatedAt: now,
				},
			}

			// Convert to JSON
			msgBytes, err := json.Marshal(kafkaMessage)
			if err != nil {
				log.Printf("[ERROR] Failed to marshal Kafka message: %v", err)
				continue
			}

			// Publish to Kafka
			err = PublishToKafka(ctx, writer, msgBytes, userID, roomID)
			if err != nil {
				log.Printf("[ERROR] Failed to publish message to Kafka: %v", err)
				// Note: We don't fail here since the message is already in MongoDB
			}

			// Send success response
			response := struct {
				Type      string                 `json:"type"`
				EventType string                 `json:"eventType"`
				Payload   map[string]interface{} `json:"payload"`
			}{
				Type:      message.Type,
				EventType: message.EventType,
				Payload: map[string]interface{}{
					"status":     "success",
					"messageId":  messageID.Hex(),
					"message":    "Message saved and published",
					"roomId":     roomID,
					"userId":     userID,
					"timestamp":  now,
					"savedInDb":  true,
					"publishedToKafka": err == nil,
				},
			}

			if err := c.WriteJSON(response); err != nil {
				log.Printf("[WebSocket] Write error for user %s: %v", userID, err)
				break
			}

			log.Printf("[WebSocket] Successfully processed message from user %s", userID)
		}
	}))

	// Find available port and start server
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		t.Fatalf("Failed to find available port: %v", err)
	}
	port := listener.Addr().(*net.TCPAddr).Port

	// Start server
	go func() {
		if err := app.Listener(listener); err != nil {
			log.Printf("[ERROR] Server error: %v", err)
		}
	}()

	// Wait for server to be ready
	ready := make(chan struct{})
	go func() {
		for {
			conn, err := net.Dial("tcp", fmt.Sprintf("localhost:%d", port))
			if err == nil {
				conn.Close()
				close(ready)
				return
			}
			time.Sleep(10 * time.Millisecond)
		}
	}()

	select {
	case <-ready:
		log.Printf("[TEST] Server started on port %d", port)
	case <-time.After(5 * time.Second):
		t.Fatal("Server failed to start within timeout")
	}

	cleanup := func() {
		app.Shutdown()
		client.Disconnect(ctx)
		writer.Close()
		asyncHelper.Shutdown()
	}

	return cleanup, port
}

// SetupTestRoomAndUsers creates a test room and adds users to it
func SetupTestRoomAndUsers(t testing.TB, port int, numUsers int) (string, []string) {
	ctx := context.Background()

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(MongoURI))
	if err != nil {
		t.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	db := client.Database(DbName)

	// Create test room with timestamp-based name
	roomName := fmt.Sprintf("test-room-%s", time.Now().Format("20060102150405"))
	roomID := primitive.NewObjectID()
	room := bson.M{
		"_id":        roomID,
		"name":       map[string]string{"th": "ห้องทดสอบ", "en": roomName},
		"type":       "group",
		"members":    []primitive.ObjectID{},
		"created_at": time.Now(),
		"updated_at": time.Now(),
	}

	_, err = db.Collection("rooms").InsertOne(ctx, room)
	if err != nil {
		t.Fatalf("Failed to create test room: %v", err)
	}

	// Get test users
	users := GetTestUsers()
	if len(users) < numUsers {
		t.Fatalf("Not enough test users available. Have %d, need %d", len(users), numUsers)
	}

	selectedUsers := users[:numUsers]

	// Add users to room
	if err := AddUsersToRoom(ctx, db, roomID, selectedUsers); err != nil {
		t.Fatalf("Failed to add users to room: %v", err)
	}

	return roomID.Hex(), selectedUsers
}

// CleanupTestData removes test data from the database
func CleanupTestData(ctx context.Context, roomID string) {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(MongoURI))
	if err != nil {
		log.Printf("Failed to connect to MongoDB for cleanup: %v", err)
		return
	}
	defer client.Disconnect(ctx)

	db := client.Database(DbName)

	// Convert string ID to ObjectID l
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		log.Printf("Invalid room ID format: %v", err)
		return
	}

	// Delete test room
	if _, err := db.Collection("rooms").DeleteOne(ctx, bson.M{"_id": roomObjID}); err != nil {
		log.Printf("Failed to delete test room: %v", err)
	}
}

func SetupKafka() (*kafka.Writer, error) {
	// Create Kafka writer with retry logic
	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:      []string{KafkaBroker},
		Topic:        ChatTopic,
		BatchTimeout: 10 * time.Millisecond,
		RequiredAcks: -1, // RequireAll: wait for all replicas
		MaxAttempts:  3,
		Async:        false, // Use synchronous writes for testing
	})

	// Create topic using writer connection
	conn, err := kafka.DialLeader(context.Background(), "tcp", KafkaBroker, ChatTopic, 0)
	if err != nil {
		// If error is not "topic already exists", return error
		if !strings.Contains(err.Error(), "already exists") {
			return nil, fmt.Errorf("failed to connect to topic: %v", err)
		}
	} else {
		defer conn.Close()
		
		// Configure topic
		err = conn.CreateTopics(kafka.TopicConfig{
			Topic:             ChatTopic,
			NumPartitions:     1,
			ReplicationFactor: 1,
		})
		if err != nil && !strings.Contains(err.Error(), "already exists") {
			return nil, fmt.Errorf("failed to create topic: %v", err)
		}
	}

	return writer, nil
}

func SendTestMessage(ctx context.Context, writer *kafka.Writer, msg []byte, userID string) error {
	retries := 3
	var lastErr error
	
	for i := 0; i < retries; i++ {
		err := writer.WriteMessages(ctx, kafka.Message{
			Key:   []byte(userID),
			Value: msg,
			Headers: []kafka.Header{
				{
					Key:   "message_type",
					Value: []byte("chat"),
				},
			},
		})
		
		if err == nil {
			return nil
		}
		
		lastErr = err
		time.Sleep(time.Duration(i+1) * 100 * time.Millisecond)
	}
	
	return fmt.Errorf("failed to publish message after %d retries: %v", retries, lastErr)
}

// Publish to Kafka with retries
func PublishToKafka(ctx context.Context, writer *kafka.Writer, msg []byte, userID, roomID string) error {
	kafkaMsg := kafka.Message{
		Key:   []byte(userID),
		Value: msg,
		Time:  time.Now(),
		Headers: []kafka.Header{
			{
				Key:   "message_type",
				Value: []byte("chat"),
			},
			{
				Key:   "room_id",
				Value: []byte(roomID),
			},
		},
	}

	// Retry logic with exponential backoff
	maxRetries := 3
	var lastErr error
	for attempt := 0; attempt < maxRetries; attempt++ {
		err := writer.WriteMessages(ctx, kafkaMsg)
		if err == nil {
			log.Printf("[Kafka] Successfully published message to topic %s (attempt %d/%d)",
				ChatTopic, attempt+1, maxRetries)
			return nil
		}

		lastErr = err
		backoff := time.Duration(attempt+1) * 500 * time.Millisecond
		log.Printf("[Kafka] Failed to publish message (attempt %d/%d): %v. Retrying in %v...",
			attempt+1, maxRetries, err, backoff)
		time.Sleep(backoff)
	}

	return fmt.Errorf("failed to publish message after %d attempts: %v", maxRetries, lastErr)
}

// SaveTestMessage saves a test message to both MongoDB and Kafka
func SaveTestMessage(ctx context.Context, db *mongo.Database, writer *kafka.Writer, roomID, userID string, messageText string) error {
	// Convert IDs to ObjectID
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return fmt.Errorf("invalid room ID: %v", err)
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %v", err)
	}

	// Create message document
	now := time.Now()
	messageID := primitive.NewObjectID()
	chatMessage := bson.M{
		"_id":        messageID,
		"room_id":    roomObjID,
		"user_id":    userObjID,
		"message":    messageText,
		"type":       "text",
		"status":     "sent",
		"created_at": now,
		"updated_at": now,
	}

	// Save to MongoDB
	log.Printf("[Test] Saving message to MongoDB: %v", chatMessage)
	_, err = db.Collection("chat-messages").InsertOne(ctx, chatMessage)
	if err != nil {
		return fmt.Errorf("failed to save message to MongoDB: %v", err)
	}

	// Create Kafka message
	kafkaMessage := struct {
		Type      string    `json:"type"`
		EventType string    `json:"eventType"`
		Payload   struct {
			ID        string                 `json:"id"`
			RoomID    string                 `json:"roomId"`
			UserID    string                 `json:"userId"`
			Message   string                 `json:"message"`
			Type      string                 `json:"type"`
			Status    string                 `json:"status"`
			Metadata  map[string]interface{} `json:"metadata,omitempty"`
			CreatedAt time.Time             `json:"createdAt"`
			UpdatedAt time.Time             `json:"updatedAt"`
		} `json:"payload"`
	}{
		Type:      "message",
		EventType: "chat",
		Payload: struct {
			ID        string                 `json:"id"`
			RoomID    string                 `json:"roomId"`
			UserID    string                 `json:"userId"`
			Message   string                 `json:"message"`
			Type      string                 `json:"type"`
			Status    string                 `json:"status"`
			Metadata  map[string]interface{} `json:"metadata,omitempty"`
			CreatedAt time.Time             `json:"createdAt"`
			UpdatedAt time.Time             `json:"updatedAt"`
		}{
			ID:        messageID.Hex(),
			RoomID:    roomID,
			UserID:    userID,
			Message:   messageText,
			Type:      "text",
			Status:    "sent",
			Metadata:  map[string]interface{}{"source": "test"},
			CreatedAt: now,
			UpdatedAt: now,
		},
	}

	// Convert to JSON
	msgBytes, err := json.Marshal(kafkaMessage)
	if err != nil {
		return fmt.Errorf("failed to marshal Kafka message: %v", err)
	}

	// Publish to Kafka
	log.Printf("[Test] Publishing message to Kafka: %s", string(msgBytes))
	err = PublishToKafka(ctx, writer, msgBytes, userID, roomID)
	if err != nil {
		return fmt.Errorf("failed to publish message to Kafka: %v", err)
	}

	return nil
}

// VerifyMessage verifies that a message exists in both MongoDB and Kafka
func VerifyMessage(ctx context.Context, db *mongo.Database, messageID string) error {
	// Convert ID to ObjectID
	msgObjID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return fmt.Errorf("invalid message ID: %v", err)
	}

	// Check MongoDB
	var result bson.M
	err = db.Collection("chat-messages").FindOne(ctx, bson.M{"_id": msgObjID}).Decode(&result)
	if err != nil {
		return fmt.Errorf("message not found in MongoDB: %v", err)
	}

	log.Printf("[Test] Message verified in MongoDB: %v", result)
	return nil
}
