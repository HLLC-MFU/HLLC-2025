package utils

import (
	"chat/module/room/model"
	"chat/pkg/core/kafka"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	roomEventsTopic = "room-events"
)

type RoomEvent struct {
	Type    string          `json:"type"`
	RoomID  string          `json:"roomId"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

type RoomEventEmitter struct {
	bus *kafka.Bus
}

func NewRoomEventEmitter(bus *kafka.Bus, brokerAddress string) *RoomEventEmitter {
	// Ensure the room-events topic exists
	if err := kafka.EnsureTopic(brokerAddress, roomEventsTopic, 1); err != nil {
		log.Printf("[Kafka] Failed to ensure topic %s: %v", roomEventsTopic, err)
	}

	// Wait for topic to be ready
	if err := kafka.WaitForTopic(brokerAddress, roomEventsTopic, 10*time.Second); err != nil {
		log.Printf("[Kafka] Topic %s not ready: %v", roomEventsTopic, err)
	}

	return &RoomEventEmitter{
		bus: bus,
	}
}

func (e *RoomEventEmitter) EmitRoomCreated(ctx context.Context, roomID primitive.ObjectID, room *model.Room) {
	// Validate IDs
	if roomID.IsZero() {
		log.Printf("[ERROR] Attempted to emit room_created event with zero roomID")
		return
	}
	if room.ID.IsZero() {
		log.Printf("[ERROR] Attempted to emit room_created event with zero room.ID")
		return
	}
	if roomID != room.ID {
		log.Printf("[ERROR] roomID mismatch in room_created event: %s != %s", roomID.Hex(), room.ID.Hex())
		return
	}

	log.Printf("[RoomEvent] Emitting room_created event for room %s", roomID.Hex())
	
	payload, err := json.Marshal(room)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal room for room_created event: %v", err)
		return
	}

	event := RoomEvent{
		Type:    "room_created",
		RoomID:  roomID.Hex(),
		Payload: payload,
	}

	if err := e.emitEvent(ctx, event); err != nil {
		log.Printf("[ERROR] Failed to emit room_created event for room %s: %v", roomID.Hex(), err)
	} else {
		log.Printf("[RoomEvent] Successfully emitted room_created event for room %s", roomID.Hex())
	}
}

func (e *RoomEventEmitter) EmitRoomDeleted(ctx context.Context, roomID primitive.ObjectID) {
	// Validate ID
	if roomID.IsZero() {
		log.Printf("[ERROR] Attempted to emit room_deleted event with zero roomID")
		return
	}

	log.Printf("[RoomEvent] Emitting room_deleted event for room %s", roomID.Hex())

	event := RoomEvent{
		Type:   "room_deleted",
		RoomID: roomID.Hex(),
	}

	if err := e.emitEvent(ctx, event); err != nil {
		log.Printf("[ERROR] Failed to emit room_deleted event for room %s: %v", roomID.Hex(), err)
	} else {
		log.Printf("[RoomEvent] Successfully emitted room_deleted event for room %s", roomID.Hex())
	}
}

func (e *RoomEventEmitter) EmitRoomMemberJoined(ctx context.Context, roomID, userID primitive.ObjectID) {
	// Validate IDs
	if roomID.IsZero() {
		log.Printf("[ERROR] Attempted to emit room_member_joined event with zero roomID")
		return
	}
	if userID.IsZero() {
		log.Printf("[ERROR] Attempted to emit room_member_joined event with zero userID")
		return
	}

	log.Printf("[RoomEvent] Emitting room_member_joined event for room %s, user %s", roomID.Hex(), userID.Hex())

	payload := map[string]string{
		"userId": userID.Hex(),
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal payload for room_member_joined event: %v", err)
		return
	}

	event := RoomEvent{
		Type:    "room_member_joined",
		RoomID:  roomID.Hex(),
		Payload: payloadBytes,
	}

	if err := e.emitEvent(ctx, event); err != nil {
		log.Printf("[ERROR] Failed to emit room_member_joined event for room %s, user %s: %v", 
			roomID.Hex(), userID.Hex(), err)
	} else {
		log.Printf("[RoomEvent] Successfully emitted room_member_joined event for room %s, user %s", 
			roomID.Hex(), userID.Hex())
	}
}

func (e *RoomEventEmitter) emitEvent(ctx context.Context, event RoomEvent) error {
	// Validate event
	if event.RoomID == "" || event.RoomID == "000000000000000000000000" {
		return fmt.Errorf("invalid roomID in event: %s", event.RoomID)
	}

	// Marshal event to JSON
	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Send JSON bytes to Kafka
	return e.bus.Emit(ctx, roomEventsTopic, event.RoomID, eventBytes)
}
