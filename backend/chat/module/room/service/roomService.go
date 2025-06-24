package service

import (
	"chat/module/room/dto"
	"chat/module/room/model"
	"chat/module/room/utils"
	"chat/module/user/service"
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

type (
	RoomService struct {
		*queries.BaseService[model.Room]
		userService     *service.UserService
		fkValidator     *serviceHelper.ForeignKeyValidator
		eventEmitter    *utils.RoomEventEmitter
		cache           *utils.RoomCacheService
	}
)

func NewRoomService(db *mongo.Database, redis *redis.Client, cfg *config.Config) *RoomService {
	bus := kafka.New(cfg.Kafka.Brokers, "room-service")
	if err := bus.Start(); err != nil {
		log.Printf("[ERROR] Failed to start Kafka bus: %v", err)
	}

	return &RoomService{
		BaseService:   queries.NewBaseService[model.Room](db.Collection("rooms")),
		userService:   service.NewUserService(db),
		fkValidator:   serviceHelper.NewForeignKeyValidator(db),
		eventEmitter:  utils.NewRoomEventEmitter(bus, cfg),
		cache:         utils.NewRoomCacheService(redis),
	}
}

func (s *RoomService) GetRooms(ctx context.Context, opts queries.QueryOptions) (*queries.Response[model.Room], error) {
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}
	return s.FindAll(ctx, opts)
}

func (s *RoomService) GetRoomById(ctx context.Context, roomID primitive.ObjectID) (*model.Room, error) {
	if room, err := s.cache.GetRoom(ctx, roomID.Hex()); err == nil && room != nil {
		return room, nil
	}

	room, err := s.FindOneById(ctx, roomID.Hex())
	if err != nil {
		return nil, err
	}

	result := &room.Data[0]
	if err := s.cache.SaveRoom(ctx, result); err != nil {
		log.Printf("[WARN] Failed to cache room: %v", err)
	}

	return result, nil
}

func (s *RoomService) CreateRoom(ctx context.Context, createDto *dto.CreateRoomDto) (*model.Room, error) {
	if err := validator.ValidateStruct(createDto); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	if err := s.fkValidator.ValidateForeignKey(ctx, "users", createDto.CreatedBy); err != nil {
		return nil, fmt.Errorf("foreign key validation error: %w", err)
	}

	if len(createDto.Members) > 0 {
		for i, memberID := range createDto.Members {
			if err := s.fkValidator.ValidateForeignKey(ctx, "users", memberID); err != nil {
				return nil, fmt.Errorf("invalid member at index %d: %w", i, err)
			}
		}
	}

	memberIDs := make([]primitive.ObjectID, 0)
	if len(createDto.Members) > 0 {
		memberIDs = make([]primitive.ObjectID, len(createDto.Members))
		for i, memberID := range createDto.Members {
			objID, _ := primitive.ObjectIDFromHex(memberID)
			memberIDs[i] = objID
		}
	}

	r := &model.Room{
		Name:      createDto.Name,
		Capacity:  createDto.Capacity,
		CreatedBy: createDto.ToObjectID(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Members:   memberIDs,
	}
	resp, err := s.Create(ctx, *r)
	if err != nil {
		return nil, fmt.Errorf("failed to create room: %w", err)
	}

	created := &resp.Data[0]
	
	if err := s.cache.SaveRoom(ctx, created); err != nil {
		log.Printf("[WARN] Failed to cache new room: %v", err)
	}

	if err := s.eventEmitter.EnsureRoomTopic(ctx, created.ID); err != nil {
		log.Printf("[WARN] Failed to create Kafka topic for room: %v", err)
	}

	return created, nil
}

func (s *RoomService) UpdateRoom(ctx context.Context, id string, room *model.Room) (*model.Room, error) {
	room.UpdatedAt = time.Now()
	resp, err := s.UpdateById(ctx, id, *room)
	if err != nil {
		return nil, err
	}

	updated := &resp.Data[0]
	
	if err := s.cache.SaveRoom(ctx, updated); err != nil {
		log.Printf("[WARN] Failed to update room cache: %v", err)
	}

	return updated, nil
}

func (s *RoomService) DeleteRoom(ctx context.Context, id string) (*model.Room, error) {
	room, err := s.DeleteById(ctx, id)
	if err != nil {
		return nil, err
	}

	if err := s.cache.DeleteRoom(ctx, id); err != nil {
		log.Printf("[WARN] Failed to delete room from cache: %v", err)
	}

	if err := s.eventEmitter.DeleteRoomTopic(ctx, room.Data[0].ID); err != nil {
		log.Printf("[WARN] Failed to delete Kafka topic for room: %v", err)
	}

	return &room.Data[0], nil
}


func (s *RoomService) RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (*model.Room, error) {
	uid, _ := primitive.ObjectIDFromHex(userID)
	r, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return nil, err
	}

	r.Members = utils.RemoveMember(r.Members, uid)
	r.UpdatedAt = time.Now()
	resp, err := s.UpdateById(ctx, roomID.Hex(), *r)
	if err != nil {
		return nil, err
	}

	updated := &resp.Data[0]
	
	if err := s.cache.SaveRoom(ctx, updated); err != nil {
		log.Printf("[WARN] Failed to update room cache after removing member: %v", err)
	}

	return updated, err
}

func (s *RoomService) IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	if room, err := s.cache.GetRoom(ctx, roomID.Hex()); err == nil && room != nil {
		uid, _ := primitive.ObjectIDFromHex(userID)
		for _, m := range room.Members {
			if m == uid {
				return true, nil
			}
		}
		return false, nil
	}

	r, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}
	uid, _ := primitive.ObjectIDFromHex(userID)
	for _, m := range r.Members {
		if m == uid {
			return true, nil
		}
	}
	return false, nil
}


func (s *RoomService) ValidateAndTrackConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return fmt.Errorf("room not found: %w", err)
	}

	isMember, err := s.IsUserInRoom(ctx, roomID, userID)
	if err != nil {
		return fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return fmt.Errorf("user is not a member of this room")
	}

	activeCount, err := s.cache.GetActiveConnectionsCount(ctx, roomID.Hex())
	if err != nil {
		log.Printf("[WARN] Failed to get active connections count: %v", err)
	} else if activeCount >= int64(room.Capacity) {
		return fmt.Errorf("room is at capacity: %d/%d", activeCount, room.Capacity)
	}

	if err := s.cache.TrackConnection(ctx, roomID.Hex(), userID); err != nil {
		log.Printf("[WARN] Failed to track connection: %v", err)
	}

	return nil
}

func (s *RoomService) RemoveConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	if err := s.cache.RemoveConnection(ctx, roomID.Hex(), userID); err != nil {
		log.Printf("[WARN] Failed to remove connection: %v", err)
	}
	return nil
}

func (s *RoomService) GetRoomStatus(ctx context.Context, roomID primitive.ObjectID) (map[string]interface{}, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return nil, err
	}

	activeCount, err := s.cache.GetActiveConnectionsCount(ctx, roomID.Hex())
	if err != nil {
		activeCount = 0
	}

	activeUsers, err := s.cache.GetActiveUsers(ctx, roomID.Hex())
	if err != nil {
		activeUsers = []string{}
	}

	return map[string]interface{}{
		"roomId":          roomID.Hex(),
		"capacity":        room.Capacity,
		"memberCount":     len(room.Members),
		"activeCount":     activeCount,
		"activeUsers":     activeUsers,
		"lastActive":      room.UpdatedAt,
	}, nil
}


func (s *RoomService) GetActiveConnectionsCount(ctx context.Context, roomID primitive.ObjectID) (int64, error) {
	return s.cache.GetActiveConnectionsCount(ctx, roomID.Hex())
}

func (s *RoomService) AddUserToRoom(ctx context.Context, roomID, userID string) error {
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return fmt.Errorf("invalid room ID: %w", err)
	}

	room, err := s.GetRoomById(ctx, roomObjID)
	if err != nil {
		return fmt.Errorf("failed to get room: %w", err)
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// Check if user is already in room
	for _, member := range room.Members {
		if member == userObjID {
			return nil // User is already in room
		}
	}

	room.Members = append(room.Members, userObjID)
	room.UpdatedAt = time.Now()

	if _, err := s.UpdateById(ctx, roomID, *room); err != nil {
		return fmt.Errorf("failed to update room: %w", err)
	}

	if err := s.cache.SaveRoom(ctx, room); err != nil {
		log.Printf("[WARN] Failed to update room cache after adding member: %v", err)
	}

	s.eventEmitter.EmitRoomMemberJoined(ctx, roomObjID, userObjID)

	return nil
}
