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
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type (
	RoomService struct {
		*queries.BaseService[model.Room]
		memberCollection *mongo.Collection
		userService     *service.UserService
		fkValidator     *serviceHelper.ForeignKeyValidator
		eventEmitter    *utils.RoomEventEmitter
	}
)

func NewRoomService(db *mongo.Database) *RoomService {
	return &RoomService{
		BaseService:      queries.NewBaseService[model.Room](db.Collection("rooms")),
		memberCollection: db.Collection("room_members"),
		userService:     service.NewUserService(db),
		fkValidator:     serviceHelper.NewForeignKeyValidator(db),
		eventEmitter:    utils.NewRoomEventEmitter(kafka.New([]string{"localhost:9092"}, "room-service"), "localhost:9092"),
	}
}

func (s *RoomService) GetRooms(ctx context.Context, opts queries.QueryOptions) (*queries.Response[model.Room], error) {
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}

	return s.FindAll(ctx, opts)
}

func (s *RoomService) GetRoomById(ctx context.Context, id string) (*model.Room, error) {
	room, err := s.FindOneById(ctx, id)
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

	// Save
	response, err := s.Create(ctx, *room)
	if err != nil {
		return nil, fmt.Errorf("failed to create room: %w", err)
	}

	s.eventEmitter.EmitRoomCreated(ctx, room.ID, room)

	return &response.Data[0], nil
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

func (s *RoomService) AddRoomMember(ctx context.Context, roomID string, dto *dto.AddRoomMembersDto) (*model.RoomMember, error) {
		
	if err := s.fkValidator.ValidateForeignKey(ctx, "rooms", roomID); err != nil {
		return nil, fmt.Errorf("foreign key validation error: %w", err)
	}

	if err := s.fkValidator.ValidateForeignKey(ctx, "users", dto.UserIDs[0]); err != nil {
		return nil, fmt.Errorf("foreign key validation error: %w", err)
	}

	userObjectIDs := dto.ToObjectIDs()
	for i, userID := range dto.UserIDs {
		if err := s.fkValidator.ValidateForeignKey(ctx, "users", userID); err != nil {
			return nil, fmt.Errorf("invalid user at index %d: %w", i, err)
		}
	}

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, fmt.Errorf("invalid room ID format: %w", err)
	}

	// Create room member
	member := &model.RoomMember{
		RoomID:  roomObjectID,
		UserIDs: userObjectIDs,
	}

	result, err := s.memberCollection.InsertOne(ctx, member)
	if err != nil {
		return nil, fmt.Errorf("failed to add room members: %w", err)
	}

	member.ID = result.InsertedID.(primitive.ObjectID)
	return member, nil
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
	var member model.RoomMember
	err = s.memberCollection.FindOne(ctx, map[string]interface{}{
		"roomId":   roomObjectID,
		"userIds": userObjectID,
	}).Decode(&member)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return false, nil
		}
		return false, err
	}

	s.eventEmitter.EmitRoomMemberJoined(ctx, roomObjectID, userObjectID)

	return true, nil
}
