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
	"chat/pkg/validator"
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type RoomService struct {
	*queries.BaseService[model.Room]
	userService      *userService.UserService
	fkValidator      *serviceHelper.ForeignKeyValidator
	eventEmitter     *roomUtils.RoomEventEmitter
	cache            *roomUtils.RoomCacheService
	hub              *chatUtils.Hub
	db               *mongo.Database
	memberHelper     *roomUtils.RoomMemberHelper
}

func NewRoomService(db *mongo.Database, redis *redis.Client, cfg *config.Config, hub *chatUtils.Hub) *RoomService {
	bus := kafka.New(cfg.Kafka.Brokers, "room-service")
	if err := bus.Start(); err != nil {
		log.Printf("[ERROR] Failed to start Kafka bus: %v", err)
	}

	userSvc := userService.NewUserService(db)
	cache := roomUtils.NewRoomCacheService(redis)
	eventEmitter := roomUtils.NewRoomEventEmitter(bus, cfg)
	
	service := &RoomService{
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

// ดึง list room จาก cache
func (s *RoomService) GetRooms(ctx context.Context, opts queries.QueryOptions) (*queries.Response[model.Room], error) {
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}
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

	return result, nil
}

// สร้าง room
func (s *RoomService) CreateRoom(ctx context.Context, createDto *dto.CreateRoomDto) (*model.Room, error) {
	if err := validator.ValidateStruct(createDto); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
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
		CreatedBy: createDto.ToObjectID(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Members:   roomUtils.ConvertToObjectIDs(createDto.Members),
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
func (s *RoomService) UpdateRoom(ctx context.Context, id string, room *model.Room) (*model.Room, error) {
	room.UpdatedAt = time.Now()

	resp, err := s.UpdateById(ctx, id, *room)
	if err != nil {
		return nil, err
	}

	updated := &resp.Data[0]
	s.cache.SaveRoom(ctx, updated)
	return updated, nil
}

// ลบ room
func (s *RoomService) DeleteRoom(ctx context.Context, id string) (*model.Room, error) {
	room, err := s.DeleteById(ctx, id)
	if err != nil {
		return nil, err
	}

	deleted := &room.Data[0]
	s.handleRoomDeleted(ctx, deleted)
	return deleted, nil
}

// ตรวจสอบว่ามี user นั้นอยู่ใน room หรือไม่
func (s *RoomService) IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}

	uid, _ := primitive.ObjectIDFromHex(userID)
	return roomUtils.ContainsMember(room.Members, uid), nil
}

// ตรวจสอบว่ามี user นั้นอยู่ใน room และมี connection นั้นอยู่ใน room หรือไม่
func (s *RoomService) ValidateAndTrackConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return fmt.Errorf("room not found: %w", err)
	}

	return roomUtils.ValidateAndTrackConnection(ctx, room, userID, s.cache)
}

// ดึงข้อมูลของ room
func (s *RoomService) GetRoomStatus(ctx context.Context, roomID primitive.ObjectID) (map[string]interface{}, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return nil, err
	}

	return roomUtils.GetRoomStatus(ctx, room, s.cache)
}

// Delegate methods to helpers
func (s *RoomService) RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (*model.Room, error) {
	return s.memberHelper.RemoveUserFromRoom(ctx, roomID, userID)
}

func (s *RoomService) RemoveConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	return roomUtils.RemoveConnection(ctx, roomID, userID, s.cache)
}

func (s *RoomService) GetActiveConnectionsCount(ctx context.Context, roomID primitive.ObjectID) (int64, error) {
	return roomUtils.GetActiveConnectionsCount(ctx, roomID, s.cache)
}

func (s *RoomService) CanUserSendMessage(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}
	return roomUtils.CanUserSendMessage(ctx, room, userID)
}

func (s *RoomService) CanUserSendSticker(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}
	return roomUtils.CanUserSendSticker(ctx, room, userID)
}

func (s *RoomService) CanUserSendReaction(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}
	return roomUtils.CanUserSendReaction(ctx, room, userID)
}

func (s *RoomService) AddUserToRoom(ctx context.Context, roomID, userID string) error {
	return s.memberHelper.AddUserToRoom(ctx, roomID, userID)
}

func (s *RoomService) JoinRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	return s.memberHelper.JoinRoom(ctx, roomID, userID)
}

func (s *RoomService) LeaveRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	return s.memberHelper.LeaveRoom(ctx, roomID, userID)
}



// Helper methods
func (s *RoomService) validateMembers(ctx context.Context, createDto *dto.CreateRoomDto) error {
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

func (s *RoomService) handleRoomCreated(ctx context.Context, room *model.Room) {
	if err := s.cache.SaveRoom(ctx, room); err != nil {
		log.Printf("[WARN] Failed to cache created room: %v", err)
	}

	log.Printf("[INFO] Room created: %s", room.ID.Hex())
}

func (s *RoomService) handleRoomDeleted(ctx context.Context, room *model.Room) {
	if err := s.cache.DeleteRoom(ctx, room.ID.Hex()); err != nil {
		log.Printf("[WARN] Failed to delete room from cache: %v", err)
	}

	log.Printf("[INFO] Room deleted: %s", room.ID.Hex())
}