package utils

import (
	"chat/module/chat/model"
	"chat/pkg/core/kafka"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ChatEventEmitter handles all chat event broadcasting responsibilities
type ChatEventEmitter struct {
	hub *Hub
	bus *kafka.Bus
	redis *redis.Client
}

func NewChatEventEmitter(hub *Hub, bus *kafka.Bus, redis *redis.Client) *ChatEventEmitter {
	return &ChatEventEmitter{
		hub: hub,
		bus: bus,
		redis: redis,
	}
}

// EmitMessage broadcasts a new chat message through both WebSocket and Kafka
func (e *ChatEventEmitter) EmitMessage(ctx context.Context, msg *model.ChatMessage) error {
	// Add detailed logging
	log.Printf("[TRACE] EmitMessage called for message ID=%s Room=%s User=%s Text=%s", 
		msg.ID.Hex(), msg.RoomID.Hex(), msg.UserID.Hex(), msg.Message)

	// Create base event
	event := ChatEvent{
		RoomID:    msg.RoomID.Hex(),
		UserID:    msg.UserID.Hex(),
		Message:   msg.Message,
		Timestamp: time.Now(),
	}

	// Handle different message types
	if msg.StickerID != nil {
		event.Type = "sticker"
		event.Payload = map[string]interface{}{
			"stickerId": msg.StickerID.Hex(),
			"image":     msg.Image,
		}
	} else if msg.FileURL != "" {
		event.Type = "file"
		event.Payload = map[string]interface{}{
			"fileUrl":  msg.FileURL,
			"fileType": msg.FileType,
			"fileName": msg.FileName,
		}
	} else {
		event.Type = "message"
	}

	// Marshal event for broadcasting
	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Broadcast to WebSocket clients first
	e.hub.BroadcastEvent(event)

	// Get room topic
	roomTopic := getRoomTopic(msg.RoomID.Hex())

	// Emit to Kafka
	if err := e.bus.Emit(ctx, roomTopic, msg.RoomID.Hex(), eventBytes); err != nil {
		return fmt.Errorf("failed to emit to Kafka: %w", err)
	}

	log.Printf("[Kafka] Successfully published message ID=%s to topic %s", msg.ID.Hex(), roomTopic)
	return nil
}

// EmitReaction broadcasts a message reaction
func (e *ChatEventEmitter) EmitReaction(ctx context.Context, reaction *model.MessageReaction, roomID primitive.ObjectID) error {
	event := ChatEvent{
		Type:      "reaction",
		RoomID:    roomID.Hex(),
		UserID:    reaction.UserID.Hex(),
		Timestamp: time.Now(),
	}

	payload := map[string]string{
		"messageId": reaction.MessageID.Hex(),
		"reaction": reaction.Reaction,
	}
	event.Payload, _ = json.Marshal(payload)

	// Broadcast to WebSocket clients first
	e.hub.BroadcastEvent(event)

	// Then publish to Kafka
	roomTopic := getRoomTopic(roomID.Hex())
	eventBytes, _ := json.Marshal(event)
	if err := e.bus.Emit(ctx, roomTopic, roomID.Hex(), eventBytes); err != nil {
		return fmt.Errorf("failed to emit reaction to Kafka: %w", err)
	}

	return nil
}

// EmitTyping broadcasts a typing indicator (WebSocket only)
func (e *ChatEventEmitter) EmitTyping(ctx context.Context, roomID, userID string) error {
	event := ChatEvent{
		Type:      "typing",
		RoomID:    roomID,
		UserID:    userID,
		Timestamp: time.Now(),
	}

	// Only broadcast through WebSocket
	e.hub.BroadcastEvent(event)
	return nil
}

// EmitUserJoined broadcasts when a user joins a chat room
func (e *ChatEventEmitter) EmitUserJoined(ctx context.Context, roomID, userID string) error {
	event := ChatEvent{
		Type:      "user_joined",
		RoomID:    roomID,
		UserID:    userID,
		Timestamp: time.Now(),
	}

	// Broadcast to WebSocket clients first
	e.hub.BroadcastEvent(event)

	// Then publish to Kafka
	roomTopic := getRoomTopic(roomID)
	eventBytes, _ := json.Marshal(event)
	if err := e.bus.Emit(ctx, roomTopic, roomID, eventBytes); err != nil {
		return fmt.Errorf("failed to emit user_joined to Kafka: %w", err)
	}

	return nil
}

// EmitUserLeft broadcasts when a user leaves a chat room
func (e *ChatEventEmitter) EmitUserLeft(ctx context.Context, roomID, userID string) error {
	event := ChatEvent{
		Type:      "user_left",
		RoomID:    roomID,
		UserID:    userID,
		Timestamp: time.Now(),
	}

	// Broadcast to WebSocket clients first
	e.hub.BroadcastEvent(event)

	// Then publish to Kafka
	roomTopic := getRoomTopic(roomID)
	eventBytes, _ := json.Marshal(event)
	if err := e.bus.Emit(ctx, roomTopic, roomID, eventBytes); err != nil {
		return fmt.Errorf("failed to emit user_left to Kafka: %w", err)
	}

	return nil
}