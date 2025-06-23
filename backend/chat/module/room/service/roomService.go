package service

import (
	"chat/module/room/dto"
	"chat/module/room/model"
	"chat/module/room/utils"
	"chat/module/user/service"
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

func NewRoomService(db *mongo.Database, redis *redis.Client) *RoomService {
	bus := kafka.New([]string{"localhost:9092"}, "room-service")
	if err := bus.Start(); err != nil {
		log.Printf("[ERROR] Failed to start Kafka bus: %v", err)
	}

	return &RoomService{
		BaseService:   queries.NewBaseService[model.Room](db.Collection("rooms")),
		userService:   service.NewUserService(db),
		fkValidator:   serviceHelper.NewForeignKeyValidator(db),
		eventEmitter:  utils.NewRoomEventEmitter(bus, "localhost:9092"),
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
	// Try cache first
	if room, err := s.cache.GetRoom(ctx, roomID.Hex()); err == nil && room != nil {
		return room, nil
	}

	// Fallback to database
	room, err := s.FindOneById(ctx, roomID.Hex())
	if err != nil {
		return nil, err
	}

	// Cache the result
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

	// Validate member IDs if provided
	if len(createDto.Members) > 0 {
		for i, memberID := range createDto.Members {
			if err := s.fkValidator.ValidateForeignKey(ctx, "users", memberID); err != nil {
				return nil, fmt.Errorf("invalid member at index %d: %w", i, err)
			}
		}
	}

	// Convert member IDs to ObjectIDs
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
	
	// Cache the new room
	if err := s.cache.SaveRoom(ctx, created); err != nil {
		log.Printf("[WARN] Failed to cache new room: %v", err)
	}

	// Create Kafka topic for the room
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
	
	// Update cache
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

	// Delete from cache
	if err := s.cache.DeleteRoom(ctx, id); err != nil {
		log.Printf("[WARN] Failed to delete room from cache: %v", err)
	}

	// Delete Kafka topic for the room
	if err := s.eventEmitter.DeleteRoomTopic(ctx, room.Data[0].ID); err != nil {
		log.Printf("[WARN] Failed to delete Kafka topic for room: %v", err)
	}

	return &room.Data[0], nil
}

func (s *RoomService) AddRoomMember(ctx context.Context, roomID string, dto *dto.AddRoomMembersDto) (*model.Room, error) {
	if err := s.fkValidator.ValidateForeignKey(ctx, "rooms", roomID); err != nil {
		return nil, fmt.Errorf("foreign key validation error: %w", err)
	}

	userObjectIDs := dto.ToObjectIDs()
	for i, uid := range dto.Members {
		if err := s.fkValidator.ValidateForeignKey(ctx, "users", uid); err != nil {
			return nil, fmt.Errorf("invalid user at index %d: %w", i, err)
		}
	}

	rid, _ := primitive.ObjectIDFromHex(roomID)
	r, err := s.GetRoomById(ctx, rid)
	if err != nil {
		return nil, err
	}

	// Check capacity before adding members
	currentMembers := len(r.Members)
	newMembers := len(userObjectIDs)
	if currentMembers + newMembers > r.Capacity {
		return nil, fmt.Errorf("room capacity exceeded: current=%d, new=%d, capacity=%d", 
			currentMembers, newMembers, r.Capacity)
	}

	r.Members = utils.MergeMembers(r.Members, userObjectIDs)
	r.UpdatedAt = time.Now()
	resp, err := s.UpdateById(ctx, roomID, *r)
	if err != nil {
		return nil, err
	}

	updated := &resp.Data[0]
	
	// Update cache
	if err := s.cache.SaveRoom(ctx, updated); err != nil {
		log.Printf("[WARN] Failed to update room cache after adding members: %v", err)
	}

	return updated, nil
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
	
	// Update cache
	if err := s.cache.SaveRoom(ctx, updated); err != nil {
		log.Printf("[WARN] Failed to update room cache after removing member: %v", err)
	}

	return updated, err
}

func (s *RoomService) IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	// Try cache first
	if room, err := s.cache.GetRoom(ctx, roomID.Hex()); err == nil && room != nil {
		uid, _ := primitive.ObjectIDFromHex(userID)
		for _, m := range room.Members {
			if m == uid {
				return true, nil
			}
		}
		return false, nil
	}

	// Fallback to database
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

func (s *RoomService) AddUserToRoom(ctx context.Context, roomID, userID string) error {
	rid, _ := primitive.ObjectIDFromHex(roomID)
	exists, err := s.IsUserInRoom(ctx, rid, userID)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}

	_, err = s.AddRoomMember(ctx, roomID, &dto.AddRoomMembersDto{
		Members: []string{userID},
		RoomID:  roomID,
	})
	return err
}

// Add new methods for connection management
func (s *RoomService) ValidateAndTrackConnection(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	// Check if room exists and is active
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return fmt.Errorf("room not found: %w", err)
	}

	// Check if user is a member
	isMember, err := s.IsUserInRoom(ctx, roomID, userID)
	if err != nil {
		return fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return fmt.Errorf("user is not a member of this room")
	}

	// Get current active connections
	activeCount, err := s.cache.GetActiveConnectionsCount(ctx, roomID.Hex())
	if err != nil {
		log.Printf("[WARN] Failed to get active connections count: %v", err)
	} else if activeCount >= int64(room.Capacity) {
		return fmt.Errorf("room is at capacity: %d/%d", activeCount, room.Capacity)
	}

	// Track the new connection
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

// Periodic cleanup of inactive connections
func (s *RoomService) CleanupInactiveConnections(ctx context.Context, roomID primitive.ObjectID) error {
	return s.cache.CleanupInactiveConnections(ctx, roomID.Hex())
}

func (s *RoomService) GetActiveConnectionsCount(ctx context.Context, roomID primitive.ObjectID) (int64, error) {
	return s.cache.GetActiveConnectionsCount(ctx, roomID.Hex())
}
