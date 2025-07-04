package utils

import (
	"chat/module/room/model"
	userModel "chat/module/user/model"
	userService "chat/module/user/service"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type GroupRoomHelper struct {
	userService *userService.UserService
	db          *mongo.Database
}

func NewGroupRoomHelper(userService *userService.UserService, db *mongo.Database) *GroupRoomHelper {
	return &GroupRoomHelper{
		userService: userService,
		db:          db,
	}
}


// GetUsersByGroup ดึง users ตาม group type
func (gh *GroupRoomHelper) GetUsersByGroup(ctx context.Context, groupType, groupValue string) ([]*userModel.User, error) {
	log.Printf("[GroupHelper] Getting users by group: type=%s, value=%s", groupType, groupValue)

	var users []*userModel.User
	var err error

	switch groupType {
	case "major":
		users, err = gh.userService.GetUsersByMajor(ctx, groupValue)
	case "school":
		users, err = gh.userService.GetUsersBySchool(ctx, groupValue)
	default:
		return nil, fmt.Errorf("invalid group type: %s", groupType)
	}

	if err != nil {
		log.Printf("[GroupHelper] Failed to get users: %v", err)
		return nil, fmt.Errorf("failed to get users by %s: %w", groupType, err)
	}

	log.Printf("[GroupHelper] Found %d users for %s: %s", len(users), groupType, groupValue)
	return users, nil
}

// ValidateGroupType ตรวจสอบว่า group type ถูกต้องหรือไม่
func (gh *GroupRoomHelper) ValidateGroupType(groupType string) error {
	if groupType != "major" && groupType != "school" {
		return fmt.Errorf("invalid group type: %s (must be 'major' or 'school')", groupType)
	}
	return nil
}

// GetGroupRooms ดึงห้องกลุ่มตาม criteria
func (gh *GroupRoomHelper) GetGroupRooms(ctx context.Context, groupType, groupValue string) ([]*model.Room, error) {
	log.Printf("[GroupHelper] Getting group rooms: type=%s, value=%s", groupType, groupValue)

	collection := gh.db.Collection("rooms")
	filter := bson.M{
		"metadata.isGroupRoom": true,
		"metadata.groupType":   groupType,
		"metadata.groupValue":  groupValue,
	}

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to find group rooms: %w", err)
	}
	defer cursor.Close(ctx)

	var rooms []*model.Room
	if err := cursor.All(ctx, &rooms); err != nil {
		return nil, fmt.Errorf("failed to decode group rooms: %w", err)
	}

	log.Printf("[GroupHelper] Found %d group rooms", len(rooms))
	return rooms, nil
}

// GetAutoAddRooms ดึงห้องที่เปิด auto-add
func (gh *GroupRoomHelper) GetAutoAddRooms(ctx context.Context) ([]*model.Room, error) {
	log.Printf("[GroupHelper] Getting auto-add enabled rooms")

	collection := gh.db.Collection("rooms")
	filter := bson.M{
		"metadata.isGroupRoom": true,
		"metadata.autoAdd":     true,
	}

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to find auto-add rooms: %w", err)
	}
	defer cursor.Close(ctx)

	var rooms []*model.Room
	if err := cursor.All(ctx, &rooms); err != nil {
		return nil, fmt.Errorf("failed to decode auto-add rooms: %w", err)
	}

	log.Printf("[GroupHelper] Found %d auto-add rooms", len(rooms))
	return rooms, nil
}

// UpdateAutoAddStatus เปิด/ปิด auto-add สำหรับห้อง
func (gh *GroupRoomHelper) UpdateAutoAddStatus(ctx context.Context, roomID primitive.ObjectID, autoAdd bool) error {
	log.Printf("[GroupHelper] Updating auto-add status for room %s: %v", roomID.Hex(), autoAdd)

	collection := gh.db.Collection("rooms")
	filter := bson.M{"_id": roomID}
	update := bson.M{
		"$set": bson.M{
			"metadata.autoAdd": autoAdd,
			"updatedAt":        time.Now(),
		},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update auto-add status: %w", err)
	}

	if result.ModifiedCount == 0 {
		return fmt.Errorf("room not found or not a group room")
	}

	log.Printf("[GroupHelper] Updated auto-add status successfully")
	return nil
}

// BulkAddMembers เพิ่มสมาชิกหลายคนพร้อมกัน
func (gh *GroupRoomHelper) BulkAddMembers(ctx context.Context, roomID primitive.ObjectID, userIDs []primitive.ObjectID) (int, error) {
	if len(userIDs) == 0 {
		return 0, nil
	}

	log.Printf("[GroupHelper] Bulk adding %d members to room %s", len(userIDs), roomID.Hex())

	collection := gh.db.Collection("rooms")
	
	// ใช้ $addToSet เพื่อหลีกเลี่ยงการเพิ่มซ้ำ
	filter := bson.M{"_id": roomID}
	update := bson.M{
		"$addToSet": bson.M{
			"members": bson.M{"$each": userIDs},
		},
		"$set": bson.M{"updatedAt": time.Now()},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return 0, fmt.Errorf("failed to bulk add members: %w", err)
	}

	if result.ModifiedCount == 0 {
		return 0, fmt.Errorf("room not found")
	}

	log.Printf("[GroupHelper] Bulk add completed")
	return len(userIDs), nil
}

// IsGroupRoom ตรวจสอบว่าเป็นห้องกลุ่มหรือไม่
func (gh *GroupRoomHelper) IsGroupRoom(room *model.Room) bool {
	if room.Metadata == nil {
		return false
	}
	isGroupRoom, exists := room.Metadata["isGroupRoom"]
	return exists && isGroupRoom == true
}

// GetGroupInfo ดึงข้อมูล group จาก room metadata
func (gh *GroupRoomHelper) GetGroupInfo(room *model.Room) (groupType, groupValue string, ok bool) {
	if !gh.IsGroupRoom(room) {
		return "", "", false
	}

	groupType, typeExists := room.Metadata["groupType"].(string)
	groupValue, valueExists := room.Metadata["groupValue"].(string)

	if !typeExists || !valueExists {
		return "", "", false
	}

	return groupType, groupValue, true
} 