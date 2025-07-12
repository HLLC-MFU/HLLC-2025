package service

import (
	chatUtils "chat/module/chat/utils"
	"chat/module/room/group/dto"
	groupUtils "chat/module/room/group/utils"
	"chat/module/room/room/model"
	sharedCache "chat/module/room/shared/cache"
	sharedEvents "chat/module/room/shared/events"
	userService "chat/module/user/service"
	"chat/pkg/config"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	serviceHelper "chat/pkg/helpers/service"
	"chat/pkg/utils"
	"chat/pkg/validator"
	"context"
	"fmt"
	"log"
	"time"

	roomDto "chat/module/room/room/dto"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// RoomService interface for group service dependency
type RoomService interface {
	GetRoomById(ctx context.Context, roomID primitive.ObjectID) (*model.Room, error)
	UpdateRoom(ctx context.Context, id string, updateDto *roomDto.UpdateRoomDto) (*model.Room, error)
	IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
}

type GroupRoomService struct {
	*queries.BaseService[model.Room]
	userService   *userService.UserService
	roomService   RoomService
	fkValidator   *serviceHelper.ForeignKeyValidator
	eventEmitter  *sharedEvents.RoomEventEmitter
	cache         *sharedCache.RoomCacheService
	hub           *chatUtils.Hub
	db            *mongo.Database
	helper        *groupUtils.GroupRoomHelper
	uploadHandler *utils.FileUploadHandler
}

func NewGroupRoomService(
	db *mongo.Database,
	redis *redis.Client,
	cfg *config.Config,
	hub *chatUtils.Hub,
	roomService RoomService,
	bus *kafka.Bus,
) *GroupRoomService {
	collection := db.Collection("rooms")
	userService := userService.NewUserService(db)
	eventEmitter := sharedEvents.NewRoomEventEmitter(bus, cfg)
	cache := sharedCache.NewRoomCacheService(redis)
	helper := groupUtils.NewGroupRoomHelper(userService, db)
	uploadHandler := utils.NewModuleFileHandler("room")

	return &GroupRoomService{
		BaseService:   queries.NewBaseService[model.Room](collection),
		userService:   userService,
		roomService:   roomService,
		fkValidator:   serviceHelper.NewForeignKeyValidator(db),
		eventEmitter:  eventEmitter,
		cache:         cache,
		hub:           hub,
		db:            db,
		helper:        helper,
		uploadHandler: uploadHandler,
	}
}

// CreateRoomByGroup สร้างห้องกลุ่มและเพิ่มสมาชิกอัตโนมัติ
func (gs *GroupRoomService) CreateRoomByGroup(ctx context.Context, createDto *dto.CreateRoomByGroupDto) (*model.Room, error) {
	if err := validator.ValidateStruct(createDto); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	if err := createDto.ValidateGroupType(); err != nil {
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

	createdBy := primitive.ObjectID{}
	if createDto.CreatedBy != "" {
		createdBy, _ = primitive.ObjectIDFromHex(createDto.CreatedBy)
	}
	members := []primitive.ObjectID{}
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

	room := &model.Room{
		Name:      createDto.Name,
		Type:      roomType,
		Status:    roomStatus,
		Capacity:  0, // unlimited capacity
		CreatedBy: createdBy,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Members:   members,
		Image:     createDto.Image,
		Metadata: map[string]interface{}{
			"isGroupRoom": true,
			"groupType":   createDto.GroupType,
			"groupValue":  createDto.GroupValue,
			"autoAdd":     true,
		},
	}

	resp, err := gs.Create(ctx, *room)
	if err != nil {
		return nil, fmt.Errorf("failed to create group room: %w", err)
	}

	created := &resp.Data[0]

	addedCount, err := gs.addGroupMembersAndWait(ctx, created.ID, createDto.GroupType, createDto.GroupValue)
	if err != nil {
		log.Printf("[GroupService] Warning: failed to add group members: %v", err)
	} else {
		log.Printf("[GroupService] Added %d members to room %s", addedCount, created.ID.Hex())
	}

	finalRoom, err := gs.getFreshRoomFromDB(ctx, created.ID)
	if err != nil {
		log.Printf("[GroupService] Warning: failed to get updated room: %v", err)
		finalRoom = created
	}

	gs.eventEmitter.EmitRoomCreated(ctx, finalRoom.ID, finalRoom)

	return finalRoom, nil
}

// getFreshRoomFromDB ดึงข้อมูลห้องล่าสุดจากฐานข้อมูล
func (gs *GroupRoomService) getFreshRoomFromDB(ctx context.Context, roomID primitive.ObjectID) (*model.Room, error) {
	var room model.Room
	err := gs.db.Collection("rooms").FindOne(ctx, bson.M{"_id": roomID}).Decode(&room)
	if err != nil {
		return nil, fmt.Errorf("failed to get fresh room: %w", err)
	}

	log.Printf("[GroupService] Fresh room from DB: ID=%s, Members=%d", room.ID.Hex(), len(room.Members))
	return &room, nil
}

// addGroupMembersAndWait เพิ่มสมาชิกและรอให้การอัพเดทเสร็จสิ้น
func (gs *GroupRoomService) addGroupMembersAndWait(ctx context.Context, roomID primitive.ObjectID, groupType, groupValue string) (int, error) {
	// ดึง users ตาม group
	users, err := gs.helper.GetUsersByGroup(ctx, groupType, groupValue)
	if err != nil || len(users) == 0 {
		return 0, fmt.Errorf("no users found for group: %w", err)
	}

	// แปลงเป็น ObjectIDs และกรองสมาชิกที่ยังไม่อยู่ในห้อง
	var newMemberIDs []primitive.ObjectID
	for _, user := range users {
		newMemberIDs = append(newMemberIDs, user.ID)
	}

	// ถ้าไม่มีสมาชิกใหม่ให้ออกจากฟังก์ชัน
	if len(newMemberIDs) == 0 {
		return 0, nil
	}

	// เพิ่มสมาชิกโดยตรงใน database และรอให้เสร็จ
	collection := gs.db.Collection("rooms")
	filter := bson.M{"_id": roomID}
	update := bson.M{
		"$addToSet": bson.M{"members": bson.M{"$each": newMemberIDs}},
		"$set":      bson.M{"updatedAt": primitive.NewDateTimeFromTime(time.Now())},
	}

	// อัพเดทห้องใน database
	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return 0, fmt.Errorf("failed to add members: %w", err)
	}

	// ตรวจสอบว่ามีการอัพเดทห้องหรือไม่
	if result.ModifiedCount == 0 {
		return 0, fmt.Errorf("failed to update room")
	}

	// ลบ cache ทันที และ members cache
	gs.cache.DeleteRoom(ctx, roomID.Hex())
	gs.cache.SaveMembers(ctx, roomID.Hex(), nil) // Clear members cache

	log.Printf("[GroupService] Added %d members to room %s", len(newMemberIDs), roomID.Hex())
	return len(newMemberIDs), nil
}

// JoinRoomByGroup เพิ่ม users ที่มี metadata ตรงกับ group เข้าห้อง
func (gs *GroupRoomService) JoinRoomByGroup(ctx context.Context, roomID primitive.ObjectID, groupType, groupValue string) (int, error) {
	room, err := gs.roomService.GetRoomById(ctx, roomID)
	if err != nil {
		return 0, fmt.Errorf("room not found: %w", err)
	}

	if !gs.helper.IsGroupRoom(room) {
		return 0, fmt.Errorf("room is not a group room")
	}

	return gs.addGroupMembersAndWait(ctx, roomID, groupType, groupValue)
}

// BulkAddUsersToRoom เพิ่มผู้ใช้หลายคนเข้าห้อง
func (gs *GroupRoomService) BulkAddUsersToRoom(ctx context.Context, roomID primitive.ObjectID, userIDs []string) (int, error) {
	if len(userIDs) == 0 {
		return 0, nil
	}

	// ตรวจสอบสมาชิกใหม่ที่ยังไม่อยู่ในห้อง
	var validUserIDs []primitive.ObjectID
	for _, userID := range userIDs {
		if userObjID, err := primitive.ObjectIDFromHex(userID); err == nil {
			// ตรวจสอบว่ายังไม่อยู่ในห้อง
			if isInRoom, _ := gs.roomService.IsUserInRoom(ctx, roomID, userID); !isInRoom {
				validUserIDs = append(validUserIDs, userObjID)
			}
		}
	}

	// ถ้าไม่มีผู้ใช้งานใหม่ให้ออกจากฟังก์ชัน
	if len(validUserIDs) == 0 {
		return 0, nil
	}

	return gs.helper.BulkAddMembers(ctx, roomID, validUserIDs)
}

// AutoAddUserToGroupRooms เพิ่ม user เข้าห้องกลุ่มที่เหมาะสมอัตโนมัติ
func (gs *GroupRoomService) AutoAddUserToGroupRooms(ctx context.Context, userID string) error {
	user, err := gs.userService.GetUserById(ctx, userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	if user.Metadata == nil {
		return nil
	}

	totalAdded := 0

	// Auto-add by major
	if majorID, exists := user.Metadata["major"].(string); exists {
		if added, _ := gs.autoAddUserToGroupRoomsByType(ctx, userID, "major", majorID); added > 0 {
			totalAdded += added
		}
	}

	// Auto-add by school
	if schoolID, exists := user.Metadata["school"].(string); exists {
		if added, _ := gs.autoAddUserToGroupRoomsByType(ctx, userID, "school", schoolID); added > 0 {
			totalAdded += added
		}
	}

	log.Printf("[GroupService] Auto-added user %s to %d group rooms", userID, totalAdded)
	return nil
}

// Helper methods (shortened)
func (gs *GroupRoomService) autoAddUserToGroupRoomsByType(ctx context.Context, userID, groupType, groupValue string) (int, error) {
	rooms, err := gs.GetRoomsByGroup(ctx, groupType, groupValue)
	if err != nil {
		return 0, err
	}

	addedCount := 0
	userObjID, _ := primitive.ObjectIDFromHex(userID)

	for _, room := range rooms {
		if room.ShouldAutoAddNewUsers() {
			if _, err := gs.helper.BulkAddMembers(ctx, room.ID, []primitive.ObjectID{userObjID}); err == nil {
				addedCount++
			}
		}
	}

	return addedCount, nil
}

func (gs *GroupRoomService) GetRoomsByGroup(ctx context.Context, groupType, groupValue string) ([]*model.Room, error) {
	return gs.helper.GetGroupRooms(ctx, groupType, groupValue)
}

func (gs *GroupRoomService) GetAutoAddableGroupRooms(ctx context.Context) ([]*model.Room, error) {
	return gs.helper.GetAutoAddRooms(ctx)
}

func (gs *GroupRoomService) ToggleGroupRoomAutoAdd(ctx context.Context, roomID primitive.ObjectID, autoAdd bool) error {
	return gs.helper.UpdateAutoAddStatus(ctx, roomID, autoAdd)
}

func (gs *GroupRoomService) GetGroupRoomStats(ctx context.Context, groupType, groupValue string) (map[string]interface{}, error) {
	rooms, err := gs.GetRoomsByGroup(ctx, groupType, groupValue)
	if err != nil {
		return nil, err
	}

	totalMembers := 0
	for _, room := range rooms {
		totalMembers += len(room.Members)
	}

	return map[string]interface{}{
		"groupType":    groupType,
		"groupValue":   groupValue,
		"totalRooms":   len(rooms),
		"totalMembers": totalMembers,
		"rooms":        rooms,
	}, nil
}
