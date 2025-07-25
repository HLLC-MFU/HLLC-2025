package events

import (
	"chat/module/room/room/model"
	roomHelper "chat/module/room/shared/utils"
	"chat/pkg/config"
	"chat/pkg/core/kafka"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const RoomTopicPrefix = "chat-room-"

// สร้าง topic สำหรับ room
func GetRoomTopic(roomID string) string {
	return RoomTopicPrefix + roomID
}

// RoomEventEmitter สำหรับส่ง event ไปยัง topic
type RoomEventEmitter struct {
	bus     *kafka.Bus
	brokers []string
	config  *config.Config
}

func NewRoomEventEmitter(bus *kafka.Bus, cfg *config.Config) *RoomEventEmitter {
	return &RoomEventEmitter{
		bus:     bus,
		brokers: []string{cfg.Kafka.Brokers[0]},
		config:  cfg,
	}
}

// ส่ง event ไปยัง topic สำหรับ room_created
func (e *RoomEventEmitter) EmitRoomCreated(ctx context.Context, roomID primitive.ObjectID, room *model.Room) {
	if !roomHelper.ValidateRoomID(roomID, "room_created") {
		return
	}

	log.Printf("[RoomEvent] Emitting room_created event for room %s", roomID.Hex())

	// ตรวจสอบว่า room มีค่าไหม
	payload, ok := roomHelper.MustMarshal(room, "room_created payload")
	if !ok {
		return
	}

	// สร้าง event
	event := model.RoomEvent{
		Type:    "room_created",
		RoomID:  roomID.Hex(),
		Payload: payload,
	}

	// ตรวจสอบว่า event มีค่าไหม
	eventBytes, ok := roomHelper.MustMarshal(event, "room_created event")
	if !ok {
		return
	}

	// สร้าง topic และรอให้พร้อม
	topic := GetRoomTopic(roomID.Hex())
	if err := kafka.EnsureTopic(e.brokers, topic, 1); err != nil {
		log.Printf("[ERROR] Failed to create room topic: %v", err)
		return
	}

	// รอให้ topic พร้อมใช้งาน
	if err := kafka.WaitForTopic(e.brokers[0], topic, 5*time.Second); err != nil {
		log.Printf("[ERROR] Room topic not ready: %v", err)
		return
	}

	// ส่ง event ไปยัง topic
	if err := e.bus.Emit(ctx, topic, roomID.Hex(), eventBytes); err != nil {
		roomHelper.EmitErrorLog(ctx, "room_created", err)
	}
}

// ส่ง event ไปยัง topic สำหรับ room_deleted
func (e *RoomEventEmitter) EmitRoomDeleted(ctx context.Context, roomID primitive.ObjectID) {

	// ตรวจสอบว่า roomID มีค่าไหม
	if !roomHelper.ValidateRoomID(roomID, "room_deleted") {
		return
	}

	// สร้าง event
	event := model.RoomEvent{
		Type:   "room_deleted",
		RoomID: roomID.Hex(),
	}

	// ตรวจสอบว่า event มีค่าไหม
	eventBytes, ok := roomHelper.MustMarshal(event, "room_deleted event")
	if !ok {
		return
	}

	// สร้าง topic
	topic := GetRoomTopic(roomID.Hex())

	// ส่ง event ไปยัง topic
	if err := e.bus.Emit(ctx, topic, roomID.Hex(), eventBytes); err != nil {
		roomHelper.EmitErrorLog(ctx, "room_deleted", err)
		return
	}

	// ลบ topic
	if err := kafka.DeleteTopic(e.brokers[0], topic); err != nil {
		log.Printf("[ERROR] Failed to delete room topic: %v", err)
		return
	} else {
		log.Printf("[Kafka] Deleted topic %s", topic)
	}
}

func (e *RoomEventEmitter) EmitRoomMemberJoined(ctx context.Context, roomID, userID primitive.ObjectID) {
	if !roomHelper.ValidateRoomID(roomID, "room_member_joined") || !roomHelper.ValidateUserID(userID, "room_member_joined") {
		return
	}

	log.Printf("[RoomEvent] Emitting room_member_joined event for room %s, user %s", roomID.Hex(), userID.Hex())

	// สร้าง payload
	payload := map[string]string{
		"userId": userID.Hex(),
	}

	// ตรวจสอบว่า payload มีค่าไหม
	payloadBytes, ok := roomHelper.MustMarshal(payload, "room_member_joined payload")
	if !ok {
		return
	}

	// สร้าง event
	event := model.RoomEvent{
		Type:    "room_member_joined",
		RoomID:  roomID.Hex(),
		Payload: payloadBytes,
	}

	// สร้าง topic
	topic := GetRoomTopic(roomID.Hex())

	// ตรวจสอบว่า topic มีค่าไหม
	if err := kafka.EnsureTopic(e.brokers, topic, 1); err != nil {
		log.Printf("[ERROR] Failed to ensure room topic: %v", err)
		return
	}

	// ส่ง event ไปยัง topic
	if err := e.emitEvent(ctx, event); err != nil {
		roomHelper.EmitErrorLog(ctx, fmt.Sprintf("room_member_joined room=%s user=%s", roomID.Hex(), userID.Hex()), err)
	} else {
		log.Printf("[RoomEvent] Successfully emitted room_member_joined event for room %s, user %s", roomID.Hex(), userID.Hex())
	}
}

func (e *RoomEventEmitter) EmitRoomMemberLeft(ctx context.Context, roomID, userID primitive.ObjectID) {
	// ตรวจสอบว่า roomID และ userID มีค่าไหม
	if !roomHelper.ValidateRoomID(roomID, "room_member_left") || !roomHelper.ValidateUserID(userID, "room_member_left") {
		return
	}

	log.Printf("[RoomEvent] Emitting room_member_left event for room %s, user %s", roomID.Hex(), userID.Hex())

	// สร้าง event
	event := model.RoomEvent{
		Type:   "room_member_left",
		RoomID: roomID.Hex(),
	}

	// สร้าง topic
	topic := GetRoomTopic(roomID.Hex())

	// ตรวจสอบว่า topic มีค่าไหม
	if err := kafka.EnsureTopic(e.brokers, topic, 1); err != nil {
		log.Printf("[ERROR] Failed to ensure room topic: %v", err)
		return
	}

	// ส่ง event ไปยัง topic
	if err := e.emitEvent(ctx, event); err != nil {
		roomHelper.EmitErrorLog(ctx, fmt.Sprintf("room_member_left room=%s user=%s", roomID.Hex(), userID.Hex()), err)
	} else {
		log.Printf("[RoomEvent] Successfully emitted room_member_left event for room %s, user %s", roomID.Hex(), userID.Hex())
	}
}

func (e *RoomEventEmitter) EmitRoomMemberRemoved(ctx context.Context, roomID, userID primitive.ObjectID) {

	// ตรวจสอบว่า roomID และ userID มีค่าไหม
	if !roomHelper.ValidateRoomID(roomID, "room_member_removed") || !roomHelper.ValidateUserID(userID, "room_member_removed") {
		return
	}

	log.Printf("[RoomEvent] Emitting room_member_removed event for room %s, user %s", roomID.Hex(), userID.Hex())

	// สร้าง topic
	topic := GetRoomTopic(roomID.Hex())

	// ลบ topic
	if err := kafka.DeleteTopic(e.brokers[0], topic); err != nil {
		log.Printf("[ERROR] Failed to delete room topic: %v", err)
		return
	}
	log.Printf("[Kafka] Successfully deleted topic %s", topic)
}

// ส่ง event ไปยัง topic
func (e *RoomEventEmitter) emitEvent(ctx context.Context, event model.RoomEvent) error {

	// สร้าง topic และรอให้พร้อม
	topic := GetRoomTopic(event.RoomID)

	// ตรวจสอบว่า topic มีค่าไหม
	if err := kafka.EnsureTopic(e.brokers, topic, 1); err != nil {
		log.Printf("[ERROR] Failed to ensure room topic: %v", err)
		return err
	}

	// รอให้ topic พร้อมใช้งาน
	if err := kafka.WaitForTopic(e.brokers[0], topic, 3*time.Second); err != nil {
		log.Printf("[ERROR] Room topic not ready: %v", err)
		return err
	}

	// สร้าง event
	eventBytes, ok := roomHelper.MustMarshal(event, "generic event")
	if !ok {
		return fmt.Errorf("failed to marshal event for topic %s", topic)
	}

	// ส่ง event ไปยัง topic
	return e.bus.Emit(ctx, topic, event.RoomID, eventBytes)
}

func (e *RoomEventEmitter) EnsureRoomTopic(ctx context.Context, roomID primitive.ObjectID) error {

	// ตรวจสอบว่า roomID มีค่าไหม
	if !roomHelper.ValidateRoomID(roomID, "ensure_room_topic") {
		return fmt.Errorf("invalid room ID")
	}

	// สร้าง topic
	topic := GetRoomTopic(roomID.Hex())
	if err := kafka.EnsureTopic(e.brokers, topic, 1); err != nil {
		log.Printf("[ERROR] Failed to create room topic: %v", err)
		return err
	}

	// ส่ง event ไปยัง topic
	log.Printf("[Kafka] Successfully created topic %s", topic)
	return nil
}

func (e *RoomEventEmitter) DeleteRoomTopic(ctx context.Context, roomID primitive.ObjectID) error {

	// ตรวจสอบว่า roomID มีค่าไหม
	if !roomHelper.ValidateRoomID(roomID, "delete_room_topic") {
		return fmt.Errorf("invalid room ID")
	}

	// สร้าง topic
	topic := GetRoomTopic(roomID.Hex())
	if err := kafka.DeleteTopic(e.brokers[0], topic); err != nil {
		log.Printf("[ERROR] Failed to delete room topic: %v", err)
		return err
	}

	// ส่ง event ไปยัง topic
	log.Printf("[Kafka] Successfully deleted topic %s", topic)
	return nil
}

// EmitRoomStatusChanged emits a room status change event
func (e *RoomEventEmitter) EmitRoomStatusChanged(ctx context.Context, roomID primitive.ObjectID, newStatus string) {
	if !roomHelper.ValidateRoomID(roomID, "room_status_changed") {
		return
	}

	log.Printf("[RoomEvent] Emitting room_status_changed event for room %s, status: %s", roomID.Hex(), newStatus)

	// Create payload
	payload := map[string]interface{}{
		"roomId":    roomID.Hex(),
		"status":    newStatus,
		"timestamp": time.Now(),
	}

	// Marshal payload
	payloadBytes, ok := roomHelper.MustMarshal(payload, "room_status_changed payload")
	if !ok {
		return
	}

	// Create event
	event := model.RoomEvent{
		Type:    "room_status_changed",
		RoomID:  roomID.Hex(),
		Payload: payloadBytes,
	}

	// Create topic
	topic := GetRoomTopic(roomID.Hex())

	// Ensure topic exists
	if err := kafka.EnsureTopic(e.brokers, topic, 1); err != nil {
		log.Printf("[ERROR] Failed to ensure room topic: %v", err)
		return
	}

	// Send event to topic
	if err := e.emitEvent(ctx, event); err != nil {
		roomHelper.EmitErrorLog(ctx, fmt.Sprintf("room_status_changed room=%s status=%s", roomID.Hex(), newStatus), err)
	} else {
		log.Printf("[RoomEvent] Successfully emitted room_status_changed event for room %s, status: %s", roomID.Hex(), newStatus)
	}
}
