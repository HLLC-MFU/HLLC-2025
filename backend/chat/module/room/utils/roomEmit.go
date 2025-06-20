package utils

import (
	"chat/pkg/core/kafka"
	"context"
	"encoding/json"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	roomEventsTopic = "room-events"
)

type (
	RoomEventEmitter struct {
		kafkaBus *kafka.Bus
		broker   string
	}

	RoomEvent struct {
		Type    string          `json:"type"`
		RoomID  string          `json:"roomId"`
		Payload json.RawMessage `json:"payload,omitempty"`
	}
)

func NewRoomEventEmitter(bus *kafka.Bus, broker string) *RoomEventEmitter {
	return &RoomEventEmitter{
		kafkaBus: bus,
		broker:   broker,
	}
}

func (e *RoomEventEmitter) emitRoomEvent(ctx context.Context, eventType string, roomID primitive.ObjectID, payload any) {
	go func() {
		topicName := "chat-room-" + roomID.Hex()

		if err := kafka.EnsureTopic(e.broker, topicName, 1); err != nil {
			log.Printf("[Kafka] Failed to ensure topic %s: %v", topicName, err)
			return
		}

		if err := kafka.WaitForTopic(e.broker, topicName, 10*time.Second); err != nil {
			log.Printf("[Kafka] Topic %s not ready: %v", topicName, err)
			return
		}

		event := RoomEvent{
			Type:    eventType,
			RoomID:  roomID.Hex(),
			Payload: marshalRaw(payload),
		}

		if err := e.kafkaBus.Emit(ctx, roomEventsTopic, "room-system", event); err != nil {
			log.Printf("[Kafka] Failed to emit %s event for room %s: %v", eventType, roomID.Hex(), err)
		}
	}()
}

// ==== Convenience Emitters ====

func (e *RoomEventEmitter) EmitRoomCreated(ctx context.Context, roomID primitive.ObjectID, payload any) {
	e.emitRoomEvent(ctx, "room_created", roomID, payload)
}

func (e *RoomEventEmitter) EmitRoomDeleted(ctx context.Context, roomID primitive.ObjectID) {
	e.emitRoomEvent(ctx, "room_deleted", roomID, nil)
}

func (e *RoomEventEmitter) EmitRoomMemberJoined(ctx context.Context, roomID, userID primitive.ObjectID) {
	e.emitRoomEvent(ctx, "room_member_joined", roomID, map[string]string{
		"userId": userID.Hex(),
	})
}

// ==== Internal ====

func marshalRaw(data any) json.RawMessage {
	if data == nil {
		return nil
	}
	bytes, err := json.Marshal(data)
	if err != nil {
		log.Printf("[Kafka] Failed to marshal payload: %v", err)
		return nil
	}
	return bytes
}
