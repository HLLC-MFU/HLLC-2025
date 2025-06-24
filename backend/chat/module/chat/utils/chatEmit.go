package utils

import (
	"chat/module/chat/model"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ChatEventEmitter struct {
	hub   *Hub
	bus   *kafka.Bus
	redis *redis.Client
	mongo *mongo.Database
}

func NewChatEventEmitter(hub *Hub, bus *kafka.Bus, redis *redis.Client, mongo *mongo.Database) *ChatEventEmitter {
	return &ChatEventEmitter{
		hub:   hub,
		bus:   bus,
		redis: redis,
		mongo: mongo,
	}
}

func (e *ChatEventEmitter) EmitMessage(ctx context.Context, msg *model.ChatMessage) error {
	log.Printf("[TRACE] EmitMessage called for message ID=%s Room=%s Text=%s", 
		msg.ID.Hex(), msg.RoomID.Hex(), msg.Message)

	event := ChatEvent{
		Type:      "message",
		RoomID:    msg.RoomID.Hex(),
		UserID:    queries.GetEnrichedUserInfoWithFallback(ctx, e.mongo, msg.UserID),
		Message:   msg.Message,
		Timestamp: time.Now(),
	}

	return e.emitEvent(ctx, msg, event)
}

func (e *ChatEventEmitter) emitEvent(ctx context.Context, msg *model.ChatMessage, event ChatEvent) error {
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
	}

	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	e.hub.BroadcastEvent(event)

	roomTopic := getRoomTopic(msg.RoomID.Hex())

	if err := e.bus.Emit(ctx, roomTopic, msg.RoomID.Hex(), eventBytes); err != nil {
		return fmt.Errorf("failed to emit to Kafka: %w", err)
	}

	log.Printf("[Kafka] Successfully published message ID=%s to topic %s", msg.ID.Hex(), roomTopic)
	return nil
}

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

	e.hub.BroadcastEvent(event)

	roomTopic := getRoomTopic(roomID.Hex())
	eventBytes, _ := json.Marshal(event)
	if err := e.bus.Emit(ctx, roomTopic, roomID.Hex(), eventBytes); err != nil {
		return fmt.Errorf("failed to emit reaction to Kafka: %w", err)
	}

	return nil
}

func (e *ChatEventEmitter) EmitTyping(ctx context.Context, roomID, userID string) error {
	event := ChatEvent{
		Type:      "typing",
		RoomID:    roomID,
		UserID:    userID,
		Timestamp: time.Now(),
	}

	e.hub.BroadcastEvent(event)
	return nil
}

func (e *ChatEventEmitter) EmitUserJoined(ctx context.Context, roomID, userID string) error {
	event := ChatEvent{
		Type:      "user_joined",
		RoomID:    roomID,
		UserID:    userID,
		Timestamp: time.Now(),
	}

	e.hub.BroadcastEvent(event)

	roomTopic := getRoomTopic(roomID)
	eventBytes, _ := json.Marshal(event)
	if err := e.bus.Emit(ctx, roomTopic, roomID, eventBytes); err != nil {
		return fmt.Errorf("failed to emit user_joined to Kafka: %w", err)
	}

	return nil
}

func (e *ChatEventEmitter) EmitUserLeft(ctx context.Context, roomID, userID string) error {
	event := ChatEvent{
		Type:      "user_left",
		RoomID:    roomID,
		UserID:    userID,
		Timestamp: time.Now(),
	}

	e.hub.BroadcastEvent(event)

	roomTopic := getRoomTopic(roomID)
	eventBytes, _ := json.Marshal(event)
	if err := e.bus.Emit(ctx, roomTopic, roomID, eventBytes); err != nil {
		return fmt.Errorf("failed to emit user_left to Kafka: %w", err)
	}

	return nil
}