package service

import (
	"chat/module/room/dto"
	roomModel "chat/module/room/model"
	"chat/module/room/utils"
	userModel "chat/module/user/model"
	"chat/module/user/service"
	"chat/pkg/config"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	serviceHelper "chat/pkg/helpers/service"
	"chat/pkg/validator"
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type RoomService struct {
	*queries.BaseService[roomModel.Room]
	userService     *service.UserService
	fkValidator     *serviceHelper.ForeignKeyValidator
	eventEmitter    *utils.RoomEventEmitter
	cache           *utils.RoomCacheService
	collection      *mongo.Collection
}

func NewRoomService(db *mongo.Database, redis *redis.Client, cfg *config.Config) *RoomService {
	collection := db.Collection("rooms")
	bus := kafka.New(cfg.Kafka.Brokers, "room-service")
	if err := bus.Start(); err != nil {
		log.Printf("[ERROR] Failed to start Kafka bus: %v", err)
	}

	return &RoomService{
		BaseService:   queries.NewBaseService[roomModel.Room](collection),
		userService:   service.NewUserService(db),
		fkValidator:   serviceHelper.NewForeignKeyValidator(db),
		eventEmitter:  utils.NewRoomEventEmitter(bus, cfg),
		cache:         utils.NewRoomCacheService(redis),
		collection:    collection,
	}
}

func (s *RoomService) parseSort(sort string) bson.M {
	result := bson.M{}
	if sort == "" {
		return result
	}

	for _, field := range strings.Split(sort, ",") {
		if strings.HasPrefix(field, "-") {
			result[strings.TrimPrefix(field, "-")] = -1
		} else {
			result[field] = 1
		}
	}
	return result
}

func (s *RoomService) GetRooms(ctx context.Context, opts queries.QueryOptions) (*queries.Response[roomModel.Room], error) {
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}

	// Use FindAllWithPopulate to handle population
	rooms, err := s.FindAllWithPopulate(ctx, opts, "createdBy", "users")
	if err != nil {
		return nil, err
	}

	// Populate members separately since it's an array
	rooms, err = s.FindAllWithPopulate(ctx, opts, "members", "users")
	if err != nil {
		return nil, err
	}

	return rooms, nil
}

func (s *RoomService) GetRoomById(ctx context.Context, roomID primitive.ObjectID) (*roomModel.Room, error) {
	if room, err := s.cache.GetRoom(ctx, roomID.Hex()); err == nil && room != nil {
		return room, nil
	}

	// First get the room with creator populated
	populated, err := s.FindOneById(ctx, roomID.Hex())
	if err != nil {
		return nil, err
	}

	result := &populated.Data[0]

	// Then populate members
	if len(result.Members) > 0 {
		memberIDs := make([]primitive.ObjectID, len(result.Members))
		for i, member := range result.Members {
			memberIDs[i] = member.ID
		}

		users, err := s.userService.GetUsers(ctx, queries.QueryOptions{
			Filter: map[string]interface{}{
				"_id": map[string]interface{}{
					"$in": memberIDs,
				},
			},
		})
		if err != nil {
			return nil, err
		}

		result.Members = make([]*userModel.User, len(users.Data))
		for i, user := range users.Data {
			result.Members[i] = &user
		}
	}

	if err := s.cache.SaveRoom(ctx, result); err != nil {
		log.Printf("[WARN] Failed to cache room: %v", err)
	}

	return result, nil
}

func (s *RoomService) CreateRoom(ctx context.Context, createDto *dto.CreateRoomDto) (*roomModel.Room, error) {
	if err := validator.ValidateStruct(createDto); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Get creator
	creator, err := s.userService.GetUserById(ctx, createDto.CreatedBy)
	if err != nil {
		return nil, fmt.Errorf("failed to get creator: %w", err)
	}

	// Get members
	members := make([]*userModel.User, 0, len(createDto.Members))
	for _, memberID := range createDto.Members {
		member, err := s.userService.GetUserById(ctx, memberID)
		if err != nil {
			return nil, fmt.Errorf("failed to get member %s: %w", memberID, err)
		}
		members = append(members, member)
	}

	// Create room
	room := &roomModel.Room{
		Name:      createDto.Name,
		Capacity:  createDto.Capacity,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		CreatedBy: creator,
		Members:   members,
	}

	resp, err := s.Create(ctx, *room)
	if err != nil {
		return nil, err
	}

	result := &resp.Data[0]

	// Cache the room
	if err := s.cache.SaveRoom(ctx, result); err != nil {
		log.Printf("[WARN] Failed to cache room: %v", err)
	}

	return result, nil
}

func (s *RoomService) UpdateRoom(ctx context.Context, id string, room *roomModel.Room) (*roomModel.Room, error) {
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

func (s *RoomService) DeleteRoom(ctx context.Context, id string) (*roomModel.Room, error) {
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

func (s *RoomService) RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (*roomModel.Room, error) {
	r, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return nil, err
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// Filter out the user from members
	filteredMembers := make([]*userModel.User, 0, len(r.Members))
	for _, member := range r.Members {
		if member.ID != userObjID {
			filteredMembers = append(filteredMembers, member)
		}
	}
	r.Members = filteredMembers
	r.UpdatedAt = time.Now()
	
	resp, err := s.UpdateById(ctx, roomID.Hex(), *r)
	if err != nil {
		return nil, err
	}

	result := &resp.Data[0]
	if err := s.cache.SaveRoom(ctx, result); err != nil {
		log.Printf("[WARN] Failed to update room cache after removing member: %v", err)
	}

	return result, nil
}

func (s *RoomService) IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return false, fmt.Errorf("invalid user ID: %w", err)
	}

	if room, err := s.cache.GetRoom(ctx, roomID.Hex()); err == nil && room != nil {
		for _, m := range room.Members {
			if m.ID == userObjID {
				return true, nil
			}
		}
		return false, nil
	}

	r, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, err
	}

	for _, m := range r.Members {
		if m.ID == userObjID {
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

	user, err := s.userService.GetUserById(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Check if user is already in room
	for _, member := range room.Members {
		if member.ID == user.ID {
			return nil // User is already in room
		}
	}

	room.Members = append(room.Members, user)
	room.UpdatedAt = time.Now()

	if _, err := s.UpdateById(ctx, roomObjID.Hex(), *room); err != nil {
		return fmt.Errorf("failed to update room: %w", err)
	}

	if err := s.cache.SaveRoom(ctx, room); err != nil {
		log.Printf("[WARN] Failed to update room cache after adding member: %v", err)
	}

	s.eventEmitter.EmitRoomMemberJoined(ctx, roomObjID, user.ID)

	return nil
}
