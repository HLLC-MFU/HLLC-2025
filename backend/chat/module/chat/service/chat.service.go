package service

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	userModel "chat/module/user/model"
	"chat/pkg/config"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	serviceHelper "chat/pkg/helpers/service"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	kafka_go "github.com/segmentio/kafka-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ChatService struct {
	*queries.BaseService[model.ChatMessage]
	cache       *utils.ChatCacheService
	hub         *utils.Hub
	fkValidator *serviceHelper.ForeignKeyValidator
	collection  *mongo.Collection
	emitter     *utils.ChatEventEmitter
	kafkaBus    *kafka.Bus
	mongo       *mongo.Database
	redis       *redis.Client
	Config      *config.Config
	notificationService *NotificationService
	historyService      *HistoryService
	moderationService   *ModerationService
}
	
func NewChatService(
	db *mongo.Database,
	redis *redis.Client,
	kafkaBus *kafka.Bus,
	cfg *config.Config,
) *ChatService {
	collection := db.Collection("chat-messages")
	
	if err := kafkaBus.Start(); err != nil {
		log.Printf("[ERROR] Failed to start Kafka bus: %v", err)
	}

	// Create notification topic only
	if err := kafkaBus.CreateTopics([]string{
		"chat-notifications", // Notification topic for offline users
	}); err != nil {
		log.Printf("[ERROR] Failed to create Kafka topics: %v", err)
	} else {
		log.Printf("[INFO] Successfully created chat-notifications topic")
	}

	// Verify that notification topic exists
	go func() {
		time.Sleep(2 * time.Second) // Wait a bit for topic creation
		verifyNotificationTopic(cfg.Kafka.Brokers[0])
	}()

	// **NEW: Start debug consumer for notifications**
	go startNotificationDebugConsumer(cfg.Kafka.Brokers)
	
	hub := utils.NewHub()
	emitter := utils.NewChatEventEmitter(hub, kafkaBus, redis, db)

	chatService := &ChatService{
		BaseService:  queries.NewBaseService[model.ChatMessage](collection),
		cache:       utils.NewChatCacheService(redis),
		hub:         hub,
		fkValidator: serviceHelper.NewForeignKeyValidator(db),
		collection:  collection,
		emitter:     emitter,
		kafkaBus:    kafkaBus,
		mongo:       db,
		redis:       redis,
		Config:      cfg,
		notificationService: NewNotificationService(db, kafkaBus),
		historyService:      NewHistoryService(db, utils.NewChatCacheService(redis)),
	}

	// สร้าง ModerationService หลังจาก ChatService เสร็จแล้ว (เพื่อหลีกเลี่ยง circular dependency)
	chatService.moderationService = NewModerationService(db, chatService)
	
	return chatService
}

// Helper function to verify notification topic exists
func verifyNotificationTopic(broker string) {
	conn, err := kafka_go.Dial("tcp", broker)
	if err != nil {
		log.Printf("[DEBUG] Failed to connect to broker for verification: %v", err)
		return
	}
	defer conn.Close()

	partitions, err := conn.ReadPartitions("chat-notifications")
	if err != nil {
		log.Printf("[DEBUG] Failed to read chat-notifications partitions: %v", err)
	} else {
		log.Printf("[DEBUG] chat-notifications topic verified with %d partitions", len(partitions))
	}
}

// **NEW: Debug consumer to monitor notifications**
func startNotificationDebugConsumer(brokers []string) {
	log.Printf("[DEBUG] Starting notification debug consumer...")
	
	// Wait a bit for topic to be ready
	time.Sleep(3 * time.Second)
	
	reader := kafka_go.NewReader(kafka_go.ReaderConfig{
		Brokers:     brokers,
		Topic:       "chat-notifications",
		GroupID:     "debug-consumer-group",
		StartOffset: kafka_go.LastOffset, // Read from latest messages
	})
	defer reader.Close()

	log.Printf("[DEBUG] Notification debug consumer started - listening for messages...")

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("[DEBUG] Error reading notification message: %v", err)
			time.Sleep(time.Second)
			continue
		}

		log.Printf("[DEBUG] ========== NOTIFICATION RECEIVED ==========")
		log.Printf("[DEBUG] Topic: %s", msg.Topic)
		log.Printf("[DEBUG] Key: %s", string(msg.Key))
		log.Printf("[DEBUG] Partition: %d, Offset: %d", msg.Partition, msg.Offset)
		log.Printf("[DEBUG] Timestamp: %s", msg.Time.Format("2006-01-02 15:04:05"))
		
		// Pretty print the JSON payload
		var payload map[string]interface{}
		if err := json.Unmarshal(msg.Value, &payload); err == nil {
			prettyJSON, _ := json.MarshalIndent(payload, "", "  ")
			log.Printf("[DEBUG] Payload:\n%s", string(prettyJSON))
		} else {
			log.Printf("[DEBUG] Raw Payload: %s", string(msg.Value))
		}
		log.Printf("[DEBUG] ============================================")
	}
}

func (s *ChatService) GetHub() *utils.Hub {
	return s.hub
}

func (s *ChatService) GetUserById(ctx context.Context, userID string) (*userModel.User, error) {
	log.Printf("[DEBUG] GetUserById called for user: %s", userID)
	
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("[ERROR] Invalid user ID format: %s, error: %v", userID, err)
		return nil, err
	}

	// **USE SIMPLE QUERY WITHOUT POPULATE TO AVOID ROLE DECODING ISSUES**
	userService := queries.NewBaseService[userModel.User](s.mongo.Collection("users"))
	result, err := userService.FindOne(ctx, bson.M{"_id": userObjID})
	if err != nil {
		log.Printf("[ERROR] Failed to query user %s: %v", userID, err)
		return nil, err
	}

	if len(result.Data) == 0 {
		log.Printf("[ERROR] User %s not found", userID)
		return nil, fmt.Errorf("user not found")
	}

	user := result.Data[0]
	log.Printf("[DEBUG] Successfully retrieved user: %s (%s %s)", user.Username, user.Name.First, user.Name.Last)
	return &user, nil
}

func (s *ChatService) GetMessageReactions(ctx context.Context, roomID, messageID string) ([]model.MessageReaction, error) {
	return s.historyService.getMessageReactionsWithUsers(ctx, roomID, messageID)
}

// GetNotificationService returns the notification service for admin operations
func (s *ChatService) GetNotificationService() *NotificationService {
	return s.notificationService
}

// GetModerationService returns the moderation service for admin operations
func (s *ChatService) GetModerationService() *ModerationService {
	return s.moderationService
}

// GetChatHistoryByRoom delegates to HistoryService
func (s *ChatService) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error) {
	return s.historyService.GetChatHistoryByRoom(ctx, roomID, limit)
}

// DeleteRoomMessages delegates to HistoryService
func (s *ChatService) DeleteRoomMessages(ctx context.Context, roomID string) error {
	return s.historyService.DeleteRoomMessages(ctx, roomID)
}