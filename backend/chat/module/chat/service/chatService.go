package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"chat/module/chat/model"
	"chat/module/chat/types"
	"chat/pkg/common/enrichment"
	commonws "chat/pkg/common/websocket"
	"chat/pkg/core"
	"chat/pkg/database/queries"
	"chat/pkg/kafka"
	"chat/pkg/utils"

	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ChatService struct {
	*queries.BaseService[model.ChatMessage]
	cache         *utils.CacheManager
	publisher     kafka.Publisher
	hub           *commonws.Hub[model.ChatMessage]
	notifyService *NotificationService
	enricher      *enrichment.Enricher[model.ChatMessage, model.ChatMessageEnriched]
}

var (
	notifiedMu sync.Mutex
	notified   = make(map[string]time.Time) // key: userId:roomId:message
)

func NewChatService(db *mongo.Database, redis *core.RedisCache) *ChatService {
	s := &ChatService{
		BaseService: queries.NewBaseService[model.ChatMessage](db.Collection("chat_messages")),
		cache:       utils.NewCacheManager(redis, utils.CacheOptions{Prefix: "chat:room"}),
		publisher:   kafka.GetPublisher(),
		hub:         commonws.NewHub[model.ChatMessage](),
		notifyService: NewNotificationService(),
	}

	// Setup message enricher
	s.enricher = enrichment.NewEnricher[model.ChatMessage, model.ChatMessageEnriched](
		s.enrichMessage,    // Single message enrichment
		s.enrichMessages,   // Batch enrichment
		100,               // Batch size
	)

	// Setup WebSocket event handlers
	s.hub.OnConnect = s.handleConnect
	s.hub.OnDisconnect = s.handleDisconnect
	s.hub.OnMessage = s.handleMessage

	// Start WebSocket hub
	go s.hub.Run()

	// Start Kafka consumer
	go s.startConsumer()

	return s
}

func (s *ChatService) handleConnect(client *commonws.Client) {
	log.Printf("[WebSocket] Client connected: %s in room %s", client.ID, client.RoomID)
}

func (s *ChatService) handleDisconnect(client *commonws.Client) {
	log.Printf("[WebSocket] Client disconnected: %s from room %s", client.ID, client.RoomID)
}

func (s *ChatService) handleMessage(client *commonws.Client, msg *commonws.Message[model.ChatMessage]) {
	// Handle incoming WebSocket messages if needed
}

// SendMessage sends a new chat message and handles real-time delivery
func (s *ChatService) SendMessage(ctx context.Context, msg *model.ChatMessage) error {
	result, err := s.Create(ctx, *msg)
	if err != nil {
		return fmt.Errorf("failed to save message: %w", err)
	}
	msg = &result.Data[0]

	if err := s.cache.Set(ctx, msg.RoomID, msg); err != nil {
		log.Printf("[Cache] Failed to cache message: %v", err)
	}

	// Broadcast via WebSocket
	s.hub.Broadcast(&commonws.Message[model.ChatMessage]{
		Type:    "message",
		RoomID:  msg.RoomID,
		From:    msg.SenderID,
		Payload: *msg,
	})

	// Notify offline users
	for _, userID := range s.getOfflineUsers(msg.RoomID) {
		s.notifyService.NotifyOfflineUser(userID, msg.RoomID, msg.SenderID, msg.Content)
	}

	return nil
}

// GetMessages retrieves messages for a room with pagination and caching
func (s *ChatService) GetMessages(ctx context.Context, roomID string, page, limit int64) ([]model.ChatMessageEnriched, error) {
	if page == 1 {
		var messages []model.ChatMessageEnriched
		if err := s.cache.GetAll(ctx, roomID, &messages); err == nil && len(messages) > 0 {
			return messages, nil
		}
	}

	result, err := s.FindAll(ctx, queries.QueryOptions{
		Page:   int(page),
		Limit:  int(limit),
		Sort:   "-created_at",
		Filter: bson.M{"room_id": roomID, "is_deleted": false},
	})
	if err != nil {
		return nil, err
	}

	enriched, err := s.enricher.EnrichMany(ctx, result.Data)
	if err != nil {
		return nil, err
	}

	if page == 1 {
		items := make(map[string]interface{})
		for _, msg := range enriched {
			items[msg.ChatMessage.ID.Hex()] = msg
		}
		if err := s.cache.SetBatch(ctx, items); err != nil {
			log.Printf("[Cache] Failed to cache messages: %v", err)
		}
	}

	return enriched, nil
}

// EditMessage edits an existing message
func (s *ChatService) EditMessage(ctx context.Context, messageID primitive.ObjectID, newContent string) error {
	update := bson.M{
		"content":    newContent,
		"is_edited": true,
		"updated_at": time.Now(),
	}

	_, err := s.UpdateById(ctx, messageID.Hex(), update)
	return err
}

// DeleteMessage soft deletes a message
func (s *ChatService) DeleteMessage(ctx context.Context, messageID primitive.ObjectID) error {
	update := bson.M{
		"is_deleted": true,
		"updated_at": time.Now(),
	}

	_, err := s.UpdateById(ctx, messageID.Hex(), update)
	return err
}

// AddReaction adds a reaction to a message
func (s *ChatService) AddReaction(ctx context.Context, messageID primitive.ObjectID, userID string, reaction string) error {
	reactionDoc := model.MessageReaction{
		MessageID: messageID,
		UserID:    primitive.ObjectID{}, // Convert userID to ObjectID
		Reaction:  reaction,
		Timestamp: time.Now(),
	}

	// Use BaseService's UpdateById
	_, err := s.UpdateById(ctx, messageID.Hex(), bson.M{
		"$push": bson.M{"reactions": reactionDoc},
	})
	return err
}

// RemoveReaction removes a reaction from a message
func (s *ChatService) RemoveReaction(ctx context.Context, messageID primitive.ObjectID, userID string, reaction string) error {
	// Use BaseService's UpdateById
	_, err := s.UpdateById(ctx, messageID.Hex(), bson.M{
		"$pull": bson.M{"reactions": bson.M{
			"user_id":  userID,
			"reaction": reaction,
		}},
	})
	return err
}

// Helper methods

func (s *ChatService) notifyOfflineUser(userID, roomID, fromUserID, message string) {
	key := fmt.Sprintf("%s:%s:%s", userID, roomID, message)
	
	notifiedMu.Lock()
	if t, exists := notified[key]; exists && time.Since(t) < types.DeduplicationTTL {
		notifiedMu.Unlock()
		return
	}
	notified[key] = time.Now()
	notifiedMu.Unlock()

	notification := map[string]string{
		"user_id":     userID,
		"room_id":     roomID,
		"from_user":   fromUserID,
		"message":     message,
		"event_type": "message",
	}

	data, _ := json.Marshal(notification)
	if err := s.publisher.SendMessageToTopic("chat-notifications", userID, string(data)); err != nil {
		log.Printf("[Notification] Failed to send notification: %v", err)
	}
}

func (s *ChatService) sendJSON(conn *websocket.Conn, v interface{}) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return conn.WriteMessage(websocket.TextMessage, data)
}

func (s *ChatService) startConsumer() {
	consumer := kafka.NewConsumer(
		[]string{"localhost:9092"},
		[]string{"chat-messages"},
		"chat-service",
		s,
	)

	if err := consumer.Start(); err != nil {
		log.Printf("[Kafka] Failed to start consumer: %v", err)
	}
}

// HandleMessage implements the MessageHandler interface for Kafka consumer
func (s *ChatService) HandleMessage(ctx context.Context, msg *model.ChatMessage) error {
	// Save message to MongoDB
	if err := s.SaveMessage(ctx, msg); err != nil {
		return err
	}

	// Cache in Redis
	if err := s.cache.Set(ctx, msg.RoomID, msg); err != nil {
		log.Printf("[Cache] Failed to cache message: %v", err)
	}

	// Broadcast to WebSocket clients
	s.hub.Broadcast(&commonws.Message[model.ChatMessage]{
		Type:    "message",
		RoomID:  msg.RoomID,
		From:    msg.SenderID,
		Payload: *msg,
	})

	return nil
}

// SaveMessage saves a message to MongoDB
func (s *ChatService) SaveMessage(ctx context.Context, msg *model.ChatMessage) error {
	now := time.Now()
	if msg.CreatedAt.IsZero() {
		msg.CreatedAt = now
	}
	msg.UpdatedAt = now

	result, err := s.Create(ctx, *msg)
	if err != nil {
		return fmt.Errorf("failed to save message: %w", err)
	}
	
	*msg = result.Data[0]
	return nil
}

// Enrichment functions
func (s *ChatService) enrichMessage(ctx context.Context, msg model.ChatMessage) (model.ChatMessageEnriched, error) {
	enriched := model.ChatMessageEnriched{
		ChatMessage: msg,
		Reactions:   msg.Reactions,
	}

	if msg.ReplyTo != nil {
		replyMsg, err := s.FindOneById(ctx, msg.ReplyTo.Hex())
		if err == nil {
			enriched.ReplyTo = &replyMsg.Data[0]
		}
	}

	return enriched, nil
}

func (s *ChatService) enrichMessages(ctx context.Context, messages []model.ChatMessage) ([]model.ChatMessageEnriched, error) {
	enriched := make([]model.ChatMessageEnriched, len(messages))
	for i, msg := range messages {
		result, err := s.enrichMessage(ctx, msg)
		if err != nil {
			return nil, err
		}
		enriched[i] = result
	}
	return enriched, nil
}

func (s *ChatService) getOfflineUsers(roomID string) []string {
	clients := s.hub.GetRoomClients(roomID)
	var offlineUsers []string
	for _, client := range clients {
		if client.Conn == nil {
			offlineUsers = append(offlineUsers, client.ID)
		}
	}
	return offlineUsers
}