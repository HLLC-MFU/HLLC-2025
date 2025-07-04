package service

import (
	"chat/module/chat/model"
	chatUtils "chat/module/chat/utils"
	"chat/module/notification/service"
	restrctionService "chat/module/restriction/service"
	userModel "chat/module/user/model"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	serviceHelper "chat/pkg/helpers/service"
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type (
	EvoucherService struct {
		*queries.BaseService[model.ChatMessage]
		restrictionService   *restrctionService.RestrictionService
		fkValidator         *serviceHelper.ForeignKeyValidator
		cache               *chatUtils.ChatCacheService
		emitter             *chatUtils.ChatEventEmitter
		hub                 *chatUtils.Hub
		notificationService *service.NotificationService
		db                  *mongo.Database
	}
)

func NewEvoucherService(
	db *mongo.Database,
	redis *redis.Client,
	restrictionService *restrctionService.RestrictionService,
	notificationService *service.NotificationService,
	hub *chatUtils.Hub,
	kafkaBus *kafka.Bus,
) *EvoucherService {
	collection := db.Collection("chat-messages")
	fkValidator := serviceHelper.NewForeignKeyValidator(db)
	cache := chatUtils.NewChatCacheService(redis)
	
	// Initialize emitter with all required dependencies
	emitter := chatUtils.NewChatEventEmitter(hub, kafkaBus, redis, db)
	
	return &EvoucherService{
		BaseService:         queries.NewBaseService[model.ChatMessage](collection),
		restrictionService:   restrictionService,
		fkValidator:         fkValidator,
		cache:               cache,
		emitter:             emitter,
		hub:                 hub,
		notificationService: notificationService,
		db:                  db,
	}
}

// SendEvoucherMessage sends an evoucher message to a room
func (s *EvoucherService) SendEvoucherMessage(ctx context.Context, userID, roomID primitive.ObjectID, evoucherInfo *model.EvoucherInfo) (*model.ChatMessage, error) {
	log.Printf("[EvoucherService] SendEvoucherMessage called for room %s by user %s", 
		roomID.Hex(), userID.Hex())

	// Validate foreign keys
	if err := s.fkValidator.ValidateForeignKeys(ctx, map[string]interface{}{
		"users": userID,
		"rooms": roomID,
	}); err != nil {
		return nil, fmt.Errorf("foreign key validation failed: %w", err)
	}

	// Create evoucher message with display text
	displayMessage := fmt.Sprintf("🎟️ %s\n💰 %s\n📝 %s", 
		evoucherInfo.Title, 
		evoucherInfo.Description,
		evoucherInfo.ClaimURL)

	msg := &model.ChatMessage{
		RoomID:       roomID,
		UserID:       userID,
		Message:      displayMessage,
		EvoucherInfo: evoucherInfo,
		Timestamp:    time.Now(),
	}

	// Create message in database
	result, err := s.Create(ctx, *msg)
	if err != nil {
		return nil, fmt.Errorf("failed to save evoucher message: %w", err)
	}
	msg.ID = result.Data[0].ID

	log.Printf("[EvoucherService] Evoucher message saved to database with ID: %s", msg.ID.Hex())
	
	// Cache the message
	enriched := model.ChatMessageEnriched{
		ChatMessage: *msg,
	}
	if s.cache != nil {
		if err := s.cache.SaveMessage(ctx, roomID.Hex(), &enriched); err != nil {
			log.Printf("[EvoucherService] Failed to cache evoucher message: %v", err)
		}
	}

	// Emit evoucher message to WebSocket and Kafka
	if s.emitter != nil {
		if err := s.emitter.EmitEvoucherMessage(ctx, msg); err != nil {
			log.Printf("[EvoucherService] Failed to emit evoucher message: %v", err)
		} else {
			log.Printf("[EvoucherService] Successfully emitted evoucher message ID=%s", msg.ID.Hex())
		}
	}

	// Get all room members for notification
	roomCollection := s.db.Collection("rooms")
	var room struct {
		Members []primitive.ObjectID `bson:"members"`
	}
	if err := roomCollection.FindOne(ctx, bson.M{"_id": roomID}).Decode(&room); err != nil {
		log.Printf("[EvoucherService] Failed to get room members: %v", err)
		return msg, nil
	}

	// Get online users
	onlineUsers := s.hub.GetOnlineUsersInRoom(msg.RoomID.Hex())
	onlineUsersMap := make(map[string]bool)
	for _, userID := range onlineUsers {
		onlineUsersMap[userID] = true
	}

	// Send notifications to online users
	if s.notificationService != nil {
		s.notificationService.NotifyUsersInRoom(ctx, msg, onlineUsers)
	}

	// Send notifications to offline users
	if s.notificationService != nil {
		for _, memberID := range room.Members {
			memberIDStr := memberID.Hex()
			
			// Skip sender and online users
			if memberIDStr == userID.Hex() || onlineUsersMap[memberIDStr] {
				continue
			}

			// Send offline notification
			log.Printf("[EvoucherService] Sending offline notification to user %s", memberIDStr)
			s.notificationService.SendOfflineNotification(ctx, memberIDStr, msg, "evoucher")
		}
	}

	return msg, nil
}

// GetUserById ดึงข้อมูล user (delegate to user service)
func (s *EvoucherService) GetUserById(ctx context.Context, userID string) (*userModel.User, error) {
	// This should delegate to user service
	// For now, return a basic implementation
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	var user userModel.User
	err = s.db.Collection("users").FindOne(ctx, primitive.M{"_id": userObjID}).Decode(&user)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return &user, nil
}