package service

import (
	chatUtils "chat/module/chat/utils"
	"chat/module/room/dto"
	"chat/module/room/model"
	roomUtils "chat/module/room/utils"
	userService "chat/module/user/service"
	"chat/pkg/config"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	serviceHelper "chat/pkg/helpers/service"
	"chat/pkg/middleware"
	"chat/pkg/validator"
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type RoomServiceImpl struct {
	*queries.BaseService[model.Room]
	userService      *userService.UserService
	fkValidator      *serviceHelper.ForeignKeyValidator
	eventEmitter     *roomUtils.RoomEventEmitter
	cache            *roomUtils.RoomCacheService
	hub              *chatUtils.Hub
	db               *mongo.Database
	memberHelper     *roomUtils.RoomMemberHelper
}

type RoomService interface {
	GetRooms(ctx context.Context, opts queries.QueryOptions, userId string) (*queries.Response[dto.ResponseRoomDto], error)
	GetRoomById(ctx context.Context, roomID primitive.ObjectID) (*model.Room, error)
	GetRoomMemberById(ctx context.Context, roomID primitive.ObjectID) (*dto.ResponseRoomMemberDto, error)
	CreateRoom(ctx context.Context, createDto *dto.CreateRoomDto) (*model.Room, error)
	UpdateRoom(ctx context.Context, id string, updateDto *dto.UpdateRoomDto) (*model.Room, error)
	DeleteRoom(ctx context.Context, id string) (*model.Room, error)
	IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
	ValidateAndTrackConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error
	GetRoomStatus(ctx context.Context, roomID primitive.ObjectID) (map[string]interface{}, error)
	RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (*model.Room, error)
	RemoveConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error
	GetActiveConnectionsCount(ctx context.Context, roomID primitive.ObjectID) (int64, error)
	CanUserSendMessage(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
	CanUserSendSticker(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
	CanUserSendReaction(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
	AddUserToRoom(ctx context.Context, roomID, userID string) error
	JoinRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error
	LeaveRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error
	GetAllRoomForUser(ctx context.Context, userID string) ([]dto.ResponseAllRoomForUserDto, error)
	GetRoomsForMe(ctx context.Context, userID string) ([]dto.ResponseRoomDto, error)
}

func NewRoomService(db *mongo.Database, redis *redis.Client, cfg *config.Config, hub *chatUtils.Hub) RoomService {
	bus := kafka.New(cfg.Kafka.Brokers, "room-service")
	if err := bus.Start(); err != nil {
		log.Printf("[ERROR] Failed to start Kafka bus: %v", err)
	}

	userSvc := userService.NewUserService(db)
	cache := roomUtils.NewRoomCacheService(redis)
	eventEmitter := roomUtils.NewRoomEventEmitter(bus, cfg)
	
	service := &RoomServiceImpl{
		BaseService:      queries.NewBaseService[model.Room](db.Collection("rooms")),
		userService:      userSvc,
		fkValidator:      serviceHelper.NewForeignKeyValidator(db),
		eventEmitter:     eventEmitter,
		cache:            cache,
		hub:              hub,
		db:               db,
		memberHelper:     roomUtils.NewRoomMemberHelper(db, cache, eventEmitter, hub),
	}
	
	return service
}

// GetRooms retrieves list of rooms from cache
func (s *RoomServiceImpl) GetRooms(ctx context.Context, opts queries.QueryOptions, userId string) (*queries.Response[dto.ResponseRoomDto], error) {
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}
	resp, err := s.FindAll(ctx, opts)
	if err != nil {
		return nil, err
	}

	result := &queries.Response[dto.ResponseRoomDto]{
		Data: make([]dto.ResponseRoomDto, len(resp.Data)),
	}

	for i, room := range resp.Data {
		result.Data[i] = dto.ResponseRoomDto{
			ID: room.ID,
			Name: room.Name,
			Type: room.Type,
			CreatedBy: room.CreatedBy,
			Image: room.Image,
			CreatedAt: room.CreatedAt,
			UpdatedAt: room.UpdatedAt,
			Metadata: room.Metadata,
		}
	}

	return result, nil
}

func (s *RoomServiceImpl) GetRoomMemberById(ctx context.Context, roomId primitive.ObjectID) (*dto.ResponseRoomMemberDto, error) {
	if room, err := s.cache.GetRoom(ctx, roomId.Hex()); err == nil && room != nil {
		members := make([]string, len(room.Members))
		for i, m := range room.Members {
			members[i] = m.Hex()
		}
		return &dto.ResponseRoomMemberDto{
			ID: room.ID,
			Members: members,
		}, nil
	}
	return nil, errors.New("room not found")
}

// ดึง room จาก cache
func (s *RoomServiceImpl) GetRoomById(ctx context.Context, roomID primitive.ObjectID) (*model.Room, error) {
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

	return result, nil
}

// สร้าง room
func (s *RoomServiceImpl) CreateRoom(ctx context.Context, createDto *dto.CreateRoomDto) (*model.Room, error) {
	if err := validator.ValidateStruct(createDto); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	members := createDto.MembersToObjectIDs()
	createdBy := createDto.CreatedByToObjectID()

	// Ensure createdBy is in members
	alreadyMember := false
	for _, m := range members {
		if m == createdBy {
			alreadyMember = true
			break
		}
	}
	if !alreadyMember && !createdBy.IsZero() {
		members = append(members, createdBy)
	}

	if err := s.validateMembers(ctx, createDto); err != nil {
		return nil, err
	}

	roomType := createDto.Type
	if roomType == "" {
		roomType = model.RoomTypeNormal
	}

	r := &model.Room{
		Name:      createDto.Name,
		Type:      roomType,
		Capacity:  createDto.Capacity,
		CreatedBy: createdBy,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Members:   members,
		Image:     createDto.Image,
	}

	resp, err := s.Create(ctx, *r)
	if err != nil {
		return nil, fmt.Errorf("failed to create room: %w", err)
	}

	created := &resp.Data[0]
	s.handleRoomCreated(ctx, created)
	return created, nil
}

// อัพเดต room
func (s *RoomServiceImpl) UpdateRoom(ctx context.Context, id string, updateDto *dto.UpdateRoomDto) (*model.Room, error) {
	roomObjID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	oldRoom, err := s.GetRoomById(ctx, roomObjID)
	if err != nil {
		return nil, err
	}

	// Merge fields
	updatedRoom := &model.Room{
		ID: oldRoom.ID,
		Name: oldRoom.Name,
		Type: oldRoom.Type,
		Capacity: oldRoom.Capacity,
		Members: oldRoom.Members,
		CreatedBy: oldRoom.CreatedBy, // primitive.ObjectID for DB
		Image: oldRoom.Image,
		CreatedAt: oldRoom.CreatedAt,
		UpdatedAt: oldRoom.UpdatedAt,
		Metadata: oldRoom.Metadata,
	}
	updatedRoom.Name = updateDto.Name
	updatedRoom.Type = updateDto.Type
	updatedRoom.Capacity = updateDto.Capacity
	if updateDto.Members != nil && len(updateDto.Members) > 0 {
		updatedRoom.Members = updateDto.MembersToObjectIDs()
	}
	if updateDto.Image != "" {
		updatedRoom.Image = updateDto.Image
	}
	updatedRoom.UpdatedAt = time.Now()
	// createdBy: use from updateDto if present, else preserve
	if updateDto.CreatedBy != "" {
		updatedRoom.CreatedBy = updateDto.CreatedByToObjectID()
	}
	// Ensure createdBy is in members
	found := false
	for _, m := range updatedRoom.Members {
		if m == updatedRoom.CreatedBy {
			found = true
			break
		}
	}
	if !found && !updatedRoom.CreatedBy.IsZero() {
		updatedRoom.Members = append(updatedRoom.Members, updatedRoom.CreatedBy)
	}

	// Build $set update
	setFields := bson.M{
		"name":      updatedRoom.Name,
		"type":      updatedRoom.Type,
		"capacity":  updatedRoom.Capacity,
		"updatedAt": updatedRoom.UpdatedAt,
		"createdBy": updatedRoom.CreatedBy,
		"members":   updatedRoom.Members,
	}
	if updateDto.Image != "" {
		setFields["image"] = updatedRoom.Image
	}

	filter := bson.M{"_id": roomObjID}
	update := bson.M{"$set": setFields}

	// Try to get the collection via public getter
	var updateErr error
	if getter, ok := interface{}(s.BaseService).(interface{ GetMongoCollection() *mongo.Collection }); ok {
		_, updateErr = getter.GetMongoCollection().UpdateOne(ctx, filter, update)
	} else if getter, ok := interface{}(s.BaseService).(interface{ GetDBCollection() *mongo.Collection }); ok {
		_, updateErr = getter.GetDBCollection().UpdateOne(ctx, filter, update)
	} else if getter, ok := interface{}(s.BaseService).(interface{ GetMongo() *mongo.Database; GetCollectionName() string }); ok {
		_, updateErr = getter.GetMongo().Collection(getter.GetCollectionName()).UpdateOne(ctx, filter, update)
	} else {
		return nil, errors.New("cannot access mongo collection for update")
	}
	if updateErr != nil {
		return nil, updateErr
	}

	// Save updated room to cache (if cache is enabled)
	if s.cache != nil {
		_ = s.cache.SaveRoom(ctx, updatedRoom)
	}

	return updatedRoom, nil
}

// ลบ room
func (s *RoomServiceImpl) DeleteRoom(ctx context.Context, id string) (*model.Room, error) {
	room, err := s.DeleteById(ctx, id)
	if err != nil {
		return nil, err
	}

	deleted := &room.Data[0]
	s.handleRoomDeleted(ctx, deleted)
	return deleted, nil
}

// ตรวจสอบว่ามี user นั้นอยู่ใน room หรือไม่
func (s *RoomServiceImpl) IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}
	uid, _ := primitive.ObjectIDFromHex(userID)
	return roomUtils.ContainsMember(room.Members, uid), nil
}

// ตรวจสอบว่ามี user นั้นอยู่ใน room และมี connection นั้นอยู่ใน room หรือไม่
func (s *RoomServiceImpl) ValidateAndTrackConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return fmt.Errorf("room not found: %w", err)
	}

	return roomUtils.ValidateAndTrackConnection(ctx, room, userID, s.cache)
}

// ดึงข้อมูลของ room
func (s *RoomServiceImpl) GetRoomStatus(ctx context.Context, roomID primitive.ObjectID) (map[string]interface{}, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return nil, err
	}

	return roomUtils.GetRoomStatus(ctx, room, s.cache)
}

// Delegate methods to helpers
func (s *RoomServiceImpl) RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (*model.Room, error) {
	return s.memberHelper.RemoveUserFromRoom(ctx, roomID, userID)
}

func (s *RoomServiceImpl) RemoveConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	return roomUtils.RemoveConnection(ctx, roomID, userID, s.cache)
}

func (s *RoomServiceImpl) GetActiveConnectionsCount(ctx context.Context, roomID primitive.ObjectID) (int64, error) {
	return roomUtils.GetActiveConnectionsCount(ctx, roomID, s.cache)
}

// CanUserSendMessage ตรวจสอบว่า user สามารถส่งข้อความได้หรือไม่
func (s *RoomServiceImpl) CanUserSendMessage(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	// ดึงข้อมูลห้อง
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, fmt.Errorf("failed to get room: %w", err)
	}

	// แปลง userID เป็น ObjectID
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return false, fmt.Errorf("invalid user ID: %w", err)
	}

	// ตรวจสอบว่า user อยู่ในห้องหรือไม่
	if !roomUtils.ContainsMember(room.Members, uid) {
		return false, fmt.Errorf("user is not a member of this room")
	}

	// ตรวจสอบว่าห้องเป็น read-only หรือไม่
	if room.IsReadOnly() {
		userRoleVal := ctx.Value("userRole")
		userRole, ok := userRoleVal.(string)
		if !ok || userRole == "" {
			log.Printf("[ERROR] userRole missing or not a string in context: %#v", userRoleVal)
			return false, fmt.Errorf("user role not found in context")
		}
		log.Printf("[DEBUG] userRole in context: %s", userRole)
		// อนุญาตให้เฉพาะ Administrator และ Staff สามารถส่งข้อความในห้อง read-only ได้
		if userRole != middleware.RoleAdministrator && userRole != middleware.RoleStaff {
			return false, fmt.Errorf("room is read-only and user does not have write permission")
		}
	}

	return true, nil
}

func (s *RoomServiceImpl) CanUserSendSticker(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}
	return roomUtils.CanUserSendSticker(ctx, room, userID)
}

func (s *RoomServiceImpl) CanUserSendReaction(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}
	return roomUtils.CanUserSendReaction(ctx, room, userID)
}

func (s *RoomServiceImpl) AddUserToRoom(ctx context.Context, roomID, userID string) error {
	return s.memberHelper.AddUserToRoom(ctx, roomID, userID)
}

func (s *RoomServiceImpl) JoinRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	return s.memberHelper.JoinRoom(ctx, roomID, userID)
}

func (s *RoomServiceImpl) LeaveRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	return s.memberHelper.LeaveRoom(ctx, roomID, userID)
}

// GetAllRoomForUser ดึงห้องทั้งหมดที่ user มองเห็น (ไม่เอา group room)
func (s *RoomServiceImpl) GetAllRoomForUser(ctx context.Context, userID string) ([]dto.ResponseAllRoomForUserDto, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format")
	}
	opts := queries.QueryOptions{
		Filter: map[string]interface{}{
			"type": map[string]interface{}{ "$in": []string{"normal", "readonly"} },
			"$or": []map[string]interface{}{
				{"metadata.isGroupRoom": map[string]interface{}{"$ne": true}},
				{"metadata.isGroupRoom": map[string]interface{}{"$exists": false}},
			},
		},
	}
	resp, err := s.FindAll(ctx, opts)
	if err != nil {
		return nil, err
	}
	result := make([]dto.ResponseAllRoomForUserDto, 0, len(resp.Data))
	for _, room := range resp.Data {
		isMember := false
		for _, memberID := range room.Members {
			if memberID == userObjID {
				isMember = true
				break
			}
		}
		// Exclude if user is a member or if it's a group room
		if isMember {
			continue
		}
		if room.Metadata != nil {
			if isGroup, ok := room.Metadata["isGroupRoom"]; ok && isGroup == true {
				continue
			}
		}
		canJoin := false
		if room.Type == "normal" || room.Type == "readonly" {
			if room.Capacity == 0 || len(room.Members) < room.Capacity {
				canJoin = true
			}
		}
		memberCount := len(room.Members)
		result = append(result, dto.ResponseAllRoomForUserDto{
			ID: room.ID,
			Name: room.Name,
			Type: room.Type,
			Capacity: room.Capacity,
			CreatedBy: room.CreatedBy, // string for response
			Image: room.Image,
			CreatedAt: room.CreatedAt,
			UpdatedAt: room.UpdatedAt,
			Metadata: room.Metadata,
			IsMember: false,
			CanJoin:  canJoin,
			MemberCount: memberCount, // เพิ่ม field นี้
		})
	}
	return result, nil
}

// GetRoomsForMe ดึงเฉพาะห้องที่ user เป็น member
func (s *RoomServiceImpl) GetRoomsForMe(ctx context.Context, userID string) ([]dto.ResponseRoomDto, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format")
	}
	opts := queries.QueryOptions{
		Filter: map[string]interface{}{
			"members": userObjID,
			"type": map[string]interface{}{ "$in": []string{"normal", "readonly"} },
			"$or": []map[string]interface{}{
				{"metadata.isGroupRoom": map[string]interface{}{"$ne": true}},
				{"metadata.isGroupRoom": map[string]interface{}{"$exists": false}},
			},
		},
	}
	resp, err := s.FindAll(ctx, opts)
	if err != nil {
		return nil, err
	}
	result := make([]dto.ResponseRoomDto, 0, len(resp.Data))
	for _, room := range resp.Data {
		result = append(result, dto.ResponseRoomDto{
			ID: room.ID,
			Name: room.Name,
			Type: room.Type,
			Capacity: room.Capacity,
			CreatedBy: room.CreatedBy, // string for response
			Image: room.Image,
			CreatedAt: room.CreatedAt,
			UpdatedAt: room.UpdatedAt,
			Metadata: room.Metadata,
		})
	}
	return result, nil
}


// Helper methods
func (s *RoomServiceImpl) validateMembers(ctx context.Context, createDto *dto.CreateRoomDto) error {
	if err := s.fkValidator.ValidateForeignKey(ctx, "users", createDto.CreatedBy); err != nil {
		return fmt.Errorf("foreign key validation error: %w", err)
	}

	for _, memberID := range createDto.Members {
		if err := s.fkValidator.ValidateForeignKey(ctx, "users", memberID); err != nil {
			return fmt.Errorf("member validation error: %w", err)
		}
	}
	return nil
}

func (s *RoomServiceImpl) handleRoomCreated(ctx context.Context, room *model.Room) {
	if err := s.cache.SaveRoom(ctx, room); err != nil {
		log.Printf("[WARN] Failed to cache created room: %v", err)
	}

	log.Printf("[INFO] Room created: %s", room.ID.Hex())
}

func (s *RoomServiceImpl) handleRoomDeleted(ctx context.Context, room *model.Room) {
	if err := s.cache.DeleteRoom(ctx, room.ID.Hex()); err != nil {
		log.Printf("[WARN] Failed to delete room from cache: %v", err)
	}

	log.Printf("[INFO] Room deleted: %s", room.ID.Hex())
}