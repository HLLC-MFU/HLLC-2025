package service

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	userModel "chat/module/user/model"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	"chat/pkg/helpers/service"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

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

	return &ChatService{
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

// Simple notification function - sends to external notification system
func (s *ChatService) NotifyOfflineUser(userID, roomID, senderID, message, eventType string) {
	log.Printf("[ChatService] NotifyOfflineUser called: user=%s, room=%s, sender=%s, type=%s", 
		userID, roomID, senderID, eventType)

	ctx := context.Background()

	// Get complete user info (sender)
	sender, err := s.GetUserById(ctx, senderID)
	if err != nil {
		log.Printf("[ChatService] Failed to get sender info: %v", err)
		return
	}

	// Get room info with populated data
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		log.Printf("[ChatService] Invalid room ID: %v", err)
		return
	}

	roomCollection := s.mongo.Collection("rooms")
	var room struct {
		ID    primitive.ObjectID `bson:"_id"`
		Name  map[string]string  `bson:"name"`
		Image string             `bson:"image"`
	}
	
	err = roomCollection.FindOne(ctx, bson.M{"_id": roomObjID}).Decode(&room)
	if err != nil {
		log.Printf("[ChatService] Failed to get room info: %v", err)
		return
	}

	// Create complete notification payload similar to message format
	notificationPayload := map[string]interface{}{
		"type": eventType,
		"payload": map[string]interface{}{
			"room": map[string]interface{}{
				"_id":   room.ID.Hex(),
				"name":  room.Name,
				"image": room.Image,
			},
			"user": map[string]interface{}{
				"_id":      sender.ID.Hex(),
				"username": sender.Username,
				"name": map[string]interface{}{
					"first":  sender.Name.First,
					"middle": sender.Name.Middle,
					"last":   sender.Name.Last,
				},
			},
			"message": map[string]interface{}{
				"message": message,
				"type":    eventType,
			},
			// Add receiver info for notification system
			"receiver": userID,
			"timestamp": time.Now(),
		},
	}

	// Send to external notification topic (to be consumed by NestJS backend)
	notificationTopic := "chat-notifications"
	payloadBytes, err := json.Marshal(notificationPayload)
	if err != nil {
		log.Printf("[ChatService] Failed to marshal notification payload: %v", err)
		return
	}

	// Emit to Kafka for external notification system
	if err := s.kafkaBus.Emit(context.Background(), notificationTopic, userID, payloadBytes); err != nil {
		log.Printf("[ChatService] Failed to send notification to Kafka: %v", err)
	} else {
		log.Printf("[ChatService] Successfully sent complete offline notification to topic %s", notificationTopic)
	}
}