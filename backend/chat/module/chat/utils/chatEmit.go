package utils

import (
	"chat/module/chat/model"
	"chat/pkg/core/kafka"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ChatEventEmitter handles all chat event broadcasting responsibilities
type ChatEventEmitter struct {
	hub *Hub
	bus *kafka.Bus
}

func NewChatEventEmitter(hub *Hub, bus *kafka.Bus) *ChatEventEmitter {
	return &ChatEventEmitter{
		hub: hub,
		bus: bus,
	}
}

// EmitMessage broadcasts a new chat message through both WebSocket and Kafka
func (e *ChatEventEmitter) EmitMessage(ctx context.Context, msg *model.ChatMessage) error {
	// Create chat event
	event := ChatEvent{
		Type:      "message",
		RoomID:    msg.RoomID.Hex(),
		UserID:    msg.UserID.Hex(),
		Message:   msg.Message,
		Timestamp: time.Now(),
	}

	// Add additional data if present
	if msg.FileURL != "" {
		event.Payload, _ = json.Marshal(map[string]string{
			"fileUrl":  msg.FileURL,
			"fileType": msg.FileType,
			"fileName": msg.FileName,
		})
	}

	if msg.StickerID != nil {
		event.Payload, _ = json.Marshal(map[string]string{
			"stickerId": msg.StickerID.Hex(),
			"image":     msg.Image,
		})
	}

	// Marshal event for broadcasting
	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Broadcast to WebSocket clients first
	e.hub.BroadcastEvent(event)

	// Then publish to Kafka
	roomTopic := getRoomTopic(msg.RoomID.Hex())
	if err := kafka.EnsureTopic("localhost:9092", roomTopic, 1); err != nil {
		log.Printf("[WARN] Failed to ensure topic %s: %v", roomTopic, err)
	}

	if err := e.bus.Emit(ctx, roomTopic, msg.RoomID.Hex(), eventBytes); err != nil {
		return fmt.Errorf("failed to emit to Kafka: %w", err)
	}

	log.Printf("[Kafka] Successfully published message to topic %s", roomTopic)
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