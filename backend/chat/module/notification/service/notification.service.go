package service

import (
	hub "chat/module/chat/utils"
	model "chat/module/notification/model"
	"chat/module/notification/util"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const (
	NotificationsTopic    = "chat-notifications"
	DeduplicationTTL      = 5 * time.Minute
	MaxRetryAttempts      = 3
	RetryBackoffBase      = 2 * time.Second
	NotificationExpiry    = 7 * 24 * time.Hour // 7 days
)

type (
	NotificationService struct {
		*queries.BaseService[model.ChatNotification]
		kafkaBus       *kafka.Bus
		redis          *redis.Client
		mongo          *mongo.Database
		roomService    RoomServiceInterface
		helper         *util.NotificationHelper
		
		// Deduplication cache
		notified       map[string]time.Time
		notifiedMu     sync.RWMutex
		
		// Notification templates
		templates      map[string]model.NotificationTemplate
		
		// External service config
		externalTopic  string
		enabled        bool
	}

	RoomServiceInterface interface {
		IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
	}

	NotificationConfig struct {
		ExternalTopic string
		Enabled       bool
		Templates     map[string]model.NotificationTemplate
	}

	// Import the NotificationRequest from helper to maintain compatibility
	NotificationRequest = util.NotificationRequest
)

func NewNotificationService(
	db *mongo.Database,
	redis *redis.Client,
	kafkaBus *kafka.Bus,
	roomService RoomServiceInterface,
	config NotificationConfig,
	hub *hub.Hub,
) *NotificationService {
	collection := db.Collection("chat_notifications")
	
	// Create indexes for efficient queries
	if err := createNotificationIndexes(context.Background(), collection); err != nil {
		log.Printf("[NotificationService] Failed to create indexes: %v", err)
	}

	// Initialize default templates if not provided
	if config.Templates == nil {
		config.Templates = getDefaultNotificationTemplates()
	}

	service := &NotificationService{
		BaseService:   queries.NewBaseService[model.ChatNotification](collection),
		kafkaBus:      kafkaBus,
		redis:         redis,
		mongo:         db,
		roomService:   roomService,
		helper:        util.NewNotificationHelper(db, hub),
		notified:      make(map[string]time.Time),
		templates:     config.Templates,
		externalTopic: config.ExternalTopic,
		enabled:       config.Enabled,
	}

	// Start cleanup routine for deduplication cache
	go service.startCleanupRoutine()

	// Start retry processor
	go service.startRetryProcessor()

	return service
}

// NotifyOfflineUser creates and sends a notification for an offline user
func (s *NotificationService) NotifyOfflineUser(ctx context.Context, req NotificationRequest) error {
	if !s.enabled {
		log.Printf("[NotificationService] Service disabled, skipping notification")
		return nil
	}

	// Validate request using helper
	if err := s.helper.ValidateNotificationRequest(req); err != nil {
		return fmt.Errorf("invalid notification request: %w", err)
	}

	// Generate deduplication key
	deduplicationKey := s.helper.GenerateDeduplicationKey(
		req.UserID,
		req.RoomID,
		req.MessageID,
		req.EventType,
	)

	// Check for duplicate notifications
	if s.isDuplicate(deduplicationKey) {
		log.Printf("[NotificationService] Duplicate notification for %s, skipping", deduplicationKey)
		return nil
	}

	// Validate room membership if room-based notification
	if req.RoomID != "" {
		if valid, err := s.helper.ValidateRoomMembership(ctx, req.RoomID, req.UserID); err != nil || !valid {
			if err != nil {
				log.Printf("[NotificationService] Failed to validate room membership: %v", err)
			} else {
				log.Printf("[NotificationService] User %s is not a member of room %s, skipping", req.UserID, req.RoomID)
			}
			return fmt.Errorf("invalid room membership")
		}
	}

	// Check if user is offline using helper
	if req.RoomID != "" && !s.helper.IsUserOfflineInRoom(req.RoomID, req.UserID) {
		log.Printf("[NotificationService] User %s is online in room %s, skipping offline notification", req.UserID, req.RoomID)
		return nil
	}

	// Create notification record
	notification, err := s.createNotification(ctx, req, deduplicationKey)
	if err != nil {
		return fmt.Errorf("failed to create notification: %w", err)
	}

	// Send notification
	if err := s.sendNotification(ctx, notification); err != nil {
		// Update notification status to failed
		s.updateNotificationStatus(ctx, notification.ID, model.NotificationStatusFailed, err.Error())
		return fmt.Errorf("failed to send notification: %w", err)
	}

	// Mark as sent
	s.updateNotificationStatus(ctx, notification.ID, model.NotificationStatusSent, "")
	
	// Update deduplication cache
	s.markAsSent(deduplicationKey)

	// Log notification event using helper
	s.helper.LogNotificationEvent("notification_sent", req.UserID, map[string]interface{}{
		"event_type": req.EventType,
		"room_id":    req.RoomID,
		"message_id": req.MessageID,
	})

	return nil
}

// Batch notification methods
func (s *NotificationService) NotifyBatch(ctx context.Context, batchReq util.BatchNotificationRequest) error {
	// Use helper to prepare individual notifications
	requests := s.helper.PrepareBatchNotifications(ctx, batchReq)
	
	var processed, skipped int
	for _, req := range requests {
		if err := s.NotifyOfflineUser(ctx, req); err != nil {
			log.Printf("[NotificationService] Failed to send notification to user %s: %v", req.UserID, err)
			skipped++
		} else {
			processed++
		}
	}

	// Log batch results using helper
	s.helper.LogBatchNotification(batchReq.EventType, len(batchReq.UserIDs), processed, skipped)
	
	return nil
}

// Quick notification methods for common use cases
func (s *NotificationService) NotifyMention(ctx context.Context, userID, roomID, messageID, fromUserID, message string) error {
	return s.NotifyOfflineUser(ctx, NotificationRequest{
		UserID:     userID,
		RoomID:     roomID,
		MessageID:  messageID,
		FromUserID: fromUserID,
		EventType:  model.NotificationTypeMention,
		Message:    message,
		Priority:   s.helper.GetNotificationPriority(model.NotificationTypeMention),
	})
}

func (s *NotificationService) NotifyReply(ctx context.Context, userID, roomID, messageID, fromUserID, message string) error {
	return s.NotifyOfflineUser(ctx, NotificationRequest{
		UserID:     userID,
		RoomID:     roomID,
		MessageID:  messageID,
		FromUserID: fromUserID,
		EventType:  model.NotificationTypeReplyMessage,
		Message:    message,
		Priority:   s.helper.GetNotificationPriority(model.NotificationTypeReplyMessage),
	})
}

func (s *NotificationService) NotifyReaction(ctx context.Context, userID, roomID, messageID, fromUserID, reaction string) error {
	additionalData := map[string]interface{}{
		"reaction": reaction,
	}
	
	return s.NotifyOfflineUser(ctx, NotificationRequest{
		UserID:     userID,
		RoomID:     roomID,
		MessageID:  messageID,
		FromUserID: fromUserID,
		EventType:  model.NotificationTypeReaction,
		Message:    s.helper.FormatNotificationMessage(model.NotificationTypeReaction, "", additionalData),
		Priority:   s.helper.GetNotificationPriority(model.NotificationTypeReaction),
		Data:       additionalData,
	})
}

// Helper methods
func (s *NotificationService) isDuplicate(key string) bool {
	s.notifiedMu.RLock()
	defer s.notifiedMu.RUnlock()
	
	if t, exists := s.notified[key]; exists && time.Since(t) < DeduplicationTTL {
		return true
	}
	return false
}

func (s *NotificationService) markAsSent(key string) {
	s.notifiedMu.Lock()
	defer s.notifiedMu.Unlock()
	s.notified[key] = time.Now()
}

// validateRoomMembership is now handled by helper.ValidateRoomMembership

func (s *NotificationService) createNotification(ctx context.Context, req NotificationRequest, deduplicationKey string) (*model.ChatNotification, error) {
	// Get or apply template
	template := s.getTemplate(req.EventType)
	
	// Parse object IDs
	userObjID, err := primitive.ObjectIDFromHex(req.UserID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// Use helper for title and message formatting
	title := req.Title
	if title == "" {
		if userInfo, err := s.helper.GetUserInfo(ctx, req.FromUserID); err == nil {
			title = s.helper.FormatNotificationTitle(req.EventType, userInfo.GetDisplayName())
		} else {
			title = template.Title
		}
	}

	message := req.Message
	if message == "" {
		enhancedData := s.helper.EnhanceNotificationData(ctx, req.Data)
		message = s.helper.FormatNotificationMessage(req.EventType, req.Message, enhancedData)
	}

	priority := req.Priority
	if priority == "" {
		priority = s.helper.GetNotificationPriority(req.EventType)
	}

	expiresAt := req.ExpiresAt
	if expiresAt == nil {
		ttl := s.helper.GetNotificationTTL(req.EventType)
		expiry := time.Now().Add(ttl)
		expiresAt = &expiry
	}

	notification := &model.ChatNotification{
		UserID:           userObjID,
		Type:             req.EventType,
		Title:            title,
		Message:          message,
		Priority:         priority,
		Status:           model.NotificationStatusPending,
		Data:             s.helper.EnhanceNotificationData(ctx, req.Data),
		DeduplicationKey: deduplicationKey,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		ExpiresAt:        expiresAt,
	}

	// Set optional object IDs
	if req.RoomID != "" {
		roomObjID, err := primitive.ObjectIDFromHex(req.RoomID)
		if err == nil {
			notification.RoomID = &roomObjID
		}
	}

	if req.MessageID != "" {
		messageObjID, err := primitive.ObjectIDFromHex(req.MessageID)
		if err == nil {
			notification.MessageID = &messageObjID
		}
	}

	if req.FromUserID != "" {
		fromUserObjID, err := primitive.ObjectIDFromHex(req.FromUserID)
		if err == nil {
			notification.FromUserID = &fromUserObjID
		}
	}

	// Save to database
	result, err := s.Create(ctx, *notification)
	if err != nil {
		return nil, err
	}

	created := &result.Data[0]
	return created, nil
}

func (s *NotificationService) sendNotification(ctx context.Context, notification *model.ChatNotification) error {
	// Create notification event
	event := model.NotificationEvent{
		Type:      "notification",
		Payload:   notification.ToExtendedPayload(),
		Timestamp: time.Now(),
		Metadata: map[string]string{
			"source":    "chat-service",
			"version":   "1.0",
			"priority":  notification.Priority,
		},
	}

	// Send to Kafka
	topic := s.externalTopic
	if topic == "" {
		topic = NotificationsTopic
	}

	eventData, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal notification event: %w", err)
	}

	if err := s.kafkaBus.Emit(ctx, topic, notification.UserID.Hex(), eventData); err != nil {
		return fmt.Errorf("failed to emit to Kafka: %w", err)
	}

	log.Printf("[NotificationService] Notification queued for user %s on topic %s", 
		notification.UserID.Hex(), topic)
	return nil
}

func (s *NotificationService) updateNotificationStatus(ctx context.Context, id primitive.ObjectID, status string, errorMsg string) {
	update := bson.M{
		"$set": bson.M{
			"status":       status,
			"updated_at":   time.Now(),
		},
		"$inc": bson.M{
			"attempts": 1,
		},
	}

	if status == model.NotificationStatusFailed {
		update["$set"].(bson.M)["last_attempt"] = time.Now()
		if errorMsg != "" {
			update["$set"].(bson.M)["error"] = errorMsg
		}
		
		// Calculate next retry time
		nextRetry := time.Now().Add(RetryBackoffBase * time.Duration(1)) // Base retry
		update["$set"].(bson.M)["next_retry"] = nextRetry
	}

	collection := s.mongo.Collection("chat_notifications")
	_, err := collection.UpdateOne(ctx, bson.M{"_id": id}, update)
	if err != nil {
		log.Printf("[NotificationService] Failed to update notification status: %v", err)
	}
}

// Template and formatting helpers
func (s *NotificationService) getTemplate(eventType string) model.NotificationTemplate {
	if template, exists := s.templates[eventType]; exists {
		return template
	}
	return model.NotificationTemplate{
		Type:     eventType,
		Title:    "New Notification",
		Message:  "You have a new notification",
		Priority: model.NotificationPriorityNormal,
	}
}

// Template helper methods removed - now handled by NotificationHelper

// Background routines
func (s *NotificationService) startCleanupRoutine() {
	ticker := time.NewTicker(DeduplicationTTL)
	defer ticker.Stop()

	for range ticker.C {
		s.cleanupDeduplicationCache()
	}
}

func (s *NotificationService) cleanupDeduplicationCache() {
	s.notifiedMu.Lock()
	defer s.notifiedMu.Unlock()

	now := time.Now()
	for key, timestamp := range s.notified {
		if now.Sub(timestamp) > DeduplicationTTL {
			delete(s.notified, key)
		}
	}
}

func (s *NotificationService) startRetryProcessor() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.processRetries(context.Background())
	}
}

func (s *NotificationService) processRetries(ctx context.Context) {
	// Find failed notifications ready for retry
	filter := bson.M{
		"status": model.NotificationStatusFailed,
		"attempts": bson.M{"$lt": MaxRetryAttempts},
		"next_retry": bson.M{"$lte": time.Now()},
	}

	collection := s.mongo.Collection("chat_notifications")
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		log.Printf("[NotificationService] Failed to find retry notifications: %v", err)
		return
	}
	defer cursor.Close(ctx)

	var notifications []model.ChatNotification
	if err := cursor.All(ctx, &notifications); err != nil {
		log.Printf("[NotificationService] Failed to decode retry notifications: %v", err)
		return
	}

	for _, notification := range notifications {
		if err := s.sendNotification(ctx, &notification); err != nil {
			log.Printf("[NotificationService] Retry failed for notification %s: %v", 
				notification.ID.Hex(), err)
			s.updateNotificationStatus(ctx, notification.ID, model.NotificationStatusFailed, err.Error())
		} else {
			s.updateNotificationStatus(ctx, notification.ID, model.NotificationStatusSent, "")
		}
	}
}

// Helper functions
func createNotificationIndexes(ctx context.Context, collection *mongo.Collection) error {
	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "created_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "deduplication_key", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}, {Key: "next_retry", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "expires_at", Value: 1}},
		},
	}

	_, err := collection.Indexes().CreateMany(ctx, indexes)
	return err
}

func getDefaultNotificationTemplates() map[string]model.NotificationTemplate {
	ttl7Days := 7 * 24 * time.Hour
	ttl1Day := 24 * time.Hour
	
	return map[string]model.NotificationTemplate{
		model.NotificationTypeMention: {
			Type:     model.NotificationTypeMention,
			Title:    "You were mentioned",
			Message:  "Someone mentioned you in a chat",
			Priority: model.NotificationPriorityHigh,
			TTL:      &ttl7Days,
		},
		model.NotificationTypeReplyMessage: {
			Type:     model.NotificationTypeReplyMessage,
			Title:    "New Reply",
			Message:  "Someone replied to your message",
			Priority: model.NotificationPriorityNormal,
			TTL:      &ttl7Days,
		},
		model.NotificationTypeReaction: {
			Type:     model.NotificationTypeReaction,
			Title:    "New Reaction",
			Message:  "Someone reacted to your message",
			Priority: model.NotificationPriorityLow,
			TTL:      &ttl1Day,
		},
		model.NotificationTypeChatMessage: {
			Type:     model.NotificationTypeChatMessage,
			Title:    "New Message",
			Message:  "You have a new message",
			Priority: model.NotificationPriorityNormal,
			TTL:      &ttl7Days,
		},
	}
} 