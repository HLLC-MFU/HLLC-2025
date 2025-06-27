package service

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	notifyService "chat/module/notification/service"
	userModel "chat/module/user/model"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	"chat/pkg/helpers/service"
	"context"
	"fmt"
	"log"

	"chat/pkg/config"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ChatService struct {
	*queries.BaseService[model.ChatMessage]
	cache       *utils.ChatCacheService
	hub         *utils.Hub
	fkValidator *service.ForeignKeyValidator
	collection  *mongo.Collection
	emitter     *utils.ChatEventEmitter
	kafkaBus    *kafka.Bus
	mongo       *mongo.Database
	redis       *redis.Client
	Config      *config.Config
	
	// NEW: Notification service for offline users
	notificationService *notifyService.NotificationService
}
	
func NewChatService(
	db *mongo.Database,
	redis *redis.Client,
	kafkaBus *kafka.Bus,
	cfg *config.Config,
) *ChatService {
	collection := db.Collection("chat_messages")
	
	if err := kafkaBus.Start(); err != nil {
		log.Printf("[ERROR] Failed to start Kafka bus: %v", err)
	}

	if err := kafka.CreateTopics([]string{
		kafka.RoomEventsTopic,
		kafka.ChatEventsTopic,
	}); err != nil {
		log.Printf("[ERROR] Failed to create default topics: %v", err)
	}
	
	hub := utils.NewHub()

	emitter := utils.NewChatEventEmitter(hub, kafkaBus, redis, db)

	service := &ChatService{
		BaseService:  queries.NewBaseService[model.ChatMessage](collection),
		cache:       utils.NewChatCacheService(redis),
		hub:         hub,
		fkValidator: service.NewForeignKeyValidator(db),
		collection:  collection,
		emitter:     emitter,
		kafkaBus:    kafkaBus,
		mongo:       db,
		redis:       redis,
		Config:      cfg,
	}

	// Initialize notification service with configuration
	notificationConfig := notifyService.NotificationConfig{
		ExternalTopic: "chat-notifications",  // Configure your external notification topic
		Enabled:       true,                  // Enable/disable notifications
		Templates:     nil,                   // Use default templates
	}
	
	// Create a simple room service interface implementation
	roomServiceAdapter := &roomServiceAdapter{db: db}
	
	service.notificationService = notifyService.NewNotificationService(
		db,
		redis, 
		kafkaBus,
		roomServiceAdapter,
		notificationConfig,
		hub, // Pass the hub for online status checking
	)

	return service
}

// Simple adapter to make room service compatible with notification service
type roomServiceAdapter struct {
	db *mongo.Database
}

func (r *roomServiceAdapter) IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return false, err
	}

	roomCollection := r.db.Collection("rooms")
	count, err := roomCollection.CountDocuments(ctx, bson.M{
		"_id":     roomID,
		"members": userObjID,
	})
	
	return count > 0, err
}

func (s *ChatService) GetHub() *utils.Hub {
	return s.hub
}

func (s *ChatService) GetUserById(ctx context.Context, userID string) (*userModel.User, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	userService := queries.NewBaseService[userModel.User](s.mongo.Collection("users"))
	result, err := userService.FindOneWithPopulate(ctx, bson.M{"_id": userObjID}, "role", "roles")
	if err != nil {
		return nil, err
	}

	if len(result.Data) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	return &result.Data[0], nil
}

func (s *ChatService) GetMessageReactions(ctx context.Context, roomID, messageID string) ([]model.MessageReaction, error) {
	return s.getMessageReactionsWithUsers(ctx, roomID, messageID)
}

// GetNotificationService returns the notification service instance
func (s *ChatService) GetNotificationService() *notifyService.NotificationService {
	return s.notificationService
}

// Helper method to notify offline users for different events
func (s *ChatService) NotifyOfflineUsers(ctx context.Context, roomID string, fromUserID string, eventType string, message string, excludeUserIDs ...string) {
	if s.notificationService == nil {
		log.Printf("[ChatService] Notification service not available")
		return
	}

	// Get room members
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		log.Printf("[ChatService] Invalid room ID for notifications: %v", err)
		return
	}

	// Get room to find members
	roomCollection := s.mongo.Collection("rooms")
	var room struct {
		Members []primitive.ObjectID `bson:"members"`
	}
	
	err = roomCollection.FindOne(ctx, bson.M{"_id": roomObjID}).Decode(&room)
	if err != nil {
		log.Printf("[ChatService] Failed to get room members for notifications: %v", err)
		return
	}

	// Create exclude map for faster lookup
	excludeMap := make(map[string]bool)
	for _, userID := range excludeUserIDs {
		excludeMap[userID] = true
	}
	excludeMap[fromUserID] = true // Don't notify the sender

	// Notify each member (except excluded ones)
	for _, memberID := range room.Members {
		memberIDStr := memberID.Hex()
		if excludeMap[memberIDStr] {
			continue
		}

		// Check if user is currently online (has active WebSocket connection)
		isOnline := s.hub.IsUserOnlineInRoom(roomID, memberIDStr)
		if isOnline {
			log.Printf("[ChatService] User %s is online, skipping offline notification", memberIDStr)
			continue
		}

		// Send offline notification
		req := notifyService.NotificationRequest{
			UserID:     memberIDStr,
			RoomID:     roomID,
			FromUserID: fromUserID,
			EventType:  eventType,
			Message:    message,
			Data: map[string]interface{}{
				"room_id": roomID,
				"sender":  fromUserID,
			},
		}

		if err := s.notificationService.NotifyOfflineUser(ctx, req); err != nil {
			log.Printf("[ChatService] Failed to notify offline user %s: %v", memberIDStr, err)
		}
	}
}