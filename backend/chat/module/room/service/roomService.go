package service

import (
	chatUtils "chat/module/chat/utils"
	"chat/module/room/dto"
	"chat/module/room/model"
	roomUtils "chat/module/room/utils"
	"chat/module/user/service"
	"chat/pkg/config"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	serviceHelper "chat/pkg/helpers/service"
	"chat/pkg/validator"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type RoomService struct {
	*queries.BaseService[model.Room]
	userService  *service.UserService
	fkValidator  *serviceHelper.ForeignKeyValidator
	eventEmitter *roomUtils.RoomEventEmitter
	cache       *roomUtils.RoomCacheService
	hub         *chatUtils.Hub
}

func NewRoomService(db *mongo.Database, redis *redis.Client, cfg *config.Config, hub *chatUtils.Hub) *RoomService {
	bus := kafka.New(cfg.Kafka.Brokers, "room-service")
	if err := bus.Start(); err != nil {
		log.Printf("[ERROR] Failed to start Kafka bus: %v", err)
	}

	return &RoomService{
		BaseService:  queries.NewBaseService[model.Room](db.Collection("rooms")),
		userService:  service.NewUserService(db),
		fkValidator:  serviceHelper.NewForeignKeyValidator(db),
		eventEmitter: roomUtils.NewRoomEventEmitter(bus, cfg),
		cache:       roomUtils.NewRoomCacheService(redis),
		hub:         hub,
	}
}

// ดึง list room จาก cache
func (s *RoomService) GetRooms(ctx context.Context, opts queries.QueryOptions) (*queries.Response[model.Room], error) {

	// ตรวจสอบว่า filter มีค่าไหม
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}

	// ดึง list room จาก database
	return s.FindAll(ctx, opts)
}

// ดึง room จาก cache
func (s *RoomService) GetRoomById(ctx context.Context, roomID primitive.ObjectID) (*model.Room, error) {

	// ดึง room จาก cache
	if room, err := s.cache.GetRoom(ctx, roomID.Hex()); err == nil && room != nil {
		return room, nil
	}

	// ดึง room จาก database
	room, err := s.FindOneById(ctx, roomID.Hex())
	if err != nil {
		return nil, err
	}

	// บันทึก room ลง cache
	result := &room.Data[0]
	if err := s.cache.SaveRoom(ctx, result); err != nil {
		log.Printf("[WARN] Failed to cache room: %v", err)
	}

	// คืนค่า room
	return result, nil
}

// สร้าง room
func (s *RoomService) CreateRoom(ctx context.Context, createDto *dto.CreateRoomDto) (*model.Room, error) {

	// ตรวจสอบว่า createDto มีค่าไหม (**ทำ lib เอาไว้**)
	if err := validator.ValidateStruct(createDto); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// ตรวจสอบว่า members มีค่าไหม
	if err := s.validateMembers(ctx, createDto); err != nil {
		return nil, err
	}

	// กำหนด room type (default เป็น normal ถ้าไม่ได้ระบุ)
	roomType := createDto.Type
	if roomType == "" {
		roomType = model.RoomTypeNormal
	}

	// สร้าง room dto
	r := &model.Room{
		Name:      createDto.Name,
		Type:      roomType,
		Capacity:  createDto.Capacity,
		CreatedBy: createDto.ToObjectID(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Members:   roomUtils.ConvertToObjectIDs(createDto.Members),
	}

	// สร้าง room ลงใน database
	resp, err := s.Create(ctx, *r)
	if err != nil {
		return nil, fmt.Errorf("failed to create room: %w", err)
	}

	// บันทึก room ลง cache
	created := &resp.Data[0]
	s.handleRoomCreated(ctx, created)
	return created, nil
}

// อัพเดต room
func (s *RoomService) UpdateRoom(ctx context.Context, id string, room *model.Room) (*model.Room, error) {

	// อัพเดต room
	room.UpdatedAt = time.Now()

	// อัพเดต room ลงใน database
	resp, err := s.UpdateById(ctx, id, *room)
	if err != nil {
		return nil, err
	}

	// บันทึก room ลง cache
	updated := &resp.Data[0]
	s.cache.SaveRoom(ctx, updated)
	return updated, nil
}

// ลบ room
func (s *RoomService) DeleteRoom(ctx context.Context, id string) (*model.Room, error) {

	// ลบ room จาก database
	room, err := s.DeleteById(ctx, id)
	if err != nil {
		return nil, err
	}

	// ลบ room จาก cache
	deleted := &room.Data[0]
	s.handleRoomDeleted(ctx, deleted)
	return deleted, nil
}

// ตรวจสอบว่ามี user นั้นอยู่ใน room หรือไม่
func (s *RoomService) IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {

	// ดึง room จาก cache มา check
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}

	// แปลง userID เป็น ObjectID
	uid, _ := primitive.ObjectIDFromHex(userID)

	// ตรวจสอบว่ามี user นั้นอยู่ใน room หรือไม่
	return roomUtils.ContainsMember(room.Members, uid), nil
}

// ตรวจสอบว่ามี user นั้นอยู่ใน room และมี connection นั้นอยู่ใน room หรือไม่ (สำคัญ) 
func (s *RoomService) ValidateAndTrackConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error {

	// ดึง room จาก cache มา check
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return fmt.Errorf("room not found: %w", err)
	}

	// ตรวจสอบว่ามี user นั้นอยู่ใน room หรือไม่
	if isMember, err := s.IsUserInRoom(ctx, roomID, userID); err != nil || !isMember {
		return fmt.Errorf("user is not a member of this room")
	}

	// ตรวจสอบว่ามี connection นั้นอยู่ใน room หรือไม่
	if count, err := s.cache.GetActiveConnectionsCount(ctx, roomID.Hex()); err == nil && count >= int64(room.Capacity) {
		return fmt.Errorf("room is at capacity: %d/%d", count, room.Capacity)
	}

	// บันทึก connection ลง cache
	return s.cache.TrackConnection(ctx, roomID.Hex(), userID)
}

// ดึงข้อมูลของ room
func (s *RoomService) GetRoomStatus(ctx context.Context, roomID primitive.ObjectID) (map[string]interface{}, error) {

	// ดึง room จาก cache
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return nil, err
	}

	// ดึงจำนวน connection จาก cache
	activeCount, _ := s.cache.GetActiveConnectionsCount(ctx, roomID.Hex())
	activeUsers, _ := s.cache.GetActiveUsers(ctx, roomID.Hex())

	// คืนค่า room status
	return map[string]interface{}{
		"roomId":      roomID.Hex(),
		"capacity":    room.Capacity,
		"memberCount": len(room.Members),
		"activeCount": activeCount,
		"activeUsers": activeUsers,
		"lastActive":  room.UpdatedAt,
	}, nil
}

// ตรวจสอบว่ามี user นั้นอยู่ใน room หรือไม่
func (s *RoomService) validateMembers(ctx context.Context, createDto *dto.CreateRoomDto) error {

	// ตรวจสอบว่ามี user นั้นอยู่ใน room หรือไม่
	if err := s.fkValidator.ValidateForeignKey(ctx, "users", createDto.CreatedBy); err != nil {
		return fmt.Errorf("foreign key validation error: %w", err)
	}

	// ตรวจสอบว่ามี user นั้นอยู่ใน room หรือไม่
	for i, memberID := range createDto.Members {

		// ตรวจสอบ foreign key มีค่าไหมตรงกับที่ reference ไหม
		if err := s.fkValidator.ValidateForeignKey(ctx, "users", memberID); err != nil {
			return fmt.Errorf("invalid member at index %d: %w", i, err)
		}
	}

	// คืนค่าเป็นสำเร็จ
	return nil
}

// บันทึก room ลง cache
func (s *RoomService) handleRoomCreated(ctx context.Context, room *model.Room) {

	// บันทึก room ลง cache
	if err := s.cache.SaveRoom(ctx, room); err != nil {
		log.Printf("[WARN] Failed to cache new room: %v", err)
	}

	// สร้าง topic สำหรับ room
	if err := s.eventEmitter.EnsureRoomTopic(ctx, room.ID); err != nil {
		log.Printf("[WARN] Failed to create Kafka topic for room: %v", err)
	}
}

// ลบ room จาก cache
func (s *RoomService) handleRoomDeleted(ctx context.Context, room *model.Room) {

	// ลบ room จาก cache
	if err := s.cache.DeleteRoom(ctx, room.ID.Hex()); err != nil {
		log.Printf("[WARN] Failed to delete room from cache: %v", err)
	}

	// ลบ topic สำหรับ room
	if err := s.eventEmitter.DeleteRoomTopic(ctx, room.ID); err != nil {
		log.Printf("[WARN] Failed to delete Kafka topic for room: %v", err)
	}
}

// ลบ user จาก room
func (s *RoomService) RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (*model.Room, error) {

	// แปลง userID เป็น ObjectID
	uid, _ := primitive.ObjectIDFromHex(userID)

	// ดึง room จาก cache
	r, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return nil, err
	}

	// ลบ user จาก room
	r.Members = roomUtils.RemoveMember(r.Members, uid)
	r.UpdatedAt = time.Now()

	// อัพเดต room ลงใน database
	resp, err := s.UpdateById(ctx, roomID.Hex(), *r)
	if err != nil {
		return nil, err
	}

	// บันทึก room ลง cache
	updated := &resp.Data[0]

	// บันทึก room ลง cache
	if err := s.cache.SaveRoom(ctx, updated); err != nil {
		log.Printf("[WARN] Failed to update room cache after removing member: %v", err)
	}

	// คืนค่า room
	return updated, err
}

// ลบ connection จาก cache
func (s *RoomService) RemoveConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error {

	// ลบ connection จาก cache
	if err := s.cache.RemoveConnection(ctx, roomID.Hex(), userID); err != nil {
		log.Printf("[WARN] Failed to remove connection: %v", err)
	}
	return nil
}

// นับจำนวน connection ใน room
func (s *RoomService) GetActiveConnectionsCount(ctx context.Context, roomID primitive.ObjectID) (int64, error) {
	return s.cache.GetActiveConnectionsCount(ctx, roomID.Hex())
}

// ตรวจสอบว่า user สามารถส่งข้อความในห้องนี้ได้หรือไม่
func (s *RoomService) CanUserSendMessage(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	// ดึง room จาก cache
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, fmt.Errorf("room not found: %w", err)
	}

	// ตรวจสอบว่าเป็นห้อง read-only หรือไม่
	if room.IsReadOnly() {
		log.Printf("[RoomService] User %s cannot send message in read-only room %s", userID, roomID.Hex())
		return false, nil
	}

	// ตรวจสอบว่า user เป็นสมาชิกของห้องหรือไม่
	isMember, err := s.IsUserInRoom(ctx, roomID, userID)
	if err != nil || !isMember {
		return false, fmt.Errorf("user is not a member of this room")
	}

	return true, nil
}

// ตรวจสอบว่า user สามารถส่ง sticker ในห้องนี้ได้หรือไม่
func (s *RoomService) CanUserSendSticker(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	return s.CanUserSendMessage(ctx, roomID, userID)
}

// ตรวจสอบว่า user สามารถส่ง reaction ในห้องนี้ได้หรือไม่
func (s *RoomService) CanUserSendReaction(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	return s.CanUserSendMessage(ctx, roomID, userID)
}

// เพิ่ม user ลง room
func (s *RoomService) AddUserToRoom(ctx context.Context, roomID, userID string) error {

	// แปลง roomID เป็น ObjectID
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return fmt.Errorf("invalid room ID: %w", err)
	}

	// ดึง room จาก cache
	room, err := s.GetRoomById(ctx, roomObjID)
	if err != nil {
		return fmt.Errorf("failed to get room: %w", err)
	}

	// แปลง userID เป็น ObjectID
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// ตรวจสอบว่ามี user นั้นอยู่ใน room หรือไม่
	for _, member := range room.Members {
		if member == userObjID {
			return nil // มี user นั้นอยู่ใน room แล้ว
		}
	}

	// เพิ่ม user ลง room
	room.Members = append(room.Members, userObjID)
	room.UpdatedAt = time.Now()

	// อัพเดต room ลงใน database
	if _, err := s.UpdateById(ctx, roomID, *room); err != nil {
		return fmt.Errorf("failed to update room: %w", err)
	}

	// บันทึก room ลง cache
	if err := s.cache.SaveRoom(ctx, room); err != nil {
		log.Printf("[WARN] Failed to update room cache after adding member: %v", err)
	}

	// ส่ง event ไปยัง topic สำหรับ room_member_joined
	s.eventEmitter.EmitRoomMemberJoined(ctx, roomObjID, userObjID)

	return nil
}

// เข้า room (** Broadcast เท่านั้น ไม่มี Kafka หรือ db มาเกี่ยวข้อง **)
func (s *RoomService) JoinRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {

	// ดึง room จาก cache
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return fmt.Errorf("room not found: %w", err)
	}

	// แปลง userID เป็น ObjectID
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// ตรวจสอบว่ามี user นั้นอยู่ใน room หรือไม่
	if roomUtils.ContainsMember(room.Members, userObjID) {
		return fmt.Errorf("user is already a member of this room")
	}

	// ตรวจสอบว่ามี capacity หรือไม่
	if len(room.Members) >= room.Capacity {
		return fmt.Errorf("room is at full capacity (%d/%d)", len(room.Members), room.Capacity)
	}

	// เพิ่ม user ลง room members
	room.Members = append(room.Members, userObjID)
	room.UpdatedAt = time.Now()

	// อัพเดต room ลงใน database
	if _, err := s.UpdateById(ctx, roomID.Hex(), *room); err != nil {
		return fmt.Errorf("failed to update room: %w", err)
	}

	// บันทึก room ลง cache
	if err := s.cache.SaveRoom(ctx, room); err != nil {
		log.Printf("[WARN] Failed to update room cache after adding member: %v", err)
	}

	// ส่ง event ไปยัง topic สำหรับ room_member_joined
	s.broadcastUserJoined(roomID.Hex(), userID)

	log.Printf("[Room] User %s successfully joined room %s (%d/%d)", userID, roomID.Hex(), len(room.Members), room.Capacity)
	return nil
}

// เข้า room (** Broadcast เท่านั้น ไม่มี Kafka หรือ db มาเกี่ยวข้อง **)
func (s *RoomService) LeaveRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {

	// แปลง userID เป็น ObjectID
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// ดึง room จาก cache
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return fmt.Errorf("room not found: %w", err)
	}

	// ตรวจสอบว่ามี user นั้นอยู่ใน room หรื
	if !roomUtils.ContainsMember(room.Members, userObjID) {
		return fmt.Errorf("user is not a member of this room")
	}

	// ลบ user จาก room members
	room.Members = roomUtils.RemoveMember(room.Members, userObjID)
	room.UpdatedAt = time.Now()

	// อัพเดต room ลงใน database
	if _, err := s.UpdateById(ctx, roomID.Hex(), *room); err != nil {
		return fmt.Errorf("failed to update room: %w", err)
	}

	// บันทึก room ลง cache
	if err := s.cache.SaveRoom(ctx, room); err != nil {
		log.Printf("[WARN] Failed to update room cache after removing member: %v", err)
	}

	// ส่ง event ไปยัง topic สำหรับ room_member_left
	s.broadcastUserLeft(roomID.Hex(), userID)

	log.Printf("[Room] User %s successfully left room %s (%d/%d)", userID, roomID.Hex(), len(room.Members), room.Capacity)
	return nil
}

// ส่ง event ไปยัง topic สำหรับ room_member_joined
func (s *RoomService) broadcastUserJoined(roomID, userID string) {
	event := map[string]interface{}{
		"type": "user_joined",
		"payload": map[string]interface{}{
			"roomId":    roomID,
			"userId":    userID,
			"timestamp": time.Now(),
		},
		"timestamp": time.Now(),
	}

	// Marshal event to JSON
	eventBytes, err := json.Marshal(event)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal user_joined event: %v", err)
		return
	}

	// Broadcast only to active WebSocket connections in the room
	s.hub.BroadcastToRoom(roomID, eventBytes)
	log.Printf("[Broadcast] User joined event sent to room %s (WebSocket only)", roomID)
}

// ส่ง event ไปยัง topic สำหรับ room_member_left
func (s *RoomService) broadcastUserLeft(roomID, userID string) {
	event := map[string]interface{}{
		"type": "user_left",
		"payload": map[string]interface{}{
			"roomId":    roomID,
			"userId":    userID,
			"timestamp": time.Now(),
		},
		"timestamp": time.Now(),
	}

	// แปลง event เป็น JSON
	eventBytes, err := json.Marshal(event)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal user_left event: %v", err)
		return
	}

	// ส่ง event ไปยัง topic สำหรับ room_member_left
	s.hub.BroadcastToRoom(roomID, eventBytes)
	log.Printf("[Broadcast] User left event sent to room %s (WebSocket only)", roomID)
}