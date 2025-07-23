package utils

import (
	chatUtils "chat/module/chat/utils"
	"chat/module/room/room/model"
	sharedCache "chat/module/room/shared/cache"
	sharedEvents "chat/module/room/shared/events"
	roomHelper "chat/module/room/shared/utils"
	"chat/pkg/middleware"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type RoomMemberHelper struct {
	db           *mongo.Database
	cache        *sharedCache.RoomCacheService
	eventEmitter *sharedEvents.RoomEventEmitter
	hub          *chatUtils.Hub
	rbac         *middleware.RBACMiddleware
}

func NewRoomMemberHelper(db *mongo.Database, cache *sharedCache.RoomCacheService, eventEmitter *sharedEvents.RoomEventEmitter, hub *chatUtils.Hub) *RoomMemberHelper {
	return &RoomMemberHelper{
		db:           db,
		cache:        cache,
		eventEmitter: eventEmitter,
		hub:          hub,
		rbac:         middleware.NewRBACMiddleware(db),
	}
}

// AddUserToRoom เพิ่ม user เข้าห้อง
func (h *RoomMemberHelper) AddUserToRoom(ctx context.Context, roomID, userID string) error {
	log.Printf("[MemberHelper] Adding user %s to room %s", userID, roomID)

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return fmt.Errorf("invalid room ID: %w", err)
	}
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	collection := h.db.Collection("rooms")
	filter := bson.M{"_id": roomObjID}
	update := bson.M{
		"$addToSet": bson.M{"members": userObjID},
		"$set":      bson.M{"updatedAt": time.Now()},
	}

	var room model.Room
	err = collection.FindOneAndUpdate(ctx, filter, update).Decode(&room)
	if err != nil {
		return fmt.Errorf("failed to add user to room: %w", err)
	}

	room.Members = append(room.Members, userObjID)
	room.UpdatedAt = time.Now()
	if err := h.cache.SaveRoom(ctx, &room); err != nil {
		log.Printf("[MemberHelper] Warning: Failed to update cache: %v", err)
	}

	if err := h.cache.AddMember(ctx, roomID, userObjID); err != nil {
		log.Printf("[MemberHelper] Warning: Failed to update members cache: %v", err)
	}

	h.broadcastUserJoined(roomID, userID)

	log.Printf("[MemberHelper] User %s added to room %s successfully", userID, roomID)
	return nil
}

// RemoveUserFromRoom ลบ user ออกจากห้อง
func (h *RoomMemberHelper) RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (*model.Room, error) {
	log.Printf("[MemberHelper] Removing user %s from room %s", userID, roomID.Hex())

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// อัพเดทใน database (ใช้ userID string)
	collection := h.db.Collection("rooms")
	filter := bson.M{"_id": roomID}
	update := bson.M{
		"$pull": bson.M{"members": userObjID},
		"$set":  bson.M{"updatedAt": time.Now()},
	}

	var room model.Room
	err = collection.FindOneAndUpdate(ctx, filter, update).Decode(&room)
	if err != nil {
		return nil, fmt.Errorf("failed to remove user from room: %w", err)
	}

	// Update cache with the new room state
	room.Members = roomHelper.RemoveMemberObjectID(room.Members, userObjID)
	room.UpdatedAt = time.Now()
	if err := h.cache.SaveRoom(ctx, &room); err != nil {
		log.Printf("[MemberHelper] Warning: Failed to update cache: %v", err)
	}

	// Also update the members cache
	if err := h.cache.RemoveMember(ctx, roomID.Hex(), userObjID); err != nil {
		log.Printf("[MemberHelper] Warning: Failed to update members cache: %v", err)
	}

	// Remove connection
	if err := h.cache.RemoveConnection(ctx, roomID.Hex(), userID); err != nil {
		log.Printf("[MemberHelper] Warning: Failed to remove connection: %v", err)
	}

	// Broadcast event
	h.broadcastUserLeft(roomID.Hex(), userID)

	log.Printf("[MemberHelper] User %s removed from room %s successfully", userID, roomID.Hex())
	return &room, nil
}

// JoinRoom เข้าร่วมห้อง
func (h *RoomMemberHelper) JoinRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	log.Printf("[MemberHelper] User %s joining room %s", userID, roomID.Hex())

	// ตรวจสอบว่า user อยู่ในห้องแล้วหรือไม่
	collection := h.db.Collection("rooms")
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	filter := bson.M{
		"_id":     roomID,
		"members": userObjID,
	}

	count, err := collection.CountDocuments(ctx, filter)
	if err != nil {
		return fmt.Errorf("failed to check user membership: %w", err)
	}

	if count > 0 {
		log.Printf("[MemberHelper] User %s already in room %s", userID, roomID.Hex())
		return nil
	}

	// ดึงข้อมูลห้อง
	var room model.Room
	err = collection.FindOne(ctx, bson.M{"_id": roomID}).Decode(&room)
	if err != nil {
		return fmt.Errorf("room not found: %w", err)
	}

	// Check if room is active
	if room.IsInactive() {
		return fmt.Errorf("room is inactive and not accepting new members")
	}

	// ตรวจสอบ capacity
	if !room.IsUnlimitedCapacity() && len(room.Members) >= room.Capacity {
		return fmt.Errorf("room is at full capacity")
	}

	// **NEW: ตรวจสอบ role และ group room restrictions**
	if err := h.validateUserRoleForRoom(ctx, userID, &room); err != nil {
		log.Printf("[MemberHelper] Role validation failed for user %s joining room %s: %v", userID, roomID.Hex(), err)
		return err
	}

	// เพิ่ม user เข้าห้อง
	return h.AddUserToRoom(ctx, roomID.Hex(), userID)
}

// **NEW: validateUserRoleForRoom ตรวจสอบ role และสิทธิ์ในการเข้าห้อง**
func (h *RoomMemberHelper) validateUserRoleForRoom(ctx context.Context, userID string, room *model.Room) error {
	if room.IsGroupRoom() {
		roleName, err := h.rbac.GetUserRole(userID)
		if err != nil {
			return fmt.Errorf("failed to get user role: %w", err)
		}

		if roleName != "Administrator" && roleName != "Staff" {
			return fmt.Errorf("only Administrator and Staff can join group rooms")
		}
	}
	return nil
}

// LeaveRoom ออกจากห้อง
func (h *RoomMemberHelper) LeaveRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	log.Printf("[MemberHelper] User %s leaving room %s", userID, roomID.Hex())

	// ลบ user ออกจากห้อง
	_, err := h.RemoveUserFromRoom(ctx, roomID, userID)
	if err != nil {
		return fmt.Errorf("failed to leave room: %w", err)
	}

	log.Printf("[MemberHelper] User %s left room %s successfully", userID, roomID.Hex())
	return nil
}

// broadcastUserJoined broadcast event เมื่อ user เข้าร่วม
func (h *RoomMemberHelper) broadcastUserJoined(roomID, userID string) {
	// Disabled: Do not broadcast user_joined event
	// event := ChatEvent{
	//     Type: "user_joined",
	//     Payload: map[string]string{
	//         "roomId": roomID,
	//         "userId": userID,
	//     },
	// }
	// eventBytes, _ := json.Marshal(event)
	// h.hub.BroadcastToRoom(roomID, eventBytes)
}

// broadcastUserLeft broadcast event เมื่อ user ออกจากห้อง
func (h *RoomMemberHelper) broadcastUserLeft(roomID, userID string) {
	// Disabled: Do not broadcast user_left event
	// event := ChatEvent{
	//     Type: "user_left",
	//     Payload: map[string]string{
	//         "roomId": roomID,
	//         "userId": userID,
	//     },
	// }
	// eventBytes, _ := json.Marshal(event)
	// h.hub.BroadcastToRoom(roomID, eventBytes)
}
