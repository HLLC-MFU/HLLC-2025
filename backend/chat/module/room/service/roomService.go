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

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type (
	RoomService struct {
		*queries.BaseService[model.Room]
		userService     *service.UserService
		fkValidator     *serviceHelper.ForeignKeyValidator
		eventEmitter    *utils.RoomEventEmitter
	}
)

func NewRoomService(db *mongo.Database) *RoomService {
	// Create Kafka bus for room events
	bus := kafka.New([]string{"localhost:9092"}, "room-service")
	if err := bus.Start(); err != nil {
		log.Printf("[ERROR] Failed to start Kafka bus: %v", err)
	}

	return &RoomService{
		BaseService:      queries.NewBaseService[model.Room](db.Collection("rooms")),
		userService:     service.NewUserService(db),
		fkValidator:     serviceHelper.NewForeignKeyValidator(db),
		eventEmitter:    utils.NewRoomEventEmitter(bus, "localhost:9092"),
	}
}

func (s *RoomService) GetRooms(ctx context.Context, opts queries.QueryOptions) (*queries.Response[model.Room], error) {
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}

	return s.FindAll(ctx, opts)
}

func (s *RoomService) GetRoomById(ctx context.Context, roomID primitive.ObjectID) (*model.Room, error) {
	room, err := s.FindOneById(ctx, roomID.Hex())
	if err != nil {
		return nil, err
	}
	return &room.Data[0], nil
}

func (s *RoomService) CreateRoom(ctx context.Context, createDto *dto.CreateRoomDto) (*model.Room, error) {
	// Validate DTO
	if err := validator.ValidateStruct(createDto); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Validate foreign key
	if err := s.fkValidator.ValidateForeignKey(ctx, "users", createDto.CreatedBy); err != nil {
		return nil, fmt.Errorf("foreign key validation error: %w", err)
	}

	// Create room model
	room := &model.Room{
		Name:      createDto.Name,
		Capacity:  createDto.Capacity,
		CreatedBy: createDto.ToObjectID(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save to database
	response, err := s.Create(ctx, *room)
	if err != nil {
		return nil, fmt.Errorf("failed to create room: %w", err)
	}

	// Get the created room with ID
	createdRoom := &response.Data[0]
	log.Printf("[RoomService] Created room with ID: %s", createdRoom.ID.Hex())

	// Emit room created event with the actual room ID
	s.eventEmitter.EmitRoomCreated(ctx, createdRoom.ID, createdRoom)

	return createdRoom, nil
}

func (s *RoomService) UpdateRoom(ctx context.Context, id string, room *model.Room) (*model.Room, error) {
	response, err := s.UpdateById(ctx, id, *room)
	if err != nil {
		return nil, err
	}
	return &response.Data[0], nil
}

func (s *RoomService) DeleteRoom(ctx context.Context, id string) (*model.Room, error) {
	room, err := s.DeleteById(ctx, id)
	if err != nil {
		return nil, err
	}

	s.eventEmitter.EmitRoomDeleted(ctx, room.Data[0].ID)

	return &room.Data[0], nil
}

func (s *RoomService) AddRoomMember(ctx context.Context, roomID string, dto *dto.AddRoomMembersDto) (*model.Room, error) {
	if err := s.fkValidator.ValidateForeignKey(ctx, "rooms", roomID); err != nil {
		return nil, fmt.Errorf("foreign key validation error: %w", err)
	}

	if err := s.fkValidator.ValidateForeignKey(ctx, "users", dto.Members[0]); err != nil {
		return nil, fmt.Errorf("foreign key validation error: %w", err)
	}

	userObjectIDs := dto.ToObjectIDs()
	for i, userID := range dto.Members {
		if err := s.fkValidator.ValidateForeignKey(ctx, "users", userID); err != nil {
			return nil, fmt.Errorf("invalid user at index %d: %w", i, err)
		}
	}

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, fmt.Errorf("invalid room ID format: %w", err)
	}

	// Create room member
	room := &model.Room{
		Members: userObjectIDs,
	}

	result, err := s.UpdateById(ctx, roomID, *room)
	if err != nil {
		return nil, fmt.Errorf("failed to add room members: %w", err)
	}

	log.Printf("[RoomService] Added members to room %s: %v", roomID, userObjectIDs)

	// Emit member joined events for each user
	for _, userID := range userObjectIDs {
		s.eventEmitter.EmitRoomMemberJoined(ctx, roomObjectID, userID)
	}

	return &result.Data[0], nil
}

func (s *RoomService) IsUserMemberOfRoom(ctx context.Context, roomID string, userID string) (bool, error) {
	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return false, fmt.Errorf("invalid room ID format: %w", err)
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return false, fmt.Errorf("invalid user ID format: %w", err)
	}

	// Find room member document
	room, err := s.GetRoomById(ctx, roomObjectID)

	if err != nil {
		return false, err
	}

	for _, member := range room.Members {
		if member.Hex() == userObjectID.Hex() {
			return true, nil
		}
	}

	s.eventEmitter.EmitRoomMemberJoined(ctx, roomObjectID, userObjectID)

	return true, nil
}

func (s *RoomService) AddUserToRoom(ctx context.Context, roomID, userID string) error {
	rid, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return fmt.Errorf("invalid room ID: %w", err)
	}

	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// Check if user is already in room
	exists, err := s.IsUserInRoom(ctx, rid, userID)
	if err != nil {
		return err
	}
	if exists {
		return nil // User already in room
	}

	// Add user to room
	room := &model.Room{
		Members: []primitive.ObjectID{uid},
	}

	_, err = s.UpdateById(ctx, rid.Hex(), *room)
	if err != nil {
		return fmt.Errorf("failed to add user to room: %w", err)
	}

	return nil
}

func (s *RoomService) RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	room := &model.Room{
		Members: []primitive.ObjectID{uid},
	}

	_, err = s.UpdateById(ctx, roomID.Hex(), *room)
	if err != nil {
		return fmt.Errorf("failed to remove user from room: %w", err)
	}

	return nil
}

func (s *RoomService) IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	room, err := s.GetRoomById(ctx, roomID)
	if err != nil {
		return false, fmt.Errorf("failed to check room membership: %w", err)
	}

	for _, member := range room.Members {
		if member.Hex() == userID {
			return true, nil
		}
	}

	return false, nil
}
