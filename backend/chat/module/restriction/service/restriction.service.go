package service

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	restrictionModel "chat/module/restriction/model"
	"chat/pkg/database/queries"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type (
	RestrictionService struct {
		*queries.BaseService[restrictionModel.UserRestriction]
		mongo *mongo.Database
		chatService ChatRestrictionService
	}

	ChatRestrictionService interface {
		SendMessage(ctx context.Context, msg *model.ChatMessage) error
		GetHub() *utils.Hub
	}

	RestrictionBroadcastType string
)

const (
	BroadcastToTarget = "target"  // ส่งไปยังผู้ที่ถูกลงโทษเฉพาะ
	BroadcastToRoom   = "room"    // ส่งไปยังคนอื่นในห้อง
)

func NewRestrictionService(db *mongo.Database, chatService ChatRestrictionService) *RestrictionService {
	collection := db.Collection("user-restrictions")
	return &RestrictionService{
		BaseService: queries.NewBaseService[restrictionModel.UserRestriction](collection),
		mongo:       db,
		chatService: chatService,
	}
}

// BanUser บัน user ในห้อง
func (s *RestrictionService) BanUser(ctx context.Context, userID, roomID, moderatorID primitive.ObjectID, duration string, endTime *time.Time, reason string) (*restrictionModel.UserRestriction, error) {
	log.Printf("[ModerationService] Banning user %s in room %s by moderator %s", userID.Hex(), roomID.Hex(), moderatorID.Hex())

	// ตรวจสอบว่า user ถูก ban อยู่แล้วหรือไม่
	existingBan, err := s.GetActiveBan(ctx, userID, roomID)
	if err == nil && existingBan != nil {
		return nil, fmt.Errorf("user is already banned in this room")
	}

	// สร้าง ban record
	banRecord := &restrictionModel.UserRestriction{
		RoomID:      roomID,
		UserID:      userID,
		ModeratorID: moderatorID,
		Type:        restrictionModel.RestrictionTypeBan,
		Duration:    duration,
		StartTime:   time.Now(),
		EndTime:     endTime,
		Reason:      reason,
		Status:      "active",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// บันทึกลงฐานข้อมูล
	result, err := s.Create(ctx, *banRecord)
	if err != nil {
		return nil, fmt.Errorf("failed to create ban record: %w", err)
	}

	banRecord.ID = result.Data[0].ID
	log.Printf("[ModerationService] Successfully banned user %s for %s", userID.Hex(), duration)

	// **NEW: Broadcast moderation action**
	if err := s.broadcastRestrictionAction(ctx, "ban", userID, roomID, moderatorID, reason, endTime, ""); err != nil {
		log.Printf("[ERROR] Failed to broadcast ban action: %v", err)
	}

	return banRecord, nil
}

// MuteUser mute user ในห้อง
func (s *RestrictionService) MuteUser(ctx context.Context, userID, roomID, moderatorID primitive.ObjectID, duration string, endTime *time.Time, restriction, reason string) (*restrictionModel.UserRestriction, error) {
	log.Printf("[ModerationService] Muting user %s in room %s by moderator %s", userID.Hex(), roomID.Hex(), moderatorID.Hex())

	// ตรวจสอบว่า user ถูก mute อยู่แล้วหรือไม่
	existingMute, err := s.GetActiveMute(ctx, userID, roomID)
	if err == nil && existingMute != nil {
		return nil, fmt.Errorf("user is already muted in this room")
	}

	// สร้าง mute record
	muteRecord := &restrictionModel.UserRestriction{
		RoomID:      roomID,
		UserID:      userID,
		ModeratorID: moderatorID,
		Type:        restrictionModel.RestrictionTypeMute,
		Duration:    duration,
		StartTime:   time.Now(),
		EndTime:     endTime,
		Restriction: restriction,
		Reason:      reason,
		Status:      "active",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// บันทึกลงฐานข้อมูล
	result, err := s.Create(ctx, *muteRecord)
	if err != nil {
		return nil, fmt.Errorf("failed to create mute record: %w", err)
	}

	muteRecord.ID = result.Data[0].ID
	log.Printf("[ModerationService] Successfully muted user %s for %s", userID.Hex(), duration)

	// **NEW: Broadcast moderation action**
	if err := s.broadcastRestrictionAction(ctx, "mute", userID, roomID, moderatorID, reason, endTime, restriction); err != nil {
		log.Printf("[ERROR] Failed to broadcast mute action: %v", err)
	}

	return muteRecord, nil
}

// KickUser kick user ออกจากห้อง
func (s *RestrictionService) KickUser(ctx context.Context, userID, roomID, moderatorID primitive.ObjectID, reason string) (*restrictionModel.UserRestriction, error) {
	log.Printf("[ModerationService] Kicking user %s from room %s by moderator %s", userID.Hex(), roomID.Hex(), moderatorID.Hex())

	// สร้าง kick record
	kickRecord := &restrictionModel.UserRestriction{
		RoomID:      roomID,
		UserID:      userID,
		ModeratorID: moderatorID,
		Type:        restrictionModel.RestrictionTypeKick,
		Duration:    "instant", // kick เป็นการกระทำชั่วขณะ
		StartTime:   time.Now(),
		Reason:      reason,
		Status:      "active",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// บันทึกลงฐานข้อมูล
	result, err := s.Create(ctx, *kickRecord)
	if err != nil {
		return nil, fmt.Errorf("failed to create kick record: %w", err)
	}

	kickRecord.ID = result.Data[0].ID
	log.Printf("[ModerationService] Successfully kicked user %s from room", userID.Hex())

	// **NEW: Broadcast moderation action**
	if err := s.broadcastRestrictionAction(ctx, "kick", userID, roomID, moderatorID, reason, nil, ""); err != nil {
		log.Printf("[ERROR] Failed to broadcast kick action: %v", err)
	}

	return kickRecord, nil
}

// UnbanUser ยกเลิก ban user
func (s *RestrictionService) UnbanUser(ctx context.Context, userID, roomID, moderatorID primitive.ObjectID) error {
	log.Printf("[ModerationService] Unbanning user %s in room %s by moderator %s", userID.Hex(), roomID.Hex(), moderatorID.Hex())

	// หา active ban record
	activeBan, err := s.GetActiveBan(ctx, userID, roomID)
	if err != nil {
		return fmt.Errorf("failed to find active ban: %w", err)
	}
	if activeBan == nil {
		return fmt.Errorf("user is not currently banned in this room")
	}

	// อัปเดต status เป็น revoked
	now := time.Now()
	filter := bson.M{"_id": activeBan.ID}
	update := bson.M{
		"$set": bson.M{
			"status":     "revoked",
			"revoked_at": now,
			"revoked_by": moderatorID,
			"updated_at": now,
		},
	}

	collection := s.mongo.Collection("user-moderations")
	_, err = collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to revoke ban: %w", err)
	}

	// **NEW: Broadcast moderation action**
	if err := s.broadcastRestrictionAction(ctx, "unban", userID, roomID, moderatorID, "Ban revoked", nil, ""); err != nil {
		log.Printf("[ERROR] Failed to broadcast unban action: %v", err)
	}

	log.Printf("[ModerationService] Successfully unbanned user %s", userID.Hex())
	return nil
}

// UnmuteUser ยกเลิก mute user
func (s *RestrictionService) UnmuteUser(ctx context.Context, userID, roomID, moderatorID primitive.ObjectID) error {
	log.Printf("[ModerationService] Unmuting user %s in room %s by moderator %s", userID.Hex(), roomID.Hex(), moderatorID.Hex())

	// หา active mute record
	activeMute, err := s.GetActiveMute(ctx, userID, roomID)
	if err != nil {
		return fmt.Errorf("failed to find active mute: %w", err)
	}
	if activeMute == nil {
		return fmt.Errorf("user is not currently muted in this room")
	}

	// อัปเดต status เป็น revoked
	now := time.Now()
	filter := bson.M{"_id": activeMute.ID}
	update := bson.M{
		"$set": bson.M{
			"status":     "revoked",
			"revoked_at": now,
			"revoked_by": moderatorID,
			"updated_at": now,
		},
	}

	collection := s.mongo.Collection("user-moderations")
	_, err = collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to revoke mute: %w", err)
	}

	// **NEW: Broadcast moderation action**
	if err := s.broadcastRestrictionAction(ctx, "unmute", userID, roomID, moderatorID, "Mute revoked", nil, ""); err != nil {
		log.Printf("[ERROR] Failed to broadcast unmute action: %v", err)
	}

	log.Printf("[ModerationService] Successfully unmuted user %s", userID.Hex())
	return nil
}

// GetUserModerationStatus ตรวจสอบสถานะการลงโทษของ user ในห้อง
func (s *RestrictionService) GetUserRestrictionStatus(ctx context.Context, userID, roomID primitive.ObjectID) (*restrictionModel.RestrictionStatus, error) {
	status := &restrictionModel.RestrictionStatus{
		UserID: userID.Hex(),
		RoomID: roomID.Hex(),
	}

	// ตรวจสอบ ban status
	activeBan, err := s.GetActiveBan(ctx, userID, roomID)
	if err == nil && activeBan != nil && activeBan.IsActive() {
		status.IsBanned = true
		status.BanExpiry = activeBan.EndTime
	}

	// ตรวจสอบ mute status
	activeMute, err := s.GetActiveMute(ctx, userID, roomID)
	if err == nil && activeMute != nil && activeMute.IsActive() {
		status.IsMuted = true
		status.MuteExpiry = activeMute.EndTime
		status.Restriction = activeMute.Restriction
	}

	return status, nil
}

// GetActiveBan หา active ban record
func (s *RestrictionService) GetActiveBan(ctx context.Context, userID, roomID primitive.ObjectID) (*restrictionModel.UserRestriction, error) {
	filter := bson.M{
		"user_id": userID,
		"room_id": roomID,
		"type":    restrictionModel.RestrictionTypeBan,
		"status":  "active",
	}

	result, err := s.FindOne(ctx, filter)
	if err != nil {
		return nil, err
	}

	if len(result.Data) == 0 {
		return nil, nil
	}

	ban := &result.Data[0]
	
	// ตรวจสอบว่าหมดอายุแล้วหรือไม่
	if ban.IsExpired() {
		// อัปเดตสถานะเป็น expired
		s.markAsExpired(ctx, ban.ID)
		return nil, nil
	}

	return ban, nil
}

// GetActiveMute หา active mute record
func (s *RestrictionService) GetActiveMute(ctx context.Context, userID, roomID primitive.ObjectID) (*restrictionModel.UserRestriction, error) {
	filter := bson.M{
		"user_id": userID,
		"room_id": roomID,
		"type":    restrictionModel.RestrictionTypeMute,
		"status":  "active",
	}

	result, err := s.FindOne(ctx, filter)
	if err != nil {
		return nil, err
	}

	if len(result.Data) == 0 {
		return nil, nil
	}

	mute := &result.Data[0]
	
	// ตรวจสอบว่าหมดอายุแล้วหรือไม่
	if mute.IsExpired() {
		// อัปเดตสถานะเป็น expired
		s.markAsExpired(ctx, mute.ID)
		return nil, nil
	}

	return mute, nil
}

// GetModerationHistory ดูประวัติการลงโทษ
func (s *RestrictionService) GetModerationHistory(ctx context.Context, opts queries.QueryOptions) (*queries.Response[restrictionModel.UserRestriction], error) {
	// ใช้ populate เพื่อดึงข้อมูล user, moderator, และ room
	return s.FindAllWithPopulate(ctx, opts, "user_id", "users")
}

// CleanupExpiredModerations ทำความสะอาด moderation records ที่หมดอายุ
func (s *RestrictionService) CleanupExpiredModerations(ctx context.Context) error {
	log.Printf("[ModerationService] Starting cleanup of expired moderations")

	now := time.Now()
	filter := bson.M{
		"status": "active",
		"duration": restrictionModel.DurationTemporary,
		"end_time": bson.M{"$lt": now},
	}

	update := bson.M{
		"$set": bson.M{
			"status":     "expired",
			"updated_at": now,
		},
	}

	collection := s.mongo.Collection("user-moderations")
	result, err := collection.UpdateMany(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to cleanup expired moderations: %w", err)
	}

	log.Printf("[ModerationService] Cleaned up %d expired moderation records", result.ModifiedCount)
	return nil
}

// markAsExpired อัปเดตสถานะเป็น expired
func (s *RestrictionService) markAsExpired(ctx context.Context, moderationID primitive.ObjectID) {
	filter := bson.M{"_id": moderationID}
	update := bson.M{
		"$set": bson.M{
			"status":     "expired",
			"updated_at": time.Now(),
		},
	}

	collection := s.mongo.Collection("user-moderations")
	_, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Printf("[ModerationService] Failed to mark moderation %s as expired: %v", moderationID.Hex(), err)
	}
}

// IsUserBanned ตรวจสอบว่า user ถูก ban หรือไม่
func (s *RestrictionService) IsUserBanned(ctx context.Context, userID, roomID primitive.ObjectID) bool {
	activeBan, err := s.GetActiveBan(ctx, userID, roomID)
	return err == nil && activeBan != nil && activeBan.IsActive()
}

// IsUserMuted ตรวจสอบว่า user ถูก mute หรือไม่
func (s *RestrictionService) IsUserMuted(ctx context.Context, userID, roomID primitive.ObjectID) bool {
	activeMute, err := s.GetActiveMute(ctx, userID, roomID)
	return err == nil && activeMute != nil && activeMute.IsActive()
}

// CanUserSendMessages ตรวจสอบว่า user สามารถส่งข้อความได้หรือไม่
func (s *RestrictionService) CanUserSendMessages(ctx context.Context, userID, roomID primitive.ObjectID) bool {
	return !s.IsUserBanned(ctx, userID, roomID) && !s.IsUserMuted(ctx, userID, roomID)
}

// CanUserViewMessages ตรวจสอบว่า user สามารถดูข้อความได้หรือไม่
func (s *RestrictionService) CanUserViewMessages(ctx context.Context, userID, roomID primitive.ObjectID) bool {
	// ถ้าถูก ban ดูไม่ได้เลย
	if s.IsUserBanned(ctx, userID, roomID) {
		return false
	}

	// ถ้าถูก mute ให้ตรวจสอบ restriction
	activeMute, err := s.GetActiveMute(ctx, userID, roomID)
	if err == nil && activeMute != nil && activeMute.IsActive() {
		return activeMute.Restriction != restrictionModel.MuteRestrictionCannotView
	}

	return true
}

// **NEW: Broadcast และ Kafka Integration Methods**

// broadcastModerationAction ส่ง moderation event ไปยัง room และเก็บใน database
func (s *RestrictionService) broadcastRestrictionAction(ctx context.Context, action string, userID, roomID, moderatorID primitive.ObjectID, reason string, endTime *time.Time, restriction string) error {
	log.Printf("[MODERATION] Broadcasting %s action for user %s in room %s", action, userID.Hex(), roomID.Hex())

	// 1. เก็บ moderation message ใน database (ผ่าน Kafka)
	if err := s.saveRestrictionMessage(ctx, action, userID, roomID, moderatorID, reason, endTime, restriction); err != nil {
		log.Printf("[ERROR] Failed to save moderation message: %v", err)
		// ไม่ return error เพราะ moderation action สำเร็จแล้ว
	}

	// 2. Broadcast ไปยังผู้ที่ถูกลงโทษเฉพาะ (สำหรับ frontend condition)
	s.broadcastToTarget(userID, roomID, action, moderatorID, reason, endTime, restriction)

	// 3. Broadcast ไปยังคนอื่นในห้อง (แจ้งว่ามีการลงโทษเกิดขึ้น)
	s.broadcastToRoomMembers(roomID, action, userID, moderatorID, reason, endTime, restriction)

	return nil
}

// generateModerationMessage สร้างข้อความสำหรับ moderation actions
func (s *RestrictionService) generateRestrictionMessage(action, reason string) string {
	switch action {
	case "ban":
		return fmt.Sprintf("🚫 User has been banned. Reason: %s", reason)
	case "mute":
		return fmt.Sprintf("🔇 User has been muted. Reason: %s", reason)
	case "kick":
		return fmt.Sprintf("👢 User has been kicked. Reason: %s", reason)
	case "unban":
		return "✅ User has been unbanned"
	case "unmute":
		return "✅ User has been unmuted"
	default:
		return fmt.Sprintf("ℹ️ Moderation action: %s. Reason: %s", action, reason)
	}
}

// getDurationString แปลง endTime เป็น duration string
func (s *RestrictionService) getDurationString(endTime *time.Time) string {
	if endTime == nil {
		return "permanent"
	}
	return "temporary"
}

// generateUserModerationMessage สร้างข้อความสำหรับผู้ที่ถูกลงโทษ
func (s *RestrictionService) generateUserRestrictionMessage(action, reason string, endTime *time.Time) string {
	var timeStr string
	if endTime != nil {
		timeStr = fmt.Sprintf(" until %s", endTime.Format("2006-01-02 15:04:05"))
	} else {
		timeStr = " permanently"
	}

	switch action {
	case "ban":
		return fmt.Sprintf("You have been banned from this room%s. Reason: %s", timeStr, reason)
	case "mute":
		return fmt.Sprintf("You have been muted in this room%s. Reason: %s", timeStr, reason)
	case "kick":
		return fmt.Sprintf("You have been kicked from this room. Reason: %s", reason)
	case "unban":
		return "Your ban has been lifted. You can now access this room again."
	case "unmute":
		return "Your mute has been lifted. You can now send messages again."
	default:
		return fmt.Sprintf("Moderation action: %s. Reason: %s", action, reason)
	}
}

// generateRoomAnnouncementMessage สร้างข้อความประกาศสำหรับคนอื่นในห้อง
func (s *RestrictionService) generateRoomAnnouncementMessage(action, reason string) string {
	switch action {
	case "ban":
		return fmt.Sprintf("A user has been banned from this room. Reason: %s", reason)
	case "mute":
		return fmt.Sprintf("A user has been muted in this room. Reason: %s", reason)
	case "kick":
		return fmt.Sprintf("A user has been kicked from this room. Reason: %s", reason)
	case "unban":
		return "A user's ban has been lifted."
	case "unmute":
		return "A user's mute has been lifted."
	default:
		return fmt.Sprintf("Moderation action occurred: %s", action)
	}
}

// saveModerationMessage เก็บ moderation message ใน database ผ่าน Kafka
func (s *RestrictionService) saveRestrictionMessage(ctx context.Context, action string, userID, roomID, moderatorID primitive.ObjectID, reason string, endTime *time.Time, restriction string) error {
	// สร้าง moderation message สำหรับเก็บใน database
	moderationMsg := &model.ChatMessage{
		RoomID:    roomID,
		UserID:    moderatorID, // ผู้ส่งคือ moderator
		Message:   s.generateRestrictionMessage(action, reason),
		Timestamp: time.Now(),
		ModerationInfo: &model.ModerationMessageInfo{
			Action:       action,
			TargetUserID: userID,
			ModeratorID:  moderatorID,
			Reason:       reason,
			Duration:     s.getDurationString(endTime),
			EndTime:      endTime,
			Restriction:  restriction,
		},
	}

	// เก็บ moderation message ใน database (ผ่าน Kafka topics)
	if err := s.chatService.SendMessage(ctx, moderationMsg); err != nil {
		return fmt.Errorf("failed to save moderation message: %w", err)
	}

	log.Printf("[MODERATION] Saved %s message to database for user %s", action, userID.Hex())
	return nil
}

// broadcastToTarget ส่ง direct message ไปยังผู้ที่ถูกลงโทษเฉพาะ
func (s *RestrictionService) broadcastToTarget(userID, roomID primitive.ObjectID, action string, moderatorID primitive.ObjectID, reason string, endTime *time.Time, restriction string) {
	// สร้าง targeted moderation payload สำหรับ frontend condition
	payload := map[string]interface{}{
		"type":      "moderation_targeted",
		"action":    action,
		"broadcast": "target",
		"data": map[string]interface{}{
			"targetUserId":  userID.Hex(),
			"roomId":        roomID.Hex(),
			"moderatorId":   moderatorID.Hex(),
			"reason":        reason,
			"endTime":       endTime,
			"restriction":   restriction,
			"timestamp":     time.Now(),
			"message":       s.generateUserRestrictionMessage(action, reason, endTime),
		},
	}

	// แปลงเป็น JSON และส่งไปยัง target user เฉพาะ
	if data, err := json.Marshal(payload); err == nil {
		s.chatService.GetHub().BroadcastToUser(userID.Hex(), data)
		log.Printf("[MODERATION] Sent targeted %s notification to user %s", action, userID.Hex())
	} else {
		log.Printf("[ERROR] Failed to marshal targeted moderation broadcast: %v", err)
	}
}

// broadcastToRoomMembers ส่งข้อความแจ้งเตือนไปยังคนอื่นในห้อง
func (s *RestrictionService) broadcastToRoomMembers(roomID primitive.ObjectID, action string, userID, moderatorID primitive.ObjectID, reason string, endTime *time.Time, restriction string) {
	// สร้าง room announcement payload
	payload := map[string]interface{}{
		"type":      "moderation_announcement",
		"action":    action,
		"broadcast": "room",
		"data": map[string]interface{}{
			"targetUserId":  userID.Hex(),
			"roomId":        roomID.Hex(),
			"moderatorId":   moderatorID.Hex(),
			"reason":        reason,
			"endTime":       endTime,
			"restriction":   restriction,
			"timestamp":     time.Now(),
			"announcement":  s.generateRoomAnnouncementMessage(action, reason),
		},
	}

	// แปลงเป็น JSON และ broadcast ไปยังทุกคนในห้อง (ยกเว้น target user)
	if data, err := json.Marshal(payload); err == nil {
		s.chatService.GetHub().BroadcastToRoomExcept(roomID.Hex(), userID.Hex(), data)
		log.Printf("[MODERATION] Broadcasted %s announcement to room %s (excluding target user)", action, roomID.Hex())
	} else {
		log.Printf("[ERROR] Failed to marshal room moderation broadcast: %v", err)
	}
} 