package utils

import (
	"chat/module/room/model"
	"chat/pkg/config"
	"chat/pkg/core/kafka"
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const RoomTopicPrefix = "chat-room-"

func GetRoomTopic(roomID string) string {
	return RoomTopicPrefix + roomID
}

type RoomEventEmitter struct {
	bus     *kafka.Bus
	brokers string
	config  *config.Config
}

func NewRoomEventEmitter(bus *kafka.Bus, cfg *config.Config) *RoomEventEmitter {
	return &RoomEventEmitter{
		bus:     bus,
		brokers: cfg.Kafka.Brokers[0],
		config:  cfg,
	}
}

func (e *RoomEventEmitter) EmitRoomCreated(ctx context.Context, roomID primitive.ObjectID, room *model.Room) {
	if !ValidateRoomID(roomID, "room_created") {
		return
	}

	log.Printf("[RoomEvent] Emitting room_created event for room %s", roomID.Hex())

	payload, ok := MustMarshal(room, "room_created payload")
	if !ok {
		return
	}

	event := model.RoomEvent{
		Type:    "room_created",
		RoomID:  roomID.Hex(),
		Payload: payload,
	}

	eventBytes, ok := MustMarshal(event, "room_created event")
	if !ok {
		return
	}

	topic := GetRoomTopic(roomID.Hex())
	if err := kafka.EnsureTopic(e.brokers, topic, 1); err != nil {
		log.Printf("[ERROR] Failed to create room topic: %v", err)
		return
	}

	if err := e.bus.Emit(ctx, topic, roomID.Hex(), eventBytes); err != nil {
		EmitErrorLog(ctx, "room_created", err)
	}
}

func (e *RoomEventEmitter) EmitRoomDeleted(ctx context.Context, roomID primitive.ObjectID) {
	if !ValidateRoomID(roomID, "room_deleted") {
		return
	}

	event := model.RoomEvent{
		Type:   "room_deleted",
		RoomID: roomID.Hex(),
	}

	eventBytes, ok := MustMarshal(event, "room_deleted event")
	if !ok {
		return
	}

	topic := GetRoomTopic(roomID.Hex())

	if err := e.bus.Emit(ctx, topic, roomID.Hex(), eventBytes); err != nil {
		EmitErrorLog(ctx, "room_deleted", err)
		return
	}

	if err := kafka.DeleteTopic(e.brokers, topic); err != nil {
		log.Printf("[ERROR] Failed to delete room topic: %v", err)
		return
	} else {
		log.Printf("[Kafka] Deleted topic %s", topic)
	}	
}

func (e *RoomEventEmitter) EmitRoomMemberJoined(ctx context.Context, roomID, userID primitive.ObjectID) {
	if !ValidateRoomID(roomID, "room_member_joined") || !ValidateUserID(userID, "room_member_joined") {
		return
	}

	log.Printf("[RoomEvent] Emitting room_member_joined event for room %s, user %s", roomID.Hex(), userID.Hex())

	payload := map[string]string{
		"userId": userID.Hex(),
	}

	payloadBytes, ok := MustMarshal(payload, "room_member_joined payload")
	if !ok {
		return
	}

	event := model.RoomEvent{
		Type:    "room_member_joined",
		RoomID:  roomID.Hex(),
		Payload: payloadBytes,
	}

	topic := GetRoomTopic(roomID.Hex())
	if err := kafka.EnsureTopic(e.brokers, topic, 1); err != nil {
		log.Printf("[ERROR] Failed to ensure room topic: %v", err)
		return
	}

	if err := e.emitEvent(ctx, event); err != nil {
		EmitErrorLog(ctx, fmt.Sprintf("room_member_joined room=%s user=%s", roomID.Hex(), userID.Hex()), err)
	} else {
		log.Printf("[RoomEvent] Successfully emitted room_member_joined event for room %s, user %s", roomID.Hex(), userID.Hex())
	}
}

func (e *RoomEventEmitter) EmitRoomMemberLeft(ctx context.Context, roomID, userID primitive.ObjectID) {
	topic := GetRoomTopic(roomID.Hex())
	if err := kafka.EnsureTopic(e.brokers, topic, 1); err != nil {
		log.Printf("[ERROR] Failed to ensure room topic: %v", err)
		return
	}
	// ... rest of the function
}

func (e *RoomEventEmitter) EmitRoomMemberRemoved(ctx context.Context, roomID, userID primitive.ObjectID) {
	topic := GetRoomTopic(roomID.Hex())
	if err := kafka.DeleteTopic(e.brokers, topic); err != nil {
		log.Printf("[ERROR] Failed to delete room topic: %v", err)
		return
	}
	// ... rest of the function
}

func (e *RoomEventEmitter) emitEvent(ctx context.Context, event model.RoomEvent) error {
	if event.RoomID == "" || event.RoomID == "000000000000000000000000" {
		return fmt.Errorf("invalid roomID in event: %s", event.RoomID)
	}

	topic := GetRoomTopic(event.RoomID)

	if err := kafka.EnsureTopic(e.brokers, topic, 1); err != nil {
		log.Printf("[ERROR] Failed to ensure room topic: %v", err)
	}

	eventBytes, ok := MustMarshal(event, "generic event")
	if !ok {
		return fmt.Errorf("failed to marshal event for topic %s", topic)
	}

	return e.bus.Emit(ctx, topic, event.RoomID, eventBytes)
}

func (e *RoomEventEmitter) EnsureRoomTopic(ctx context.Context, roomID primitive.ObjectID) error {
	if !ValidateRoomID(roomID, "ensure_room_topic") {
		return fmt.Errorf("invalid room ID")
	}

	topic := GetRoomTopic(roomID.Hex())
	if err := kafka.EnsureTopic(e.brokers, topic, 1); err != nil {
		log.Printf("[ERROR] Failed to create room topic: %v", err)
		return err
	}

	log.Printf("[Kafka] Successfully created topic %s", topic)
	return nil
}

func (e *RoomEventEmitter) DeleteRoomTopic(ctx context.Context, roomID primitive.ObjectID) error {
	if !ValidateRoomID(roomID, "delete_room_topic") {
		return fmt.Errorf("invalid room ID")
	}

	topic := GetRoomTopic(roomID.Hex())
	if err := kafka.DeleteTopic(e.brokers, topic); err != nil {
		log.Printf("[ERROR] Failed to delete room topic: %v", err)
		return err
	}

	log.Printf("[Kafka] Successfully deleted topic %s", topic)
	return nil
}