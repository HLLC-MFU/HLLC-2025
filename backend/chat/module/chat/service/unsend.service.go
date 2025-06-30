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

// UnsendMessage ลบข้อความที่ส่งแล้ว (เฉพาะเจ้าของข้อความเท่านั้น)
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

	// ตรวจสอบว่า user เป็นเจ้าของข้อความหรือไม่
	if messageData.UserID != userID {
		log.Printf("[ChatService] User %s is not the owner of message %s (owner: %s)", 
			userID.Hex(), messageID.Hex(), messageData.UserID.Hex())
		return fmt.Errorf("you can only unsend your own messages")
	}

	// **Hard Delete** - ลบข้อความออกจาก database โดยสมบูรณ์
	deleteResult, err := s.collection.DeleteOne(ctx, bson.M{"_id": messageID})
	if err != nil {
		log.Printf("[ChatService] Failed to delete message from database: %v", err)
		return fmt.Errorf("failed to delete message: %w", err)
	}

	if deleteResult.DeletedCount == 0 {
		return fmt.Errorf("message not found or already deleted")
	}

	log.Printf("[ChatService] Successfully deleted message %s from database", messageID.Hex())

	// ลบข้อความจาก cache
	if err := s.removeMessageFromCache(ctx, messageData.RoomID.Hex(), messageID.Hex()); err != nil {
		log.Printf("[ChatService] Failed to remove message from cache: %v", err)
	}

	// ลบ reactions ที่เกี่ยวข้องกับข้อความนี้
	if err := s.deleteMessageReactions(ctx, messageID); err != nil {
		log.Printf("[ChatService] Failed to delete message reactions: %v", err)
	}

	// Emit unsend event ไป WebSocket เพื่อให้ frontend ลบข้อความ
	if err := s.emitUnsendEvent(ctx, &messageData, userID); err != nil {
		log.Printf("[ChatService] Failed to emit unsend event: %v", err)
	} else {
		log.Printf("[ChatService] Successfully emitted unsend event for message %s", messageID.Hex())
	}

	return nil
}

// removeMessageFromCache ลบข้อความจาก Redis cache
func (s *ChatService) removeMessageFromCache(ctx context.Context, roomID, messageID string) error {
	// ดึงข้อความทั้งหมดจาก cache
	messages, err := s.cache.GetRoomMessages(ctx, roomID, 1000) // ดึงจำนวนมากเพื่อหาข้อความที่ต้องลบ
	if err != nil {
		return fmt.Errorf("failed to get cached messages: %w", err)
	}

	// กรองข้อความที่ไม่ใช่ข้อความที่ต้องลบ
	var filteredMessages []model.ChatMessageEnriched
	for _, msg := range messages {
		if msg.ChatMessage.ID.Hex() != messageID {
			filteredMessages = append(filteredMessages, msg)
		}
	}

	// ลบ cache ทั้งหมดแล้วเซฟใหม่
	if err := s.cache.DeleteRoomMessages(ctx, roomID); err != nil {
		return fmt.Errorf("failed to clear cache: %w", err)
	}

	// เซฟข้อความที่เหลือกลับเข้า cache
	for _, msg := range filteredMessages {
		if err := s.cache.SaveMessage(ctx, roomID, &msg); err != nil {
			log.Printf("[ChatService] Failed to re-cache message %s: %v", msg.ChatMessage.ID.Hex(), err)
		}
	}

	log.Printf("[ChatService] Successfully removed message %s from cache", messageID)
	return nil
}

// deleteMessageReactions ลบ reactions ทั้งหมดที่เกี่ยวข้องกับข้อความนี้
func (s *ChatService) deleteMessageReactions(ctx context.Context, messageID primitive.ObjectID) error {
	reactionCollection := s.mongo.Collection("message-reactions")
	
	deleteResult, err := reactionCollection.DeleteMany(ctx, bson.M{"message_id": messageID})
	if err != nil {
		return fmt.Errorf("failed to delete reactions: %w", err)
	}

	log.Printf("[ChatService] Deleted %d reactions for message %s", deleteResult.DeletedCount, messageID.Hex())
	return nil
}

// emitUnsendEvent ส่ง unsend event ไป WebSocket
func (s *ChatService) emitUnsendEvent(ctx context.Context, messageData *model.ChatMessage, userID primitive.ObjectID) error {
	// ดึงข้อมูล user
	user, err := s.GetUserById(ctx, userID.Hex())
	if err != nil {
		log.Printf("[ChatService] Failed to get user info for unsend event: %v", err)
		return err
	}

	// สร้าง payload สำหรับ unsend event
	payload := model.ChatUnsendPayload{
		Room: model.RoomInfo{
			ID: messageData.RoomID.Hex(),
		},
		User: model.UserInfo{
			ID:       user.ID.Hex(),
			Username: user.Username,
			Name: map[string]interface{}{
				"first":  user.Name.First,
				"middle": user.Name.Middle,
				"last":   user.Name.Last,
			},
		},
		MessageID:   messageData.ID.Hex(),
		MessageType: s.getMessageType(messageData),
		Timestamp:   time.Now(),
	}

	// สร้าง event
	event := model.Event{
		Type:      model.EventTypeUnsendMessage,
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

	// **เซฟ unsend event ไป Kafka (สำหรับ audit log) - ใช้ EmitMessage แทน**
	if err := s.emitter.EmitMessage(ctx, messageData); err != nil {
		log.Printf("[ChatService] Failed to emit unsend event to Kafka: %v", err)
	}

	return nil
}

// getMessageType กำหนดประเภทของข้อความ
func (s *ChatService) getMessageType(msg *model.ChatMessage) string {
	if msg.StickerID != nil {
		return model.MessageTypeSticker
	} else if msg.ReplyToID != nil {
		return model.MessageTypeReply
	} else if len(msg.MentionInfo) > 0 {
		return model.MessageTypeMention
	} else if msg.EvoucherID != nil {
		return model.MessageTypeEvoucher
	}
	return model.MessageTypeText
} 