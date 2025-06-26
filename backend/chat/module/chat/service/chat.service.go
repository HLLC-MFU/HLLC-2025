package service

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
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