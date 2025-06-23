package utils

import (
	"chat/module/room/model"
	"chat/pkg/core/kafka"
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RoomEventEmitter struct {
	bus *kafka.Bus
}

func NewRoomEventEmitter(bus *kafka.Bus, brokerAddress string) *RoomEventEmitter {
	return &RoomEventEmitter{bus: bus}
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

	roomTopic := fmt.Sprintf("chat-room-%s", roomID.Hex())
	if err := kafka.EnsureTopic("localhost:9092", roomTopic, 1); err != nil {
		log.Printf("[Kafka] Failed to create topic %s: %v", roomTopic, err)
		return
	}

	if err := e.bus.Emit(ctx, roomTopic, roomID.Hex(), eventBytes); err != nil {
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

	roomTopic := fmt.Sprintf("chat-room-%s", roomID.Hex())

	if err := e.bus.Emit(ctx, roomTopic, roomID.Hex(), eventBytes); err != nil {
		EmitErrorLog(ctx, "room_deleted", err)
		return
	}

	if err := kafka.DeleteTopic("localhost:9092", roomTopic); err != nil {
		log.Printf("[Kafka] Failed to delete topic %s: %v", roomTopic, err)
	} else {
		log.Printf("[Kafka] Deleted topic %s", roomTopic)
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

	if err := e.emitEvent(ctx, event); err != nil {
		EmitErrorLog(ctx, fmt.Sprintf("room_member_joined room=%s user=%s", roomID.Hex(), userID.Hex()), err)
	} else {
		log.Printf("[RoomEvent] Successfully emitted room_member_joined event for room %s, user %s", roomID.Hex(), userID.Hex())
	}
}

func (e *RoomEventEmitter) emitEvent(ctx context.Context, event model.RoomEvent) error {
	if event.RoomID == "" || event.RoomID == "000000000000000000000000" {
		return fmt.Errorf("invalid roomID in event: %s", event.RoomID)
	}

	roomTopic := fmt.Sprintf("chat-room-%s", event.RoomID)

	if err := kafka.EnsureTopic("localhost:9092", roomTopic, 1); err != nil {
		log.Printf("[Kafka] Failed to ensure topic %s: %v", roomTopic, err)
	}

	eventBytes, ok := MustMarshal(event, "generic event")
	if !ok {
		return fmt.Errorf("failed to marshal event for topic %s", roomTopic)
	}

	return e.bus.Emit(ctx, roomTopic, event.RoomID, eventBytes)
}
