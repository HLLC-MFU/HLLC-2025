package utils

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"chat/module/chat/utils"
	"chat/module/room/room/model"
	sharedCache "chat/module/room/shared/cache"
	"chat/pkg/middleware"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// ตรวจสอบว่า roomID valid ไหม
func ValidateRoomID(roomID primitive.ObjectID, context string) bool {
	if roomID.IsZero() {
		log.Printf("[ERROR] Attempted to %s with zero roomID", context)
		return false
	}
	return true
}

// ตรวจสอบว่า userID valid ไหม
func ValidateUserID(userID primitive.ObjectID, context string) bool {
	if userID.IsZero() {
		log.Printf("[ERROR] Attempted to %s with zero userID", context)
		return false
	}
	return true
}

// ฟังก์ชันช่วย marshal พร้อม log error
func MustMarshal(value any, context string) ([]byte, bool) {
	data, err := json.Marshal(value)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal %s: %v", context, err)
		return nil, false
	}
	return data, true
}

// บันทึก error และ return ทันทีใน emit event
func EmitErrorLog(ctx context.Context, label string, err error) {
	log.Printf("[Kafka] Failed to emit %s: %v", label, err)
}

// RemoveMemberObjectID removes a member from []primitive.ObjectID
func RemoveMemberObjectID(existing []primitive.ObjectID, target primitive.ObjectID) []primitive.ObjectID {
	filtered := make([]primitive.ObjectID, 0, len(existing))
	for _, member := range existing {
		if member != target {
			filtered = append(filtered, member)
		}
	}
	return filtered
}

// ConvertToObjectIDs: if already []primitive.ObjectID, just return
func ConvertToObjectIDsFromStrings(stringIDs []string) []primitive.ObjectID {
	objectIDs := make([]primitive.ObjectID, len(stringIDs))
	for i, id := range stringIDs {
		objID, _ := primitive.ObjectIDFromHex(id)
		objectIDs[i] = objID
	}
	return objectIDs
}

// ContainsMember checks if target is in []primitive.ObjectID
func ContainsMember(members []primitive.ObjectID, target primitive.ObjectID) bool {
	for _, member := range members {
		if member == target {
			return true
		}
	}
	return false
}

func ValidateAndTrackConnection(ctx context.Context, room *model.Room, userID string, cache *sharedCache.RoomCacheService) error {
	log.Printf("[ConnectionHelper] Validating connection for user %s in room %s", userID, room.ID.Hex())

	uid, _ := primitive.ObjectIDFromHex(userID)
	if !ContainsMember(room.Members, uid) {
		return fmt.Errorf("user is not a member of this room")
	}

	// Check if room is active
	if room.IsInactive() {
		return fmt.Errorf("room is inactive and not accepting connections")
	}

	// **NEW: ตรวจสอบ schedule ของห้อง**
	currentTime := time.Now()
	if room.Schedule != nil && (room.Schedule.StartAt != nil || room.Schedule.EndAt != nil) {
		log.Printf("[ConnectionHelper] Checking schedule for room %s at time %s", room.ID.Hex(), currentTime.Format(time.RFC3339))
		if room.Schedule.StartAt != nil {
			log.Printf("[ConnectionHelper] Schedule start time: %s", room.Schedule.StartAt.Format(time.RFC3339))
		}
		if room.Schedule.EndAt != nil {
			log.Printf("[ConnectionHelper] Schedule end time: %s", room.Schedule.EndAt.Format(time.RFC3339))
		}
		
		if !room.IsRoomAccessibleForWebSocket(currentTime) {
			scheduleStatus := room.GetScheduleStatus(currentTime)
			log.Printf("[ConnectionHelper] Room %s is not accessible for WebSocket. Schedule status: %s", room.ID.Hex(), scheduleStatus)
			if scheduleStatus == "closed" {
				return fmt.Errorf("room is currently closed according to its schedule")
			}
		} else {
			log.Printf("[ConnectionHelper] Room %s is accessible for WebSocket according to schedule", room.ID.Hex())
		}
	}

	if !room.IsUnlimitedCapacity() {
		if count, err := cache.GetActiveConnectionsCount(ctx, room.ID.Hex()); err == nil && count >= int64(room.Capacity) {
			return fmt.Errorf("room is at capacity: %d/%d", count, room.Capacity)
		}
	}

	return cache.TrackConnection(ctx, room.ID.Hex(), userID)
}

// GetRoomStatus ดึงสถานะของห้อง
func GetRoomStatus(ctx context.Context, room *model.Room, cache *sharedCache.RoomCacheService) (map[string]interface{}, error) {
	log.Printf("[ConnectionHelper] Getting status for room %s", room.ID.Hex())

	// ดึงจำนวน connection จาก cache
	activeCount, _ := cache.GetActiveConnectionsCount(ctx, room.ID.Hex())
	activeUsers, _ := cache.GetActiveUsers(ctx, room.ID.Hex())

	// คืนค่า room status
	return map[string]interface{}{
		"roomId":      room.ID.Hex(),
		"capacity":    room.Capacity,
		"memberCount": len(room.Members),
		"activeCount": activeCount,
		"activeUsers": activeUsers,
		"lastActive":  room.UpdatedAt,
	}, nil
}

// RemoveConnection ลบ connection
func RemoveConnection(ctx context.Context, roomID primitive.ObjectID, userID string, cache *sharedCache.RoomCacheService) error {
	log.Printf("[ConnectionHelper] Removing connection for user %s from room %s", userID, roomID.Hex())
	return cache.RemoveConnection(ctx, roomID.Hex(), userID)
}

// GetActiveConnectionsCount ดึงจำนวน connections ที่ active
func GetActiveConnectionsCount(ctx context.Context, roomID primitive.ObjectID, cache *sharedCache.RoomCacheService) (int64, error) {
	return cache.GetActiveConnectionsCount(ctx, roomID.Hex())
}

// CanUserSendMessage ตรวจสอบว่า user สามารถส่งข้อความได้หรือไม่
func CanUserSendMessage(ctx context.Context, room *model.Room, userID string) (bool, error) {
	log.Printf("[ConnectionHelper] Checking message permission for user %s in room %s", userID, room.ID.Hex())

	uid, _ := primitive.ObjectIDFromHex(userID)

	if !ContainsMember(room.Members, uid) {
		return false, fmt.Errorf("user is not a member of this room")
	}

	if room.IsReadOnly() {
		userRole := ctx.Value("userRole").(string)
		if userRole == "" {
			return false, fmt.Errorf("user role not found in context")
		}

		if userRole != middleware.RoleAdministrator && userRole != middleware.RoleStaff && userRole != middleware.RoleAE {
			return false, fmt.Errorf("room is read-only and user does not have write permission")
		}
	}

	return true, nil
}

// CanUserSendSticker ตรวจสอบว่า user สามารถส่ง sticker ได้หรือไม่
func CanUserSendSticker(ctx context.Context, room *model.Room, userID string) (bool, error) {
	// ใช้ logic เดียวกับ message permission
	return CanUserSendMessage(ctx, room, userID)
}

// CanUserSendReaction ตรวจสอบว่า user สามารถส่ง reaction ได้หรือไม่
func CanUserSendReaction(ctx context.Context, room *model.Room, userID string) (bool, error) {
	// ใช้ logic เดียวกับ message permission
	return CanUserSendMessage(ctx, room, userID)
}

func UpdateRoomType(ctx context.Context, roomID primitive.ObjectID, roomType string, db *mongo.Database) error {
	log.Printf("[RoomHelper] Updating room type for %s to %s", roomID.Hex(), roomType)

	if !model.ValidateRoomType(roomType) {
		return fmt.Errorf("invalid room type: %s", roomType)
	}

	collection := db.Collection("rooms")
	filter := bson.M{"_id": roomID}
	update := bson.M{
		"$set": bson.M{
			"type":      roomType,
			"updatedAt": time.Now(),
		},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update room type: %w", err)
	}

	if result.ModifiedCount == 0 {
		return fmt.Errorf("room not found")
	}

	log.Printf("[RoomHelper] Room type updated successfully")
	return nil
}

// AddMemberToRoom เพิ่มสมาชิกเข้าห้อง
func AddMemberToRoom(ctx context.Context, roomID, userID primitive.ObjectID, db *mongo.Database) error {
	log.Printf("[RoomHelper] Adding member %s to room %s", userID.Hex(), roomID.Hex())

	collection := db.Collection("rooms")
	filter := bson.M{"_id": roomID}
	update := bson.M{
		"$addToSet": bson.M{"members": userID},
		"$set":      bson.M{"updatedAt": time.Now()},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to add member: %w", err)
	}

	if result.ModifiedCount == 0 {
		return fmt.Errorf("room not found or member already exists")
	}

	log.Printf("[RoomHelper] Member added successfully")
	return nil
}

// RemoveMemberFromRoom ลบสมาชิกออกจากห้อง
func RemoveMemberFromRoom(ctx context.Context, roomID, userID primitive.ObjectID, db *mongo.Database) error {
	log.Printf("[RoomHelper] Removing member %s from room %s", userID.Hex(), roomID.Hex())

	collection := db.Collection("rooms")
	filter := bson.M{"_id": roomID}
	update := bson.M{
		"$pull": bson.M{"members": userID},
		"$set":  bson.M{"updatedAt": time.Now()},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to remove member: %w", err)
	}

	if result.ModifiedCount == 0 {
		return fmt.Errorf("room not found or member not in room")
	}

	log.Printf("[RoomHelper] Member removed successfully")
	return nil
}

// UpdateRoomImage อัพเดทรูปภาพของห้อง
func UpdateRoomImage(ctx context.Context, roomID primitive.ObjectID, imageURL string, db *mongo.Database) error {
	log.Printf("[RoomHelper] Updating room image for %s", roomID.Hex())

	collection := db.Collection("rooms")
	filter := bson.M{"_id": roomID}
	update := bson.M{
		"$set": bson.M{
			"image":     imageURL,
			"updatedAt": time.Now(),
		},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update room image: %w", err)
	}

	if result.ModifiedCount == 0 {
		return fmt.Errorf("room not found")
	}

	log.Printf("[RoomHelper] Room image updated successfully")
	return nil
}

// GetRoomMemberCount ดึงจำนวนสมาชิกในห้อง
func GetRoomMemberCount(ctx context.Context, roomID primitive.ObjectID, db *mongo.Database) (int, error) {
	log.Printf("[RoomHelper] Getting member count for room %s", roomID.Hex())

	collection := db.Collection("rooms")

	// ใช้ aggregation pipeline เพื่อนับสมาชิก
	pipeline := []bson.M{
		{"$match": bson.M{"_id": roomID}},
		{"$project": bson.M{"memberCount": bson.M{"$size": "$members"}}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, fmt.Errorf("failed to count members: %w", err)
	}
	defer cursor.Close(ctx)

	if !cursor.Next(ctx) {
		return 0, fmt.Errorf("room not found")
	}

	var result struct {
		MemberCount int `bson:"memberCount"`
	}
	if err := cursor.Decode(&result); err != nil {
		return 0, fmt.Errorf("failed to decode result: %w", err)
	}

	log.Printf("[RoomHelper] Room has %d members", result.MemberCount)
	return result.MemberCount, nil
}

// DisconnectAllUsersFromRoom disconnects all users from a room when it becomes inactive
func DisconnectAllUsersFromRoom(ctx context.Context, roomID primitive.ObjectID, hub *utils.Hub, cache *sharedCache.RoomCacheService) error {
	log.Printf("[RoomHelper] Disconnecting all users from inactive room %s", roomID.Hex())

	roomIDStr := roomID.Hex()

	// Get all active users in the room
	activeUsers, err := cache.GetActiveUsers(ctx, roomIDStr)
	if err != nil {
		log.Printf("[RoomHelper] Failed to get active users for room %s: %v", roomIDStr, err)
		return err
	}

	// Create room deactivation message
	deactivationEvent := map[string]interface{}{
		"type": "room_deactivated",
		"data": map[string]interface{}{
			"roomId":    roomIDStr,
			"message":   "This room has been deactivated. You will be disconnected.",
			"timestamp": time.Now(),
		},
	}

	eventBytes, err := json.Marshal(deactivationEvent)
	if err != nil {
		log.Printf("[RoomHelper] Failed to marshal deactivation event: %v", err)
		return err
	}

	// Broadcast deactivation message to all users in the room
	hub.BroadcastToRoom(roomIDStr, eventBytes)

	// Remove all connections from cache
	for _, userID := range activeUsers {
		if err := cache.RemoveConnection(ctx, roomIDStr, userID); err != nil {
			log.Printf("[RoomHelper] Failed to remove connection for user %s: %v", userID, err)
		}
	}

	log.Printf("[RoomHelper] Successfully disconnected %d users from room %s", len(activeUsers), roomIDStr)
	return nil
}

// ฟังก์ชันช่วย extract user id จาก JWT token (Authorization header)
func ExtractUserIDFromJWT(ctx *fiber.Ctx) (primitive.ObjectID, error) {
	authHeader := ctx.Get("Authorization")
	if authHeader == "" {
		return primitive.NilObjectID, fiber.NewError(fiber.StatusUnauthorized, "Missing Authorization header")
	}
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return primitive.NilObjectID, fiber.NewError(fiber.StatusUnauthorized, "Invalid Authorization header format")
	}
	token := parts[1]
	// decode JWT payload (base64)
	payloadPart := strings.Split(token, ".")
	if len(payloadPart) < 2 {
		return primitive.NilObjectID, fiber.NewError(fiber.StatusUnauthorized, "Invalid JWT token")
	}
	payload, err := decodeBase64URL(payloadPart[1])
	if err != nil {
		return primitive.NilObjectID, fiber.NewError(fiber.StatusUnauthorized, "Invalid JWT payload")
	}
	type jwtPayload struct {
		Sub string `json:"sub"`
	}
	var p jwtPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return primitive.NilObjectID, fiber.NewError(fiber.StatusUnauthorized, "Invalid JWT payload structure")
	}
	return primitive.ObjectIDFromHex(p.Sub)
}

func decodeBase64URL(s string) ([]byte, error) {
	missing := len(s) % 4
	if missing != 0 {
		s += strings.Repeat("=", 4-missing)
	}
	return base64.URLEncoding.DecodeString(s)
}
