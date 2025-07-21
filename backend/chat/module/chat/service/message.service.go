package service

import (
	"chat/module/chat/model"
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CanUserSendMessages checks if a user can send messages in a room
func (s *ChatService) CanUserSendMessages(ctx context.Context, userID, roomID primitive.ObjectID) bool {
	// Check if user is banned or muted
	if s.restrictionService.IsUserBanned(ctx, userID, roomID) || s.restrictionService.IsUserMuted(ctx, userID, roomID) {
		return false
	}
	return true
}

// CanUserViewMessages checks if a user can view messages in a room
func (s *ChatService) CanUserViewMessages(ctx context.Context, userID, roomID primitive.ObjectID) bool {
	// Check if user is banned (muted users can still view)
	if s.restrictionService.IsUserBanned(ctx, userID, roomID) {
		return false
	}
	return true
}

// **ENHANCED: SendMessage with robust error handling and phantom prevention**

// Optimize ให้ Support SendMsg ให้ handling phantom message (ข้อความผี = ไม่ได้ save ลงใน DB)
func (s *ChatService) SendMessage(ctx context.Context, msg *model.ChatMessage, metadata interface{}) error {
	log.Printf("[ChatService] SendMessage called for room %s by user %s", msg.RoomID.Hex(), msg.UserID.Hex())
	if !isValidChatMessage(msg) {
		return fmt.Errorf("invalid message: empty or unsupported content")
	}
	// ตรวจสอบ moderation status ก่อนส่งข้อความ
	if !s.CanUserSendMessages(ctx, msg.UserID, msg.RoomID) {
		// ตรวจสอบว่าถูก ban หรือ mute
		if s.restrictionService.IsUserBanned(ctx, msg.UserID, msg.RoomID) {
			return fmt.Errorf("user is banned from this room")
		}
		if s.restrictionService.IsUserMuted(ctx, msg.UserID, msg.RoomID) {
			return fmt.Errorf("user is muted in this room")
		}
		return fmt.Errorf("user cannot send messages in this room")
	}

	// Foreign key validation (ใช้ cache ถ้าเป็นไปได้)
	if err := s.fkValidator.ValidateForeignKeys(ctx, map[string]interface{}{
		"users": msg.UserID,
		"rooms": msg.RoomID,
	}); err != nil {
		return fmt.Errorf("foreign key validation failed: %w", err)
	}

	// สร้าง ID ก่อน (เพื่อ tracking)
	msg.ID = primitive.NewObjectID()
	log.Printf("[ChatService] Generated message ID: %s", msg.ID.Hex())

	// สร้าง tracking record ก่อน broadcast
	if err := s.createMessageStatus(msg.ID, msg.RoomID); err != nil {
		log.Printf("[ChatService] ⚠️ Failed to create message status tracking: %v", err)
		// Continue anyway - this is not critical for UX
	}

	// BROADCAST: ส่งไป WebSocket ทันที **สำคัญโครตพ่อโครตแม่**
	log.Printf("[ChatService] 🚀 Broadcasting message ID=%s immediately to WebSocket", msg.ID.Hex())
	broadcastStart := primitive.NewObjectID().Timestamp()

	// ถ้า error จะต้องลบ message ออกจาก cache ด้วย
	if err := s.emitter.EmitMessage(ctx, msg, metadata); err != nil {
		log.Printf("[ChatService] ❌ CRITICAL: Failed to emit message to WebSocket: %v", err)

		// Fallback ถ้า  message ส่งไม่ได้ จะต้องลบ message ออกจาก cache ด้วย
		s.updateMessageStatusWithError(msg.ID, fmt.Sprintf("broadcast failed: %v", err), 0)

		// This is critical - return error if we can't broadcast
		return fmt.Errorf("failed to broadcast message: %w", err)
	}

	// broadcast สำเร็จ จะต้องลบ message ออกจาก cache ด้วย
	broadcastDuration := primitive.NewObjectID().Timestamp().Sub(broadcastStart)
	log.Printf("[ChatService] ✅ WebSocket broadcast successful in %v for message ID=%s",
		broadcastDuration, msg.ID.Hex())

	// Async ทำงานแบบ pararel ด้วย อยู่ใน Background **สำคัญโครตพ่อโครตแม่**
	bgCtx := context.Background()

	// **ENHANCED: Submit jobs with better error handling**
	jobsSubmitted := 0 // จำนวน jobs ที่ส่งไป
	totalJobs := 3     // จำนวน jobs ที่ต้องส่งไป

	// Submit database save job (highest priority for persistence)

	// save ลงใน Database **สำคัญโครตพ่อโครตแม่**
	if s.SubmitDatabaseJob("save_message", msg, bgCtx) {
		jobsSubmitted++ // เพิ้ม job submit
		log.Printf("[ChatService] ✅ DB save job submitted for message %s", msg.ID.Hex())
	} else {
		log.Printf("[ChatService] ⚠️ CRITICAL: DB save job queue full for message %s", msg.ID.Hex())

		// Fallback กลับมา ถ้า ส่งไม่ได้ จะต้องลบ message ออกจาก cache ด้วย
		go func() {
			if _, err := s.Create(bgCtx, *msg); err != nil {
				log.Printf("[ChatService] ❌ FALLBACK: Direct DB save failed for message %s: %v",
					msg.ID.Hex(), err)
				s.updateMessageStatusWithError(msg.ID, "fallback db save failed", 0)
			} else {
				log.Printf("[ChatService] ✅ FALLBACK: Direct DB save successful for message %s",
					msg.ID.Hex())
				s.updateMessageStatus(msg.ID, "saved_to_db", true)
			}
		}()
	}

	// Save บวใน cache ด้วย (สำคัญ) ถ้าเกิดข้อผิดพลาดจะต้องลบ message ออกจาก cache ด้วย
	if s.SubmitDatabaseJob("cache_message", msg, bgCtx) {
		jobsSubmitted++
		log.Printf("[ChatService] ✅ Cache job submitted for message %s", msg.ID.Hex())
	} else {
		log.Printf("[ChatService] ⚠️ Cache job queue full for message %s", msg.ID.Hex())
	}

	//  ส่งการแจ้งเตือนไปยังผู้ใช้งานที่ออนไลน์ในห้อง (สำคัญกลาง)
	onlineUsers := s.hub.GetOnlineUsersInRoom(msg.RoomID.Hex())
	if s.SubmitNotificationJob(msg, onlineUsers, bgCtx) {
		jobsSubmitted++
		log.Printf("[ChatService] ✅ Notification job submitted for message %s (%d online users)",
			msg.ID.Hex(), len(onlineUsers))
	} else {
		log.Printf("[ChatService] ⚠️ Notification job queue full for message %s", msg.ID.Hex())
	}

	// ตรวจสอบว่า message ส่งเสร็จจริงไหม ถ้าไม่ได้ส่งเสร็จจริงไหม จะต้องลบ message ออกจาก cache ด้วย
	successRate := float64(jobsSubmitted) / float64(totalJobs) * 100
	log.Printf("[ChatService] 📊 Message %s processing: Broadcast=✅, Jobs=%d/%d (%.1f%% success)",
		msg.ID.Hex(), jobsSubmitted, totalJobs, successRate)

	// ตรวจสอบว่า rate ต่ำกว่่า 66 ไหม เตือนถ้า success rate ต่ำ
	if successRate < 66.0 { // น้อยกว่า 2/3 jobs submitted
		log.Printf("[ChatService] ⚠️ WARNING: Low job submission rate %.1f%% for message %s - system may be under high load",
			successRate, msg.ID.Hex())
	}

	// **SUCCESS: Message ส่งสำเร็จ (broadcast แล้ว, jobs queued)**
	log.Printf("[ChatService] ✅ Message %s processed successfully - UX immediate, background jobs queued",
		msg.ID.Hex())

	return nil
}
