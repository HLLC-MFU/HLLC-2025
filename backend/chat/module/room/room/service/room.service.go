package service

import (
	chatUtils "chat/module/chat/utils"
	memberUtils "chat/module/room/member/utils"
	"chat/module/room/room/dto"
	"chat/module/room/room/model"
	sharedCache "chat/module/room/shared/cache"
	sharedEvents "chat/module/room/shared/events"
	sharedUtils "chat/module/room/shared/utils"
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
	userService          *userService.UserService
	fkValidator          *serviceHelper.ForeignKeyValidator
	eventEmitter         *sharedEvents.RoomEventEmitter
	cache                *sharedCache.RoomCacheService
	hub                  *chatUtils.Hub
	db                   *mongo.Database
	memberHelper         *memberUtils.RoomMemberHelper
	statusChangeCallback func(ctx context.Context, roomID string, newStatus string)
}

type RoomService interface {
	GetRooms(ctx context.Context, opts queries.QueryOptions, userId string) (*queries.Response[dto.ResponseRoomDto], error)
	GetRoomsByType(ctx context.Context, roomType string, page int64, limit int64, userID string) (*dto.ResponseRoomsByTypeDto, error)
	GetRoomById(ctx context.Context, roomID primitive.ObjectID) (*model.Room, error)
	GetRoomMemberById(ctx context.Context, roomID primitive.ObjectID, page int64, limit int64) (*dto.ResponseRoomMemberDto, error)
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
	DisconnectAllUsersFromRoom(ctx context.Context, roomID primitive.ObjectID) error
	SetStatusChangeCallback(callback func(ctx context.Context, roomID string, newStatus string))
}

func NewRoomService(db *mongo.Database, redis *redis.Client, cfg *config.Config, hub *chatUtils.Hub) RoomService {
	bus := kafka.New(cfg.Kafka.Brokers, "room-service")
	if err := bus.Start(); err != nil {
		log.Printf("[ERROR] Failed to start Kafka bus: %v", err)
	}

	userSvc := userService.NewUserService(db)
	cache := sharedCache.NewRoomCacheService(redis)
	eventEmitter := sharedEvents.NewRoomEventEmitter(bus, cfg)

	service := &RoomServiceImpl{
		BaseService:  queries.NewBaseService[model.Room](db.Collection("rooms")),
		userService:  userSvc,
		fkValidator:  serviceHelper.NewForeignKeyValidator(db),
		eventEmitter: eventEmitter,
		cache:        cache,
		hub:          hub,
		db:           db,
		memberHelper: memberUtils.NewRoomMemberHelper(db, cache, eventEmitter, hub),
	}

	return service
}

// GetRooms retrieves list of rooms from cache
func (s *RoomServiceImpl) GetRooms(ctx context.Context, opts queries.QueryOptions, userId string) (*queries.Response[dto.ResponseRoomDto], error) {

	resp, err := s.FindAll(ctx, opts)
	if err != nil {
		return nil, err
	}

	result := &queries.Response[dto.ResponseRoomDto]{
		Data: make([]dto.ResponseRoomDto, len(resp.Data)),
	}

	for i, room := range resp.Data {
		result.Data[i] = dto.ResponseRoomDto{
			ID:          room.ID,
			Name:        room.Name,
			Type:        room.Type,
			Capacity:    room.Capacity,
			CreatedBy:   room.CreatedBy,
			Image:       room.Image,
			CreatedAt:   room.CreatedAt,
			UpdatedAt:   room.UpdatedAt,
			Metadata:    room.Metadata,
			MemberCount: len(room.Members),
			Status:      room.Status,
			Schedule:    room.Schedule, // เพิ่มฟิลด์ schedule
		}
	}

	return result, nil
}

// GetRoomsByType ดึงรายการห้องตาม roomType พร้อม pagination
func (s *RoomServiceImpl) GetRoomsByType(ctx context.Context, roomType string, page int64, limit int64, userID string) (*dto.ResponseRoomsByTypeDto, error) {
	// Validate roomType
	if roomType == "" {
		return nil, errors.New("roomType is required")
	}

	// Build filter based on roomType
	var filter map[string]interface{}
	
	switch roomType {
	case "normal", "readonly":
		// Regular room types
		filter = map[string]interface{}{
			"type": roomType,
		}
	case "major":
		// Major group rooms - check metadata
		filter = map[string]interface{}{
			"metadata.isGroupRoom": true,
			"metadata.groupType":   "major",
		}
	case "school":
		// School group rooms - check metadata
		filter = map[string]interface{}{
			"metadata.isGroupRoom": true,
			"metadata.groupType":   "school",
		}
	default:
		return nil, fmt.Errorf("invalid roomType: %s. Valid types: normal, readonly, major, school", roomType)
	}

	// Build query options
	opts := queries.QueryOptions{
		Filter: filter,
		Page:   int(page),
		Limit:  int(limit),
		Sort:   "createdAt",
	}

	// Get rooms with pagination
	resp, err := s.FindAll(ctx, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to get rooms by type: %w", err)
	}

	// Convert to response DTOs
	rooms := make([]dto.ResponseRoomDto, len(resp.Data))
	for i, room := range resp.Data {
		rooms[i] = dto.ResponseRoomDto{
			ID:          room.ID,
			Name:        room.Name,
			Type:        room.Type,
			Capacity:    room.Capacity,
			CreatedBy:   room.CreatedBy,
			Image:       room.Image,
			CreatedAt:   room.CreatedAt,
			UpdatedAt:   room.UpdatedAt,
			Metadata:    room.Metadata,
			MemberCount: len(room.Members),
			Status:      room.Status,
			Schedule:    room.Schedule, // เพิ่มฟิลด์ schedule
		}
	}

	// Calculate total count for pagination
	// Use a separate query to get total count
	collection := s.db.Collection("rooms")
	totalCount, err := collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to count rooms: %w", err)
	}

	// Calculate total pages
	totalPages := int64(0)
	if limit > 0 {
		totalPages = (totalCount + limit - 1) / limit
	}

	// Build response
	response := &dto.ResponseRoomsByTypeDto{
		Data: rooms,
	}
	response.Meta.Total = totalCount
	response.Meta.Page = page
	response.Meta.Limit = limit
	response.Meta.TotalPages = totalPages

	return response, nil
}

func (s *RoomServiceImpl) GetRoomMemberById(ctx context.Context, roomId primitive.ObjectID, page int64, limit int64) (*dto.ResponseRoomMemberDto, error) {
	// ดึงข้อมูลจาก database โดยตรงเพื่อให้ได้ข้อมูลล่าสุด
	room, err := s.FindOneById(ctx, roomId.Hex())
	if err != nil || len(room.Data) == 0 {
		return nil, errors.New("room not found")
	}

	// ใช้ข้อมูลจาก database แทน cache
	currentRoom := &room.Data[0] 
	
	// อัพเดท cache ด้วยข้อมูลล่าสุด
	if err := s.cache.SaveRoom(ctx, currentRoom); err != nil {
		log.Printf("[RoomService] Warning: Failed to update cache: %v", err)
	}
	// Handle pagination with validation
	total := int64(len(currentRoom.Members))
	
	// Validate and set default values
	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 10 // Default limit
	}
	
	start := (page - 1) * limit
	end := start + limit
	
	// Validate pagination bounds
	if start >= total {
		// No members to return for this page
		return &dto.ResponseRoomMemberDto{
			ID:      currentRoom.ID,
			Name:    currentRoom.Name,
			Type:    currentRoom.Type,
			Members: []dto.MemberResponse{},
		}, nil
	}
	
	if end > total {
		end = total
	}

	members := make([]dto.MemberResponse, 0, end-start)

	// Process members in the pagination range
	for i := start; i < end; i++ {
		if i >= int64(len(currentRoom.Members)) {
			break
		}
		
		m := currentRoom.Members[i]

		// Fetch user by ID (with role populated)
		user, err := s.userService.GetUserByIdWithPopulate(ctx, m.Hex())
		if err != nil {
			log.Printf("[GetRoomMemberById] Error fetching user %s: %v", m.Hex(), err)
		}
		
		memberObj := dto.MemberResponse{}
		
		if err == nil && user != nil {
			memberObj.User.ID = user.ID.Hex()
			memberObj.User.Username = user.Username
			memberObj.User.Name = user.Name
			roleName := ""
			roleID := user.Role // primitive.ObjectID
			if !roleID.IsZero() {
				roleColl := s.db.Collection("roles")
				var roleDoc struct{ Name string `bson:"name"` }
				err := roleColl.FindOne(ctx, bson.M{"_id": roleID}).Decode(&roleDoc)
				if err == nil {
					roleName = roleDoc.Name
				}
			}
			memberObj.User.Role = struct{
				ID   primitive.ObjectID `json:"_id"`
				Name string `json:"name"`
			}{
				ID:   roleID,
				Name: roleName,
			}
		} else {
			memberObj.User.ID = m.Hex()
			memberObj.User.Username = ""
			memberObj.User.Role = struct{
				ID   primitive.ObjectID `json:"_id"`
				Name string `json:"name"`
			}{}
		}

		// Append member to the list
		members = append(members, memberObj)
	}

	response := &dto.ResponseRoomMemberDto{
		ID:      currentRoom.ID,
		Name:    currentRoom.Name,
		Type:    currentRoom.Type,
		Members: members,	
	}
	
	return response, nil
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

	// Validate schedule if provided
	if createDto.Schedule != nil {
		if err := createDto.Schedule.ValidateSchedule(); err != nil {
			return nil, fmt.Errorf("schedule validation error: %w", err)
		}
	}

	members := createDto.MembersToObjectIDs()
	createdBy := createDto.CreatedByToObjectID()
	
	log.Printf("[CreateRoom Service] Members from DTO: %v, CreatedBy: %v", createDto.Members, createDto.CreatedBy)
	log.Printf("[CreateRoom Service] Converted Members: %v, CreatedBy ObjectID: %v", members, createdBy)

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
	
	log.Printf("[CreateRoom Service] Final members count: %d", len(members))

	if err := s.validateMembers(ctx, createDto); err != nil {
		return nil, err
	}

	roomType := createDto.Type
	if roomType == "" {
		roomType = model.RoomTypeNormal
	}

	// Set default status to active if not provided
	roomStatus := createDto.Status
	if roomStatus == "" {
		roomStatus = model.RoomStatusActive
	}

	// Convert schedule DTO to model
	var schedule *model.RoomSchedule
	if createDto.Schedule != nil {
		var err error
		schedule, err = createDto.Schedule.ToRoomSchedule()
		if err != nil {
			return nil, fmt.Errorf("failed to parse schedule: %w", err)
		}
	}

	r := &model.Room{
		Name:      createDto.Name,
		Type:      roomType,
		Status:    roomStatus,
		Capacity:  createDto.Capacity,
		CreatedBy: createdBy,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Members:   members,
		Image:     createDto.Image,
		Schedule:  schedule, // เพิ่มฟิลด์ schedule
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

	// Validate schedule if provided
	if updateDto.Schedule != nil {
		if err := updateDto.Schedule.ValidateSchedule(); err != nil {
			return nil, fmt.Errorf("schedule validation error: %w", err)
		}
	}

	// Merge fields
	updatedRoom := &model.Room{
		ID:        oldRoom.ID,
		Name:      oldRoom.Name,
		Type:      oldRoom.Type,
		Status:    oldRoom.Status,
		Capacity:  oldRoom.Capacity,
		Members:   oldRoom.Members,
		CreatedBy: oldRoom.CreatedBy, // primitive.ObjectID for DB
		Image:     oldRoom.Image,
		CreatedAt: oldRoom.CreatedAt,
		UpdatedAt: oldRoom.UpdatedAt,
		Metadata:  oldRoom.Metadata,
		Schedule:  oldRoom.Schedule, // preserve existing schedule
	}
	updatedRoom.Name = updateDto.Name
	updatedRoom.Type = updateDto.Type
	updatedRoom.Status = updateDto.Status
	updatedRoom.Capacity = updateDto.Capacity
	
	log.Printf("[UpdateRoom Service] Members from DTO: %v", updateDto.Members)
	if updateDto.Members != nil && len(updateDto.Members) > 0 {
		updatedRoom.Members = updateDto.MembersToObjectIDs()
		log.Printf("[UpdateRoom Service] Updated members count: %d", len(updatedRoom.Members))
	} else {
		log.Printf("[UpdateRoom Service] No members to update, keeping existing: %d", len(updatedRoom.Members))
	}
	
	if updateDto.Image != "" {
		updatedRoom.Image = updateDto.Image
	}
	updatedRoom.UpdatedAt = time.Now()

	// Update schedule if provided
	if updateDto.Schedule != nil {
		schedule, err := updateDto.Schedule.ToRoomSchedule()
		if err != nil {
			return nil, fmt.Errorf("failed to parse schedule: %w", err)
		}
		updatedRoom.Schedule = schedule
	}

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
		"status":    updatedRoom.Status,
		"capacity":  updatedRoom.Capacity,
		"updatedAt": updatedRoom.UpdatedAt,
		"createdBy": updatedRoom.CreatedBy,
		"members":   updatedRoom.Members,
	}
	if updateDto.Image != "" {
		setFields["image"] = updatedRoom.Image
	}
	// Add schedule to update fields
	if updatedRoom.Schedule != nil {
		setFields["schedule"] = updatedRoom.Schedule
	} else if updateDto.Schedule != nil {
		// If updateDto.Schedule is provided but results in nil (e.g., disabled), clear the field
		setFields["schedule"] = nil
	}

	filter := bson.M{"_id": roomObjID}
	update := bson.M{"$set": setFields}

	// Try to get the collection via public getter
	var updateErr error
	if getter, ok := interface{}(s.BaseService).(interface{ GetMongoCollection() *mongo.Collection }); ok {
		_, updateErr = getter.GetMongoCollection().UpdateOne(ctx, filter, update)
	} else if getter, ok := interface{}(s.BaseService).(interface{ GetDBCollection() *mongo.Collection }); ok {
		_, updateErr = getter.GetDBCollection().UpdateOne(ctx, filter, update)
	} else if getter, ok := interface{}(s.BaseService).(interface {
		GetMongo() *mongo.Database
		GetCollectionName() string
	}); ok {
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

	// Check if room status changed to inactive and disconnect all users
	if oldRoom.IsActive() && updatedRoom.IsInactive() {
		log.Printf("[RoomService] Room %s status changed from active to inactive, triggering WebSocket disconnect", roomObjID.Hex())

		// Call status change callback if set
		if s.statusChangeCallback != nil {
			log.Printf("[RoomService] 🔔 Calling status change callback for room %s", roomObjID.Hex())
			s.statusChangeCallback(ctx, roomObjID.Hex(), updatedRoom.Status)
		} else {
			log.Printf("[RoomService] ⚠️ No status change callback set for room %s", roomObjID.Hex())
		}

		// Emit room status change event
		if s.eventEmitter != nil {
			s.eventEmitter.EmitRoomStatusChanged(ctx, roomObjID, updatedRoom.Status)
		}

		// Also disconnect users immediately for immediate response
		if err := sharedUtils.DisconnectAllUsersFromRoom(ctx, roomObjID, s.hub, s.cache); err != nil {
			log.Printf("[RoomService] Warning: Failed to disconnect users from room %s: %v", roomObjID.Hex(), err)
		}
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
	if !sharedUtils.ContainsMember(room.Members, uid) {
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
		// อนุญาตให้เฉพาะ Administrator, Staff (Mentee), และ AE สามารถส่งข้อความในห้อง read-only ได้
		if userRole != middleware.RoleAdministrator && userRole != middleware.RoleStaff && userRole != middleware.RoleAE {
			return false, fmt.Errorf("room is read-only and user does not have write permission")
		}
	}

	return true, nil
}

// GetAllRoomForUser ดึงห้องทั้งหมดที่ user มองเห็น (ไม่เอา group room)
func (s *RoomServiceImpl) GetAllRoomForUser(ctx context.Context, userID string) ([]dto.ResponseAllRoomForUserDto, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format")
	}

	// Get rooms of type "normal" and "readonly", excluding group rooms
	opts := queries.QueryOptions{
		Filter: map[string]interface{}{
			"type": map[string]interface{}{"$in": []string{"normal", "readonly"}},
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
		// Check if user is already a member
		isMember := false
		for _, memberID := range room.Members {
			if memberID == userObjID {
				isMember = true
				break
			}
		}

		// Only include rooms where user is NOT a member
		if isMember {
			continue
		}

		// Additional check to exclude group rooms
		if room.Metadata != nil {
			if isGroup, ok := room.Metadata["isGroupRoom"]; ok && isGroup == true {
				continue
			}
		}

		// Calculate canJoin based on room status, capacity, and user membership
		canJoin := s.calculateCanJoin(room, userID)

		memberCount := len(room.Members)
		result = append(result, dto.ResponseAllRoomForUserDto{
			ID:          room.ID,
			Name:        room.Name,
			Type:        room.Type,
			Capacity:    room.Capacity,
			CreatedBy:   room.CreatedBy,
			Image:       room.Image,
			CreatedAt:   room.CreatedAt,
			UpdatedAt:   room.UpdatedAt,
			Metadata:    room.Metadata,
			IsMember:    false,
			CanJoin:     canJoin,
			MemberCount: memberCount,
			Schedule:    room.Schedule, // เพิ่มฟิลด์ schedule
		})
	}
	return result, nil
}

// GetRoomsForMe ดึงเฉพาะห้องที่ user เป็น member (รวม group room)
func (s *RoomServiceImpl) GetRoomsForMe(ctx context.Context, userID string) ([]dto.ResponseRoomDto, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format")
	}

	// Get rooms where user is a member, including group rooms
	opts := queries.QueryOptions{
		Filter: map[string]interface{}{
			"members": userObjID,
			"type":    map[string]interface{}{"$in": []string{"normal", "readonly"}},
		},
	}
	resp, err := s.FindAll(ctx, opts)
	if err != nil {
		return nil, err
	}

	result := make([]dto.ResponseRoomDto, 0, len(resp.Data))
	for _, room := range resp.Data {
		result = append(result, dto.ResponseRoomDto{
			ID:          room.ID,
			Name:        room.Name,
			Type:        room.Type,
			Capacity:    room.Capacity,
			CreatedBy:   room.CreatedBy,
			Image:       room.Image,
			CreatedAt:   room.CreatedAt,
			UpdatedAt:   room.UpdatedAt,
			Metadata:    room.Metadata,
			MemberCount: len(room.Members),
			Status:      room.Status,
			Schedule:    room.Schedule, // เพิ่มฟิลด์ schedule
		})
	}
	return result, nil
}

// calculateCanJoin determines if a user can join a room based on status, capacity, schedule, and membership
func (s *RoomServiceImpl) calculateCanJoin(room model.Room, userID string) bool {
	// If room is inactive, user cannot join
	if room.IsInactive() {
		return false
	}

	// ตรวจสอบ schedule ของห้อง
	if !room.IsRoomAccessible(time.Now()) {
		return false
	}

	// If room has unlimited capacity, user can join
	if room.IsUnlimitedCapacity() {
		return true
	}

	// Check if room has available capacity
	if len(room.Members) < room.Capacity {
		return true
	}

	return false
}

// Helper methods
func (s *RoomServiceImpl) validateMembers(ctx context.Context, createDto *dto.CreateRoomDto) error {
	if createDto.CreatedBy != "" {
	if err := s.fkValidator.ValidateForeignKey(ctx, "users", createDto.CreatedBy); err != nil {
		return fmt.Errorf("foreign key validation error: %w", err)
		}
	}

	for _, memberID := range createDto.Members {
		if memberID != "" {
		if err := s.fkValidator.ValidateForeignKey(ctx, "users", memberID); err != nil {
			return fmt.Errorf("member validation error: %w", err)
			}
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

//Helpers =>

func (s *RoomServiceImpl) CanUserSendSticker(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}
	return sharedUtils.CanUserSendSticker(ctx, room, userID)
}

func (s *RoomServiceImpl) CanUserSendReaction(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}
	return sharedUtils.CanUserSendReaction(ctx, room, userID)
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

func (s *RoomServiceImpl) DisconnectAllUsersFromRoom(ctx context.Context, roomID primitive.ObjectID) error {
	return sharedUtils.DisconnectAllUsersFromRoom(ctx, roomID, s.hub, s.cache)
}

// SetStatusChangeCallback sets a callback function to be called when room status changes
func (s *RoomServiceImpl) SetStatusChangeCallback(callback func(ctx context.Context, roomID string, newStatus string)) {
	s.statusChangeCallback = callback
}

// Delegate methods to helpers
func (s *RoomServiceImpl) RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (*model.Room, error) {
	return s.memberHelper.RemoveUserFromRoom(ctx, roomID, userID)
}

func (s *RoomServiceImpl) RemoveConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	return sharedUtils.RemoveConnection(ctx, roomID, userID, s.cache)
}

func (s *RoomServiceImpl) GetActiveConnectionsCount(ctx context.Context, roomID primitive.ObjectID) (int64, error) {
	return sharedUtils.GetActiveConnectionsCount(ctx, roomID, s.cache)
}

// ตรวจสอบว่ามี user นั้นอยู่ใน room หรือไม่
func (s *RoomServiceImpl) IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}
	uid, _ := primitive.ObjectIDFromHex(userID)
	return sharedUtils.ContainsMember(room.Members, uid), nil
}

// ตรวจสอบว่ามี user นั้นอยู่ใน room และมี connection นั้นอยู่ใน room หรือไม่
func (s *RoomServiceImpl) ValidateAndTrackConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return fmt.Errorf("room not found: %w", err)
	}

	return sharedUtils.ValidateAndTrackConnection(ctx, room, userID, s.cache)
}

// ดึงข้อมูลของ room
func (s *RoomServiceImpl) GetRoomStatus(ctx context.Context, roomID primitive.ObjectID) (map[string]interface{}, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return nil, err
	}

	return sharedUtils.GetRoomStatus(ctx, room, s.cache)
}