package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"chat/module/room/model"

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

// นี่คือฟังก์ชันที่จะใช้ใน service เพื่อลบ members ** อย่าสังเขปมัน **
func RemoveMember(existing []primitive.ObjectID, target primitive.ObjectID) []primitive.ObjectID {
	filtered := make([]primitive.ObjectID, 0, len(existing))
	for _, member := range existing {
		if member != target {
			filtered = append(filtered, member)
		}
	}
	return filtered
}

// แปลง string IDs เป็น ObjectIDs
func ConvertToObjectIDs(stringIDs []string) []primitive.ObjectID {
	if len(stringIDs) == 0 {
		return make([]primitive.ObjectID, 0)
	}
	objectIDs := make([]primitive.ObjectID, len(stringIDs))
	for i, id := range stringIDs {
		objID, _ := primitive.ObjectIDFromHex(id)
		objectIDs[i] = objID
	}
	return objectIDs
}

// ตรวจสอบว่ามี member นั้นอยู่ใน list หรือไม่
func ContainsMember(members []primitive.ObjectID, target primitive.ObjectID) bool {
	for _, member := range members {
		if member == target {
			return true
		}
	}
	return false
}

func ValidateAndTrackConnection(ctx context.Context, room *model.Room, userID string, cache *RoomCacheService) error {
	log.Printf("[ConnectionHelper] Validating connection for user %s in room %s", userID, room.ID.Hex())

	// แปลง userID เป็น ObjectID
	uid, _ := primitive.ObjectIDFromHex(userID)

	// ตรวจสอบว่ามี user อยู่ใน room หรือไม่
	if !ContainsMember(room.Members, uid) {
		return fmt.Errorf("user is not a member of this room")
	}

	// ตรวจสอบ capacity เฉพาะห้องที่มีการจำกัด
	if !room.IsUnlimitedCapacity() {
		if count, err := cache.GetActiveConnectionsCount(ctx, room.ID.Hex()); err == nil && count >= int64(room.Capacity) {
			return fmt.Errorf("room is at capacity: %d/%d", count, room.Capacity)
		}
	}

	// บันทึก connection ลง cache
	return cache.TrackConnection(ctx, room.ID.Hex(), userID)
}

// GetRoomStatus ดึงสถานะของห้อง
func GetRoomStatus(ctx context.Context, room *model.Room, cache *RoomCacheService) (map[string]interface{}, error) {
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
func RemoveConnection(ctx context.Context, roomID primitive.ObjectID, userID string, cache *RoomCacheService) error {
	log.Printf("[ConnectionHelper] Removing connection for user %s from room %s", userID, roomID.Hex())
	return cache.RemoveConnection(ctx, roomID.Hex(), userID)
}

// GetActiveConnectionsCount ดึงจำนวน connections ที่ active
func GetActiveConnectionsCount(ctx context.Context, roomID primitive.ObjectID, cache *RoomCacheService) (int64, error) {
	return cache.GetActiveConnectionsCount(ctx, roomID.Hex())
}

// CanUserSendMessage ตรวจสอบว่า user สามารถส่งข้อความได้หรือไม่
func CanUserSendMessage(ctx context.Context, room *model.Room, userID string) (bool, error) {
	log.Printf("[ConnectionHelper] Checking message permission for user %s in room %s", userID, room.ID.Hex())

	// แปลง userID เป็น ObjectID
	uid, _ := primitive.ObjectIDFromHex(userID)

	// ตรวจสอบว่ามี user อยู่ใน room หรือไม่
	if !ContainsMember(room.Members, uid) {
		return false, fmt.Errorf("user is not a member of this room")
	}

	// ตรวจสอบว่าห้องเป็น read-only หรือไม่
	if room.IsReadOnly() {
		return false, fmt.Errorf("room is read-only")
	}

	// ตรวจสอบ permission เพิ่มเติมตามต้องการ
	// เช่น mute status, ban status, etc.

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