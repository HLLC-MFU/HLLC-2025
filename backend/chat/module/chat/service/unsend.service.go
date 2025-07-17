package service

import (
	"chat/module/chat/model"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UnsendMessage ทำ soft delete ข้อความที่ส่งแล้ว (เฉพาะเจ้าของข้อความเท่านั้น)
func (s *ChatService) UnsendMessage(ctx context.Context, messageID, userID primitive.ObjectID) error {
	log.Printf("[ChatService] UnsendMessage called for message %s by user %s", messageID.Hex(), userID.Hex())

	// ดึงข้อความจาก database เพื่อตรวจสอบความเป็นเจ้าของ
	msg, err := s.FindOneById(ctx, messageID.Hex())
	if err != nil {
		log.Printf("[ChatService] Failed to find message %s: %v", messageID.Hex(), err)
		return fmt.Errorf("message not found: %w", err)
	}

	if len(msg.Data) == 0 {
		return fmt.Errorf("message not found")
	}

	messageData := msg.Data[0]

	// ตรวจสอบว่าข้อความได้ถูก unsend ไปแล้วหรือไม่
	if messageData.IsDeleted != nil && *messageData.IsDeleted {
		log.Printf("[ChatService] Message %s is already unsent", messageID.Hex())
		return fmt.Errorf("message has already been unsent")
	}

	// ตรวจสอบว่า user เป็นเจ้าของข้อความหรือไม่
	if messageData.UserID != userID {
		log.Printf("[ChatService] User %s is not the owner of message %s (owner: %s)", 
			userID.Hex(), messageID.Hex(), messageData.UserID.Hex())
		return fmt.Errorf("you can only unsend your own messages")
	}

	// **Soft Delete** - ทำเครื่องหมายว่าข้อความถูก delete แต่เก็บไว้ใน database เป็น backup
	now := time.Now()
	isDeleted := true
	
	updateResult, err := s.collection.UpdateOne(ctx, 
		bson.M{"_id": messageID}, 
		bson.M{
			"$set": bson.M{
				"is_deleted": &isDeleted,
				"deleted_at": &now,
				"deleted_by": userID,
			},
		})
	if err != nil {
		log.Printf("[ChatService] Failed to soft delete message from database: %v", err)
		return fmt.Errorf("failed to unsend message: %w", err)
	}

	if updateResult.MatchedCount == 0 {
		return fmt.Errorf("message not found or already deleted")
	}

	log.Printf("[ChatService] Successfully soft deleted message %s from database (kept as backup)", messageID.Hex())

	// ลบข้อความจาก cache เพื่อไม่ให้แสดงใน UI
	if err := s.removeMessageFromCache(ctx, messageData.RoomID.Hex(), messageID.Hex()); err != nil {
		log.Printf("[ChatService] Failed to remove message from cache: %v", err)
	}

	// **สำคัญ**: ยังคงส่ง unsend event ไป WebSocket เพื่อให้ frontend ลบข้อความออกจาก UI
	if err := s.emitUnsendEvent(ctx, &messageData, userID); err != nil {
		log.Printf("[ChatService] Failed to emit unsend event: %v", err)
	} else {
		log.Printf("[ChatService] Successfully emitted unsend event for message %s", messageID.Hex())
	}

	// **FIXED: Update messageData with IsDeleted flag before sending to notification service**
	messageData.IsDeleted = &isDeleted
	messageData.DeletedAt = &now
	messageData.DeletedBy = &userID

	// Send notifications to offline users
	if s.notificationService != nil {
		// Get online users in this room
		onlineUsers := s.hub.GetOnlineUsersInRoom(messageData.RoomID.Hex())
		
		// Send notifications to offline users using the proper notification service
		s.notificationService.NotifyUsersInRoom(ctx, &messageData, onlineUsers)
	}

	return nil
}

// removeMessageFromCache ลบข้อความจาก Redis cache
func (s *ChatService) removeMessageFromCache(ctx context.Context, roomID, messageID string) error {
	// **FIXED: Simply clear the cache completely to force rebuild from database**
	// This ensures the cache only contains non-unsent messages from the database
	if err := s.cache.DeleteRoomMessages(ctx, roomID); err != nil {
		return fmt.Errorf("failed to clear cache: %w", err)
	}

	log.Printf("[ChatService] Successfully cleared cache for room %s after unsending message %s", roomID, messageID)
	return nil
}

// emitUnsendEvent ส่ง unsend event ไป WebSocket และเฉพาะ notification topic (ไม่ส่งไป room topic อีก)
func (s *ChatService) emitUnsendEvent(ctx context.Context, messageData *model.ChatMessage, userID primitive.ObjectID) error {
	// ดึงข้อมูล user
	user, err := s.GetUserById(ctx, userID.Hex())
	if err != nil {
		log.Printf("[ChatService] Failed to get user info for unsend event: %v", err)
		return err
	}

	// ดึงข้อมูล room เพื่อให้ได้ name เต็ม
	roomCollection := s.collection.Database().Collection("rooms")
	var room struct {
		ID    primitive.ObjectID    `bson:"_id"`
		Name  map[string]string     `bson:"name"`
		Image string                `bson:"image"`
	}
	
	err = roomCollection.FindOne(ctx, bson.M{"_id": messageData.RoomID}).Decode(&room)
	if err != nil {
		log.Printf("[ChatService] Failed to get room info for unsend event: %v", err)
		return err
	}

	// สร้าง payload แบบเดียวกับ message ปกติ
	payload := map[string]interface{}{
		
		"room": map[string]interface{}{
			"_id":   room.ID.Hex(),
			"image": room.Image,
			"name": map[string]interface{}{
				"en": room.Name["en"],
				"th": room.Name["th"],
			},
		},
		"user": map[string]interface{}{
			"_id":       user.ID.Hex(),
			"name": map[string]interface{}{
				"first":  user.Name.First,
				"last":   user.Name.Last,
				"middle": user.Name.Middle,
			},
			"username": user.Username,
		},
		"message": map[string]interface{}{
			"_id":       messageData.ID.Hex(),
			"message":   user.Username + " has unsent the message",
			"type":      "unsend_message", // FIXED: Use MessageTypeUnsend constant
			"timestamp": time.Now(),
		},
		"timestamp": time.Now(),
	}

	// สร้าง event สำหรับ WebSocket
	event := model.Event{
		Type: "unsend_message", // FIXED: Use MessageTypeUnsend constant
		Payload:   payload,
		Timestamp: time.Now(),
	}

	// Marshal event เป็น JSON สำหรับ WebSocket
	eventData, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal unsend event: %w", err)
	}

	// ส่ง event ไป WebSocket ใน room นี้
	s.hub.BroadcastToRoom(messageData.RoomID.Hex(), eventData)

	// --- ส่ง delete event ไปที่ chat-room-<roomId> topic เพื่อแจ้งให้ frontend ลบข้อความออกจาก UI ---
	deleteEvent := model.Event{
		Type: "unsend",
		Payload: struct {
			MessageID string         `json:"messageId"`
			User      model.UserInfo `json:"user"`
			Message   string         `json:"message"`
			Timestamp time.Time      `json:"timestamp"`
		}{
			MessageID: messageData.ID.Hex(),
			User: model.UserInfo{
				ID:       user.ID.Hex(),
				Username: user.Username,
				Name: map[string]interface{}{
					"first":  user.Name.First,
					"middle": user.Name.Middle,
					"last":   user.Name.Last,
				},
			},
			Message:   user.Username + " has unsent the message",
			Timestamp: time.Now(),
		},
		Timestamp: time.Now(),
	}
	roomTopic := "chat-room-" + messageData.RoomID.Hex()
	if err := s.kafkaBus.Emit(ctx, roomTopic, messageData.RoomID.Hex(), deleteEvent); err != nil {
		log.Printf("[ChatService] Failed to emit message_deleted event to Kafka: %v", err)
	} else {
		log.Printf("[ChatService] Successfully emitted message_deleted event to Kafka")
	}

	return nil
}