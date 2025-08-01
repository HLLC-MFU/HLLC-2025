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

	// Cache already cleared in removeUserFromRoom function

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
		log.Printf("[ModerationService] Warning: User %s not found in room %s or room not found", userID.Hex(), roomID.Hex())
		// ไม่ return error เพราะอาจเป็น user ที่ไม่ได้อยู่ในห้องแล้ว
	} else {
		log.Printf("[ModerationService] Successfully removed user %s from room %s in database", userID.Hex(), roomID.Hex())
	}

	// **NEW: ล้าง cache ทันทีหลังจากลบ user ออกจาก database**
	s.clearRoomMembersCache(ctx, roomID)

	// **NEW: Disconnect user จาก WebSocket hub**
	if s.hub != nil {
		roomIDStr := roomID.Hex()
		userIDStr := userID.Hex()
		
		// ส่ง kick notification ไปยัง user
		kickEvent := map[string]interface{}{
			"type": "user_kicked",
			"data": map[string]interface{}{
				"roomId":    roomIDStr,
				"userId":    userIDStr,
				"message":   "You have been kicked from this room",
				"timestamp": time.Now(),
			},
		}
		
		if eventBytes, err := json.Marshal(kickEvent); err == nil {
			// ส่ง event ไปยัง user ที่ถูก kick
			s.hub.BroadcastToUser(userIDStr, eventBytes)
			
			// ส่ง event ไปยังคนอื่นในห้อง
			s.hub.BroadcastToRoomExcept(roomIDStr, userIDStr, eventBytes)
			
			log.Printf("[ModerationService] Sent kick notification to user %s and room %s", userIDStr, roomIDStr)
		} else {
			log.Printf("[ERROR] Failed to marshal kick event: %v", err)
		}
		
		// **NEW: Force disconnect user from WebSocket**
		disconnectedCount := s.hub.ForceDisconnectUserFromRoom(roomIDStr, userIDStr)
		log.Printf("[ModerationService] Force disconnected %d connections for user %s from room %s", disconnectedCount, userIDStr, roomIDStr)
	}

	log.Printf("[ModerationService] Successfully removed user %s from room %s", userID.Hex(), roomID.Hex())
	return nil
}

// clearRoomMembersCache ล้าง cache ของ room members
func (s *RestrictionService) clearRoomMembersCache(ctx context.Context, roomID primitive.ObjectID) {
	// ล้าง cache key สำหรับ room members
	cacheKey := fmt.Sprintf("room_members:%s", roomID.Hex())
	
	// ล้าง cache โดยการลบ key
	log.Printf("[ModerationService] Clearing cache for room members: %s", cacheKey)
	
	// ล้าง room cache และ members cache
	roomCollection := s.mongo.Collection("rooms")
	
	// ล้าง cache โดยการดึงข้อมูลใหม่จาก database
	var room struct { 
		ID      primitive.ObjectID   `bson:"_id"`
		Members []primitive.ObjectID `bson:"members"`
		Name    map[string]string    `bson:"name"`
		Type    string               `bson:"type"`
		Status  string               `bson:"status"`
		Capacity int                 `bson:"capacity"`
		CreatedBy primitive.ObjectID `bson:"createdBy"`
		CreatedAt time.Time          `bson:"createdAt"`
		UpdatedAt time.Time          `bson:"updatedAt"`
		Image    string              `bson:"image"`
		Metadata map[string]interface{} `bson:"metadata"`
	}
	
	filter := bson.M{"_id": roomID}
	
	// ดึงข้อมูลห้องใหม่เพื่อล้าง cache
	err := roomCollection.FindOne(ctx, filter).Decode(&room)
	if err != nil {
		log.Printf("[ModerationService] Warning: Failed to refresh room cache: %v", err)
	} else {
		log.Printf("[ModerationService] Successfully refreshed room cache for room %s with %d members", roomID.Hex(), len(room.Members))
	}
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

// GetModerationHistory ดึงประวัติการลงโทษ
func (s *RestrictionService) GetModerationHistory(ctx context.Context, opts queries.QueryOptions) (*queries.Response[restrictionModel.UserRestriction], error) {
	// ใช้ FindAll แทน FindAllWithPopulate เพื่อหลีกเลี่ยงปัญหา aggregation
	return s.FindAll(ctx, opts)
}

// GetModerationHistoryWithUsers ดึงประวัติการลงโทษพร้อมข้อมูล user
func (s *RestrictionService) GetModerationHistoryWithUsers(ctx context.Context, opts queries.QueryOptions) (*queries.Response[restrictionModel.UserRestriction], error) {
	// ดึง restrictions ก่อน
	result, err := s.FindAll(ctx, opts)
	if err != nil {
		return nil, err
	}

	// เพิ่มข้อมูล user สำหรับแต่ละ restriction
	for i := range result.Data {
		restriction := &result.Data[i]
		
		// ดึงข้อมูล user และ restrictor
		if user, err := s.getUserById(ctx, restriction.UserID.Hex()); err == nil && user != nil {
			restriction.User = user
		}
		
		if restrictor, err := s.getUserById(ctx, restriction.RestrictorID.Hex()); err == nil && restrictor != nil {
			restriction.Moderator = restrictor
		}
	}

	return result, nil
}

// GetRoomRestrictions ดึง restriction status ทั้งหมดในห้องเดียว
func (s *RestrictionService) GetRoomRestrictions(ctx context.Context, roomID primitive.ObjectID) (map[string]interface{}, error) {
	log.Printf("[ModerationService] Getting all restrictions for room %s", roomID.Hex())
	
	// ดึง active restrictions ทั้งหมดในห้อง
	filter := bson.M{
		"room_id": roomID,
		"status": "active",
	}
	
	cursor, err := s.mongo.Collection("user-restrictions").Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to query restrictions: %w", err)
	}
	defer cursor.Close(ctx)
	
	var restrictions []restrictionModel.UserRestriction
	if err := cursor.All(ctx, &restrictions); err != nil {
		return nil, fmt.Errorf("failed to decode restrictions: %w", err)
	}
	
	// สร้าง map ของ user ID -> restriction status
	restrictionMap := make(map[string]interface{})
	
	for _, restriction := range restrictions {
		userID := restriction.UserID.Hex()
		
		// สร้าง restriction status object
		status := map[string]interface{}{
			"isBanned": false,
			"isMuted":  false,
			"isKicked": false,
		}
		
		switch restriction.Type {
		case restrictionModel.RestrictionTypeBan:
			status["isBanned"] = true
			status["banReason"] = restriction.Reason
			status["banEndTime"] = restriction.EndTime
			status["banDuration"] = restriction.Duration
		case restrictionModel.RestrictionTypeMute:
			status["isMuted"] = true
			status["muteReason"] = restriction.Reason
			status["muteEndTime"] = restriction.EndTime
			status["muteDuration"] = restriction.Duration
			status["muteRestriction"] = restriction.Restriction
		case restrictionModel.RestrictionTypeKick:
			status["isKicked"] = true
			status["kickReason"] = restriction.Reason
			status["kickTime"] = restriction.StartTime
		}
		
		restrictionMap[userID] = status
	}
	
	log.Printf("[ModerationService] Found %d active restrictions in room %s", len(restrictions), roomID.Hex())
	
	return restrictionMap, nil
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
