package utils

import (
	"chat/module/room/model"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	defaultRoomTTL = 24 * time.Hour
	defaultMembersTTL = 1 * time.Hour
	defaultConnectionTTL = 5 * time.Minute
)

type RoomCacheService struct {
	redis *redis.Client
}

func NewRoomCacheService(redis *redis.Client) *RoomCacheService {
	return &RoomCacheService{redis: redis}
}

// สร้าง key สำหรับ room
func (s *RoomCacheService) roomKey(roomID string) string {
	return fmt.Sprintf("room:%s", roomID)
}

// สร้าว key สำหรับ members
func (s *RoomCacheService) membersKey(roomID string) string {
	return fmt.Sprintf("room:%s:members", roomID)
}

// สร้าว key สำหรับ connection
func (s *RoomCacheService) connectionKey(roomID, userID string) string {
	return fmt.Sprintf("room:%s:connection:%s", roomID, userID)
}

// สร้าว key สำหรับ active connections
func (s *RoomCacheService) activeConnectionsKey(roomID string) string {
	return fmt.Sprintf("room:%s:active_connections", roomID)
}

// ดึง room จาก cache
func (s *RoomCacheService) GetRoom(ctx context.Context, roomID string) (*model.Room, error) {

	// สร้าว key สำหรับ room
	key := s.roomKey(roomID)

	// ดึง data จาก cache
	data, err := s.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, nil
	}

	// ตรวจสอบ error
	if err != nil {
		return nil, err
	}

	// แปลง data เป็น model.Room
	var room model.Room
	if err := json.Unmarshal([]byte(data), &room); err != nil {
		return nil, err
	}

	// ตั้ง TTL สำหรับ room
	s.redis.Expire(ctx, key, defaultRoomTTL)

	return &room, nil
}

// บันทึก room ลง cache
func (s *RoomCacheService) SaveRoom(ctx context.Context, room *model.Room) error {
	key := s.roomKey(room.ID.Hex())
	data, err := json.Marshal(room)

	// ตรวจสอบ error
	if err != nil {
		return err
	}

	// บันทึก data ลง cache
	if err := s.redis.SetEx(ctx, key, data, defaultRoomTTL).Err(); err != nil {
		return err
	}
	// บันทึก members ลง cache
	members := make([]primitive.ObjectID, len(room.Members))
	for i, id := range room.Members {
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return err
		}
		members[i] = objectID
	}
	return s.SaveMembers(ctx, room.ID.Hex(), members)
}

// ลบ room จาก cache
func (s *RoomCacheService) DeleteRoom(ctx context.Context, roomID string) error {
	pipe := s.redis.Pipeline()

	// ลบ room จาก cache
	pipe.Del(ctx, s.roomKey(roomID))
	pipe.Del(ctx, s.membersKey(roomID))
	
	// ดำเนินการ
	_, err := pipe.Exec(ctx)
	return err
}

// ดึง members จาก cache
func (s *RoomCacheService) GetMembers(ctx context.Context, roomID string) ([]primitive.ObjectID, error) {

	// สร้าว key สำหรับ members
	key := s.membersKey(roomID)
	data, err := s.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, nil
	}

	// ตรวจสอบ error
	if err != nil {
		return nil, err
	}

	// แปลง data เป็น model.Room
	var members []primitive.ObjectID
	if err := json.Unmarshal([]byte(data), &members); err != nil {
		return nil, err
	}

	// ตั้ง TTL สำหรับ members
	s.redis.Expire(ctx, key, defaultMembersTTL)
	return members, nil
}

// บันทึก members ลง cache
func (s *RoomCacheService) SaveMembers(ctx context.Context, roomID string, members []primitive.ObjectID) error {
	key := s.membersKey(roomID)
	data, err := json.Marshal(members)

	// ตรวจสอบ error
	if err != nil {
		return err
	}

	// บันทึก data ลง cache
	return s.redis.SetEx(ctx, key, data, defaultMembersTTL).Err()
}

// เพิ่ม member ลง cache
func (s *RoomCacheService) AddMember(ctx context.Context, roomID string, memberID primitive.ObjectID) error {

	// ดึง members จาก cache
	members, err := s.GetMembers(ctx, roomID)
	if err != nil && err != redis.Nil {
		return err
	}

	// ตรวจสอบว่ามี member นั้นอยู่ใน list หรือไม่
	// ถ้ามีอยู่แล้วจะไม่บันทึกซ้ำ
	for _, m := range members {
		if m == memberID {
			return nil
		}
	}

	// เพิ่ม member ลง list
	members = append(members, memberID)
	return s.SaveMembers(ctx, roomID, members)
}

// ลบ member จาก cache
func (s *RoomCacheService) RemoveMember(ctx context.Context, roomID string, memberID primitive.ObjectID) error {
	members, err := s.GetMembers(ctx, roomID)
	if err != nil && err != redis.Nil {
		return err
	}

	// สร้าง list ใหม่โดยลบ member ที่ต้องการลบ
	filtered := make([]primitive.ObjectID, 0, len(members))
	for _, m := range members {

		// ถ้า member ไม่ใช่ member ที่ต้องการลบจะเพิ่มเข้า list
		if m != memberID {
			filtered = append(filtered, m)
		}
	}

	// บันทึก members ลง cache
	return s.SaveMembers(ctx, roomID, filtered)
}

// ตรวจสอบว่ามี member นั้นอยู่ใน list หรือไม่
func (s *RoomCacheService) IsMember(ctx context.Context, roomID string, memberID primitive.ObjectID) (bool, error) {

	// ดึง members จาก cache
	members, err := s.GetMembers(ctx, roomID)
	if err != nil {
		return false, err
	}

	// ตรวจสอบว่ามี member นั้นอยู่ใน list หรือไม่
	for _, m := range members {

		// ถ้า member เป็น member ที่ต้องการลบจะไม่เพิ่มเข้า list
		if m == memberID {
			return true, nil
		}
	}

	// ถ้า member ไม่อยู่ใน list จะ return false
	return false, nil
}

// นับจำนวน member ใน room
func (s *RoomCacheService) GetMemberCount(ctx context.Context, roomID string) (int, error) {

	// ดึง members จาก cache
	members, err := s.GetMembers(ctx, roomID)
	if err != nil {
		return 0, err
	}

	// คืนค่าเป็นจำนวน member ใน list
	return len(members), nil
}

// บันทึก connection ลง cache
func (s *RoomCacheService) TrackConnection(ctx context.Context, roomID, userID string) error {
	pipe := s.redis.Pipeline()

	// เพิ่ม userID ไปยัง list active connections
	pipe.SAdd(ctx, s.activeConnectionsKey(roomID), userID)
	pipe.Expire(ctx, s.activeConnectionsKey(roomID), defaultConnectionTTL)

	// บันทึก connection ลง cache
	connKey := s.connectionKey(roomID, userID)
	pipe.Set(ctx, connKey, time.Now().Unix(), defaultConnectionTTL)

	// ดำเนินการ
	_, err := pipe.Exec(ctx)
	return err
}

// ลบ connection จาก cache
func (s *RoomCacheService) RemoveConnection(ctx context.Context, roomID, userID string) error {
	pipe := s.redis.Pipeline()

	// ลบ userID จาก list active connections
	pipe.SRem(ctx, s.activeConnectionsKey(roomID), userID)
	pipe.Del(ctx, s.connectionKey(roomID, userID))

	// ดำเนินการ
	_, err := pipe.Exec(ctx)
	return err
}

// นับจำนวน connection ใน room
func (s *RoomCacheService) GetActiveConnectionsCount(ctx context.Context, roomID string) (int64, error) {
	return s.redis.SCard(ctx, s.activeConnectionsKey(roomID)).Result()
}

// ดึง list userID จาก list active connections
	func (s *RoomCacheService) GetActiveUsers(ctx context.Context, roomID string) ([]string, error) {
	return s.redis.SMembers(ctx, s.activeConnectionsKey(roomID)).Result()
}
