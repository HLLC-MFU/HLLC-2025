package service

import (
	"bytes"
	"chat/module/chat/model"
	chatUtils "chat/module/chat/utils"
	"chat/module/notification/service"
	restrctionService "chat/module/restriction/service"
	userModel "chat/module/user/model"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	serviceHelper "chat/pkg/helpers/service"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
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

	// Send notifications to offline users only (NotifyUsersInRoom handles this)
	if s.notificationService != nil {
		s.notificationService.NotifyUsersInRoom(ctx, msg, onlineUsers)
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

// ClaimEvoucher claims an evoucher message for a user
func (s *EvoucherService) ClaimEvoucher(ctx context.Context, userID, messageID primitive.ObjectID) (*model.ChatMessage, error) {
	log.Printf("[EvoucherService] ClaimEvoucher called for message %s by user %s", 
		messageID.Hex(), userID.Hex())

	// Get the message from database
	result, err := s.FindOneById(ctx, messageID.Hex())
	if err != nil {
		return nil, fmt.Errorf("message not found: %w", err)
	}

	if len(result.Data) == 0 {
		return nil, fmt.Errorf("message not found")
	}

	msg := result.Data[0]

	// Check if message has evoucher info
	if msg.EvoucherInfo == nil {
		return nil, fmt.Errorf("message does not contain evoucher information")
	}

	// Check if user already claimed this evoucher
	for _, claimedUserID := range msg.EvoucherInfo.ClaimedBy {
		if claimedUserID == userID {
			return nil, fmt.Errorf("you have already claimed this evoucher")
		}
	}

	// Add user to claimed list
	msg.EvoucherInfo.ClaimedBy = append(msg.EvoucherInfo.ClaimedBy, userID)

	// Update message in database
	updateResult, err := s.db.Collection("chat-messages").UpdateOne(ctx, 
		bson.M{"_id": messageID}, 
		bson.M{
			"$set": bson.M{
				"evoucher_info.claimed_by": msg.EvoucherInfo.ClaimedBy,
			},
		})
	if err != nil {
		return nil, fmt.Errorf("failed to update evoucher claim status: %w", err)
	}

	if updateResult.MatchedCount == 0 {
		return nil, fmt.Errorf("message not found")
	}

	log.Printf("[EvoucherService] Successfully claimed evoucher for user %s in message %s", 
		userID.Hex(), messageID.Hex())

	// Update cache
	if s.cache != nil {
		enriched := model.ChatMessageEnriched{
			ChatMessage: msg,
		}
		if err := s.cache.SaveMessage(ctx, msg.RoomID.Hex(), &enriched); err != nil {
			log.Printf("[EvoucherService] Failed to update cache after claim: %v", err)
		}
	}

	// Emit claim event to WebSocket and Kafka
	if s.emitter != nil {
		if err := s.emitter.EmitEvoucherClaimed(ctx, &msg, userID); err != nil {
			log.Printf("[EvoucherService] Failed to emit evoucher claimed event: %v", err)
		} else {
			log.Printf("[EvoucherService] Successfully emitted evoucher claimed event for message %s", messageID.Hex())
		}
	}

	return &msg, nil
}

// CheckIfUserClaimedEvoucher checks if a user has already claimed a specific evoucher
func (s *EvoucherService) CheckIfUserClaimedEvoucher(ctx context.Context, userID, evoucherId string) (bool, error) {
	log.Printf("[EvoucherService] Checking if user %s has claimed evoucher %s", userID, evoucherId)

	// Convert userID to ObjectID
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return false, fmt.Errorf("invalid user ID: %w", err)
	}

	// Check in evoucher-claims collection
	var claimRecord struct {
		ID         primitive.ObjectID `bson:"_id"`
		UserID     primitive.ObjectID `bson:"user_id"`
		EvoucherID string             `bson:"evoucher_id"`
		ClaimedAt  time.Time          `bson:"claimed_at"`
	}

	err = s.db.Collection("evoucher-claims").FindOne(ctx, bson.M{
		"user_id":     userObjID,
		"evoucher_id": evoucherId,
	}).Decode(&claimRecord)

	if err == mongo.ErrNoDocuments {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("failed to check evoucher claim: %w", err)
	}

	return true, nil
}

// ClaimEvoucherThroughNestJS claims an evoucher through the NestJS API
func (s *EvoucherService) ClaimEvoucherThroughNestJS(ctx context.Context, userID, evoucherId, claimURL, jwtToken string) (map[string]interface{}, error) {
	log.Printf("[EvoucherService] Claiming evoucher %s for user %s through NestJS API", evoucherId, userID)

	// Create request body with userID
	requestBody := map[string]interface{}{
		"user": userID,
	}
	
	// Marshal request body to JSON
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Make HTTP request to NestJS API
	client := &http.Client{Timeout: 10 * time.Second}
	
	req, err := http.NewRequestWithContext(ctx, "POST", claimURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+jwtToken)

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request to NestJS: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Parse response
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Check if request was successful
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("NestJS API error: %s - %s", resp.Status, string(body))
	}

	log.Printf("[EvoucherService] Successfully claimed evoucher %s through NestJS API", evoucherId)
	return result, nil
}

// StoreEvoucherClaim stores a claim record in the Go database
func (s *EvoucherService) StoreEvoucherClaim(ctx context.Context, userID, evoucherId string) error {
	log.Printf("[EvoucherService] Storing evoucher claim for user %s, evoucher %s", userID, evoucherId)

	// Convert userID to ObjectID
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// Create claim record
	claimRecord := bson.M{
		"user_id":     userObjID,
		"evoucher_id": evoucherId,
		"claimed_at":  time.Now(),
	}

	// Insert into evoucher-claims collection
	_, err = s.db.Collection("evoucher-claims").InsertOne(ctx, claimRecord)
	if err != nil {
		return fmt.Errorf("failed to store evoucher claim: %w", err)
	}

	log.Printf("[EvoucherService] Successfully stored evoucher claim for user %s, evoucher %s", userID, evoucherId)
	return nil
}