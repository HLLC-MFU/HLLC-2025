package service

import (
	"chat/module/chat/utils"
	restrictionModel "chat/module/restriction/model"
	"chat/pkg/database/queries"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	notificationservice "chat/module/notification/service"

	"chat/pkg/core/kafka"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	restrictionUtils "chat/module/restriction/utils"
	userModel "chat/module/user/model"
)

type (
	RestrictionService struct {
		*queries.BaseService[restrictionModel.UserRestriction]
		mongo               *mongo.Database
		hub                 *utils.Hub
		emitter             *utils.ChatEventEmitter
		notificationService *notificationservice.NotificationService
		kafkaBus            *kafka.Bus
	}

	RestrictionBroadcastType string
)

const (
	BroadcastToTarget = "target" // ส่งไปยังผู้ที่ถูกลงโทษเฉพาะ
	BroadcastToRoom   = "room"   // ส่งไปยังคนอื่นในห้อง
)

func NewRestrictionService(db *mongo.Database, hub *utils.Hub, emitter *utils.ChatEventEmitter, notificationService *notificationservice.NotificationService, kafkaBus *kafka.Bus) *RestrictionService {
	collection := db.Collection("user-restrictions")
	return &RestrictionService{
		BaseService:         queries.NewBaseService[restrictionModel.UserRestriction](collection),
		mongo:               db,
		hub:                 hub,
		emitter:             emitter,
		notificationService: notificationService,
		kafkaBus:            kafkaBus,
	}
}

// BanUser บัน user ในห้อง
func (s *RestrictionService) BanUser(ctx context.Context, userID, roomID, restrictorID primitive.ObjectID, duration string, endTime *time.Time, reason string) (*restrictionModel.UserRestriction, error) {
	log.Printf("[ModerationService] Banning user %s in room %s by restrictor %s", userID.Hex(), roomID.Hex(), restrictorID.Hex())

	// ตรวจสอบว่า user ถูก ban อยู่แล้วหรือไม่
	existingBan, err := s.GetActiveBan(ctx, userID, roomID)
	if err == nil && existingBan != nil {
		return nil, fmt.Errorf("user is already banned in this room")
	}

	// สร้าง ban record
	banRecord := &restrictionModel.UserRestriction{
		RoomID:       roomID,
		UserID:       userID,
		RestrictorID: restrictorID,
		Type:         restrictionModel.RestrictionTypeBan,
		Duration:     duration,
		StartTime:    time.Now(),
		EndTime:      endTime,
		Reason:       reason,
		Status:       "active",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// บันทึกลงฐานข้อมูล
	result, err := s.Create(ctx, *banRecord)
	if err != nil {
		return nil, fmt.Errorf("failed to create ban record: %w", err)
	}
	banRecord.ID = result.Data[0].ID
	log.Printf("[ModerationService] Successfully banned user %s for %s", userID.Hex(), duration)

	// Emit and notify using helper
	err = restrictionUtils.EmitAndNotifyRestriction(ctx, s.emitter, s.notificationService, s.mongo, userID, roomID, restrictorID, banRecord, "ban", reason, duration, "", endTime)
	if err != nil {
		log.Printf("[ERROR] EmitAndNotifyRestriction: %v", err)
	}

	return banRecord, nil
}

func (s *RestrictionService) MuteUser(ctx context.Context, userID, roomID, restrictorID primitive.ObjectID, duration string, endTime *time.Time, restriction, reason string) (*restrictionModel.UserRestriction, error) {
	log.Printf("[ModerationService] Muting user %s in room %s by restrictor %s", userID.Hex(), roomID.Hex(), restrictorID.Hex())

	// ตรวจสอบว่า user ถูก mute อยู่แล้วหรือไม่
	existingMute, err := s.GetActiveMute(ctx, userID, roomID)
	if err == nil && existingMute != nil {
		return nil, fmt.Errorf("user is already muted in this room")
	}

	// สร้าง mute record
	muteRecord := &restrictionModel.UserRestriction{
		RoomID:       roomID,
		UserID:       userID,
		RestrictorID: restrictorID,
		Type:         restrictionModel.RestrictionTypeMute,
		Duration:     duration,
		StartTime:    time.Now(),
		EndTime:      endTime,
		Restriction:  restriction,
		Reason:       reason,
		Status:       "active",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// บันทึกลงฐานข้อมูล
	result, err := s.Create(ctx, *muteRecord)
	if err != nil {
		return nil, fmt.Errorf("failed to create mute record: %w", err)
	}
	muteRecord.ID = result.Data[0].ID
	log.Printf("[ModerationService] Successfully muted user %s for %s", userID.Hex(), duration)

	// Emit and notify using helper
	err = restrictionUtils.EmitAndNotifyRestriction(ctx, s.emitter, s.notificationService, s.mongo, userID, roomID, restrictorID, muteRecord, "mute", reason, duration, restriction, endTime)
	if err != nil {
		log.Printf("[ERROR] EmitAndNotifyRestriction: %v", err)
	}

	return muteRecord, nil
}

// UnbanUser ยกเลิก ban user
func (s *RestrictionService) UnbanUser(ctx context.Context, userID, roomID, restrictorID primitive.ObjectID) error {
	log.Printf("[ModerationService] Unbanning user %s in room %s by restrictor %s", userID.Hex(), roomID.Hex(), restrictorID.Hex())

	// หา active ban record
	activeBan, err := s.GetActiveBan(ctx, userID, roomID)
	if err != nil {
		log.Printf("[ModerationService] ERROR: Failed to find active ban: %v", err)
		return fmt.Errorf("failed to find active ban: %w", err)
	}
	if activeBan == nil {
		log.Printf("[ModerationService] WARNING: User %s is not currently banned in room %s", userID.Hex(), roomID.Hex())
		return fmt.Errorf("user is not currently banned in this room")
	}

	log.Printf("[ModerationService] Found active ban record: ID=%s, Status=%s", activeBan.ID.Hex(), activeBan.Status)

	// อัปเดต status เป็น revoked
	now := time.Now()
	filter := bson.M{"_id": activeBan.ID}
	update := bson.M{
		"$set": bson.M{
			"status":     "revoked",
			"revoked_at": now,
			"revoked_by": restrictorID,
			"updated_at": now,
		},
	}

	collection := s.mongo.Collection("user-restrictions")
	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Printf("[ModerationService] ERROR: Failed to revoke ban: %v", err)
		return fmt.Errorf("failed to revoke ban: %w", err)
	}

	log.Printf("[ModerationService] Successfully updated ban record: ModifiedCount=%d", result.ModifiedCount)
	activeBan.Status = "revoked"

	// **NEW: Re-add user to room if not already a member**
	roomCollection := s.mongo.Collection("rooms")
	// Check if user is already a member
	var room struct { Members []primitive.ObjectID `bson:"members"` }
	err = roomCollection.FindOne(ctx, bson.M{"_id": roomID}).Decode(&room)
	if err == nil {
		found := false
		for _, m := range room.Members {
			if m == userID {
				found = true
				break
			}
		}
		if !found {
			// Add user back to members array
			_, err := roomCollection.UpdateOne(ctx, bson.M{"_id": roomID}, bson.M{"$addToSet": bson.M{"members": userID}, "$set": bson.M{"updatedAt": now}})
			if err != nil {
				log.Printf("[ModerationService] Failed to re-add user %s to room %s after unban: %v", userID.Hex(), roomID.Hex(), err)
			} else {
				log.Printf("[ModerationService] Re-added user %s to room %s after unban", userID.Hex(), roomID.Hex())
			}
		} else {
			log.Printf("[ModerationService] User %s is already a member of room %s", userID.Hex(), roomID.Hex())
		}
	}

	// **DEBUG: Verify restriction status after unban**
	status, err := s.GetUserRestrictionStatus(ctx, userID, roomID)
	if err != nil {
		log.Printf("[ModerationService] ERROR: Failed to get restriction status after unban: %v", err)
	} else {
		log.Printf("[ModerationService] Restriction status after unban: IsBanned=%v, IsMuted=%v", status.IsBanned, status.IsMuted)
	}

	// Emit and notify using helper
	err = restrictionUtils.EmitAndNotifyRestriction(ctx, s.emitter, s.notificationService, s.mongo, userID, roomID, restrictorID, activeBan, "unban", "Ban revoked", "", "", nil)
	if err != nil {
		log.Printf("[ERROR] EmitAndNotifyRestriction: %v", err)
	}

	log.Printf("[ModerationService] ✅ Successfully unbanned user %s in room %s", userID.Hex(), roomID.Hex())
	return nil
}

// UnmuteUser ยกเลิก mute user
func (s *RestrictionService) UnmuteUser(ctx context.Context, userID, roomID, restrictorID primitive.ObjectID) error {
	log.Printf("[ModerationService] Unmuting user %s in room %s by restrictor %s", userID.Hex(), roomID.Hex(), restrictorID.Hex())

	// หา active mute record
	activeMute, err := s.GetActiveMute(ctx, userID, roomID)
	if err != nil {
		log.Printf("[ModerationService] ERROR: Failed to find active mute: %v", err)
		return fmt.Errorf("failed to find active mute: %w", err)
	}
	if activeMute == nil {
		log.Printf("[ModerationService] WARNING: User %s is not currently muted in room %s", userID.Hex(), roomID.Hex())
		return fmt.Errorf("user is not currently muted in this room")
	}

	log.Printf("[ModerationService] Found active mute record: ID=%s, Status=%s", activeMute.ID.Hex(), activeMute.Status)

	// อัปเดต status เป็น revoked
	now := time.Now()
	filter := bson.M{"_id": activeMute.ID}
	update := bson.M{
		"$set": bson.M{
			"status":     "revoked",
			"revoked_at": now,
			"revoked_by": restrictorID,
			"updated_at": now,
		},
	}

	collection := s.mongo.Collection("user-restrictions")
	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Printf("[ModerationService] ERROR: Failed to revoke mute: %v", err)
		return fmt.Errorf("failed to revoke mute: %w", err)
	}

	log.Printf("[ModerationService] Successfully updated mute record: ModifiedCount=%d", result.ModifiedCount)
	activeMute.Status = "revoked"

	// **NEW: Re-add user to room if not already a member**
	roomCollection := s.mongo.Collection("rooms")
	// Check if user is already a member
	var room struct { Members []primitive.ObjectID `bson:"members"` }
	err = roomCollection.FindOne(ctx, bson.M{"_id": roomID}).Decode(&room)
	if err == nil {
		found := false
		for _, m := range room.Members {
			if m == userID {
				found = true
				break
			}
		}
		if !found {
			// Add user back to members array
			_, err := roomCollection.UpdateOne(ctx, bson.M{"_id": roomID}, bson.M{"$addToSet": bson.M{"members": userID}, "$set": bson.M{"updatedAt": now}})
			if err != nil {
				log.Printf("[ModerationService] Failed to re-add user %s to room %s after unmute: %v", userID.Hex(), roomID.Hex(), err)
			} else {
				log.Printf("[ModerationService] Re-added user %s to room %s after unmute", userID.Hex(), roomID.Hex())
			}
		} else {
			log.Printf("[ModerationService] User %s is already a member of room %s", userID.Hex(), roomID.Hex())
		}
	}

	// **DEBUG: Verify restriction status after unmute**
	status, err := s.GetUserRestrictionStatus(ctx, userID, roomID)
	if err != nil {
		log.Printf("[ModerationService] ERROR: Failed to get restriction status after unmute: %v", err)
	} else {
		log.Printf("[ModerationService] Restriction status after unmute: IsBanned=%v, IsMuted=%v", status.IsBanned, status.IsMuted)
	}

	// Emit and notify using helper
	err = restrictionUtils.EmitAndNotifyRestriction(ctx, s.emitter, s.notificationService, s.mongo, userID, roomID, restrictorID, activeMute, "unmute", "Mute revoked", "", "", nil)
	if err != nil {
		log.Printf("[ERROR] EmitAndNotifyRestriction: %v", err)
	}

	log.Printf("[ModerationService] ✅ Successfully unmuted user %s in room %s", userID.Hex(), roomID.Hex())
	return nil
}

// KickUser kick user ออกจากห้อง
func (s *RestrictionService) KickUser(ctx context.Context, userID, roomID, restrictorID primitive.ObjectID, reason string) (*restrictionModel.UserRestriction, error) {
	log.Printf("[ModerationService] Kicking user %s from room %s by restrictor %s", userID.Hex(), roomID.Hex(), restrictorID.Hex())

	// **NEW: ลบ user ออกจากห้องก่อน**
	if err := s.removeUserFromRoom(ctx, userID, roomID); err != nil {
		log.Printf("[ModerationService] Warning: Failed to remove user from room: %v", err)
		// ไม่ return error เพราะยังต้องการสร้าง kick record
	}

	// สร้าง kick record
	kickRecord := &restrictionModel.UserRestriction{
		RoomID:       roomID,
		UserID:       userID,
		RestrictorID: restrictorID,
		Type:         restrictionModel.RestrictionTypeKick,
		Duration:     "instant",
		StartTime:    time.Now(),
		Reason:       reason,
		Status:       "active",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// บันทึกลงฐานข้อมูล
	result, err := s.Create(ctx, *kickRecord)
	if err != nil {
		return nil, fmt.Errorf("failed to create kick record: %w", err)
	}
	kickRecord.ID = result.Data[0].ID
	log.Printf("[ModerationService] Successfully kicked user %s from room", userID.Hex())

	// Emit and notify using helper
	err = restrictionUtils.EmitAndNotifyRestriction(ctx, s.emitter, s.notificationService, s.mongo, userID, roomID, restrictorID, kickRecord, "kick", reason, "instant", "", nil)
	if err != nil {
		log.Printf("[ERROR] EmitAndNotifyRestriction: %v", err)
	} else {
		log.Printf("[ModerationService] ✅ Restriction message emitted immediately ID=%s", kickRecord.ID.Hex())
	}

	return kickRecord, nil
}

// **NEW: removeUserFromRoom ลบ user ออกจากห้อง**
func (s *RestrictionService) removeUserFromRoom(ctx context.Context, userID, roomID primitive.ObjectID) error {
	log.Printf("[ModerationService] Removing user %s from room %s", userID.Hex(), roomID.Hex())

	// อัพเดทห้องใน database โดยลบ user ออกจาก members array
	collection := s.mongo.Collection("rooms")
	filter := bson.M{"_id": roomID}
	update := bson.M{
		"$pull": bson.M{"members": userID},
		"$set":  bson.M{"updatedAt": time.Now()},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to remove user from room: %w", err)
	}

	if result.ModifiedCount == 0 {
		return fmt.Errorf("user not found in room or room not found")
	}

	// **NEW: Disconnect user จาก WebSocket hub**
	if s.hub != nil {
		roomIDStr := roomID.Hex()
		userIDStr := userID.Hex()
		
		// ส่ง kick notification ไปยัง user
		kickEvent := map[string]interface{}{
			"type": "user_kicked",
			"data": map[string]interface{}{
				"roomId":  roomIDStr,
				"userId":  userIDStr,
				"message": "You have been kicked from this room",
				"timestamp": time.Now(),
			},
		}
		
		if eventBytes, err := json.Marshal(kickEvent); err == nil {
			// ส่ง event ไปยัง user ที่ถูก kick
			s.hub.BroadcastToUser(userIDStr, eventBytes)
			
			// ส่ง event ไปยังคนอื่นในห้อง
			s.hub.BroadcastToRoom(roomIDStr, eventBytes)
			
			log.Printf("[ModerationService] Sent kick notification to user %s and room %s", userIDStr, roomIDStr)
		} else {
			log.Printf("[ERROR] Failed to marshal kick event: %v", err)
		}
	}

	log.Printf("[ModerationService] Successfully removed user %s from room %s", userID.Hex(), roomID.Hex())
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
		"status":   "active",
		"duration": restrictionModel.DurationTemporary,
		"end_time": bson.M{"$lt": now},
	}

	update := bson.M{
		"$set": bson.M{
			"status":     "expired",
			"updated_at": now,
		},
	}

	collection := s.mongo.Collection("user-restrictions")
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

	collection := s.mongo.Collection("user-restrictions")
	_, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Printf("[ModerationService] Failed to mark moderation %s as expired: %v", moderationID.Hex(), err)
	}
}

// IsUserBanned ตรวจสอบว่า user ถูก ban หรือไม่
func (s *RestrictionService) IsUserBanned(ctx context.Context, userID, roomID primitive.ObjectID) bool {
	banned := false
	activeBan, err := s.GetActiveBan(ctx, userID, roomID)
	if err == nil && activeBan != nil && activeBan.IsActive() {
		banned = true
	}
	log.Printf("[RestrictionService] IsUserBanned: userID=%s roomID=%s result=%v", userID.Hex(), roomID.Hex(), banned)
	return banned
}

// IsUserMuted ตรวจสอบว่า user ถูก mute หรือไม่
func (s *RestrictionService) IsUserMuted(ctx context.Context, userID, roomID primitive.ObjectID) bool {
	muted := false
	activeMute, err := s.GetActiveMute(ctx, userID, roomID)
	if err == nil && activeMute != nil && activeMute.IsActive() {
		muted = true
	}
	log.Printf("[RestrictionService] IsUserMuted: userID=%s roomID=%s result=%v", userID.Hex(), roomID.Hex(), muted)
	return muted
}

// CanUserSendMessages ตรวจสอบว่า user สามารถส่งข้อความได้หรือไม่
func (s *RestrictionService) CanUserSendMessages(ctx context.Context, userID, roomID primitive.ObjectID) bool {
	canSend := !s.IsUserBanned(ctx, userID, roomID) && !s.IsUserMuted(ctx, userID, roomID)
	log.Printf("[RestrictionService] CanUserSendMessages: userID=%s roomID=%s result=%v", userID.Hex(), roomID.Hex(), canSend)
	return canSend
}

// CanUserViewMessages checks if a user can view messages in a room (for now, allow if not banned, and not muted with cannot_view)
func (s *RestrictionService) CanUserViewMessages(ctx context.Context, userID, roomID primitive.ObjectID) bool {
	if s.IsUserBanned(ctx, userID, roomID) {
		return false
	}
	activeMute, err := s.GetActiveMute(ctx, userID, roomID)
	if err == nil && activeMute != nil && activeMute.Restriction == "cannot_view" {
		return false
	}
	return true
}

// broadcastToTarget ส่ง direct message ไปยังผู้ที่ถูกลงโทษเฉพาะ
func (s *RestrictionService) broadcastToTarget(userID, roomID primitive.ObjectID, action string, restrictorID primitive.ObjectID, reason string, endTime *time.Time, restriction string) {
	isOnline := s.hub.IsUserOnlineInRoom(roomID.Hex(), userID.Hex())

	duration := "permanent"
	if endTime != nil {
		duration = "temporary"
	}
	// Compose moderation message for notification
	moderationMsg := restrictionUtils.BuildRestrictionMessage(action, userID, roomID, restrictorID, reason, duration, endTime, restriction)

	if isOnline {
		log.Printf("[MODERATION] User %s is ONLINE, sending WebSocket notification", userID.Hex())
		// WebSocket notification (unchanged)
		payload := map[string]interface{}{
			"type":      "moderation_targeted",
			"action":    action,
			"broadcast": "target",
			"data": map[string]interface{}{
				"targetUserId": userID.Hex(),
				"roomId":       roomID.Hex(),
				"restrictorId": restrictorID.Hex(),
				"reason":       reason,
				"endTime":      endTime,
				"restriction":  restriction,
				"timestamp":    time.Now(),
				"message":      moderationMsg.Message,
			},
		}
		if data, err := json.Marshal(payload); err == nil {
			s.hub.BroadcastToUser(userID.Hex(), data)
			log.Printf("[MODERATION] Sent targeted %s WebSocket notification to user %s", action, userID.Hex())
		} else {
			log.Printf("[ERROR] Failed to marshal targeted moderation broadcast: %v", err)
		}
		// Send notification for online user as well (for mobile push, etc.)
		s.notificationService.SendMessageNotification(context.Background(), userID.Hex(), moderationMsg, "moderation")
	} else {
		log.Printf("[MODERATION] User %s is OFFLINE, sending Kafka notification", userID.Hex())
		// Send notification for offline user
		s.notificationService.SendMessageNotification(context.Background(), userID.Hex(), moderationMsg, "moderation")
	}
}

// broadcastToRoomMembers ส่งข้อความแจ้งเตือนไปยังคนอื่นในห้อง
func (s *RestrictionService) broadcastToRoomMembers(roomID primitive.ObjectID, action string, userID, restrictorID primitive.ObjectID, reason string, endTime *time.Time, restriction string) {
	announcement := "User has been " + action + ". Reason: " + reason
	payload := map[string]interface{}{
		"type":      "moderation_announcement",
		"action":    action,
		"broadcast": "room",
		"data": map[string]interface{}{
			"targetUserId": userID.Hex(),
			"roomId":       roomID.Hex(),
			"restrictorId": restrictorID.Hex(),
			"reason":       reason,
			"endTime":      endTime,
			"restriction":  restriction,
			"timestamp":    time.Now(),
			"announcement": announcement,
		},
	}

	// แปลงเป็น JSON และ broadcast ไปยังทุกคนในห้อง (ยกเว้น target user)
	if data, err := json.Marshal(payload); err == nil {
		s.hub.BroadcastToRoomExcept(roomID.Hex(), userID.Hex(), data)
		log.Printf("[MODERATION] Broadcasted %s announcement to room %s (excluding target user)", action, roomID.Hex())
	} else {
		log.Printf("[ERROR] Failed to marshal room moderation broadcast: %v", err)
	}
}

func (s *RestrictionService) getUserById(ctx context.Context, userID string) (*userModel.User, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	var user userModel.User
	err = s.mongo.Collection("users").FindOne(ctx, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	return &user, nil
}
