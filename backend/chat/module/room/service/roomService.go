package service

import (
	"chat/module/room/model"
	"chat/pkg/database/queries"
	"context"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type (
	RoomService struct {
		*queries.BaseService[model.Room]
		memberCollection *mongo.Collection
	}
)

func NewRoomService(db *mongo.Database) *RoomService {
	return &RoomService{
		BaseService: queries.NewBaseService[model.Room](db.Collection("rooms")),
		memberCollection: db.Collection("room_members"),
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

func (s *RoomService) CreateRoom(ctx context.Context, room *model.Room, createdBy string) (*model.Room, error) {
	response, err := s.Create(ctx, *room)
	if err != nil {
		return nil, err
	}
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
	return &room.Data[0], nil
}

func (s *RoomService) AddRoomMember(ctx context.Context, id string, member *model.RoomMember) (*model.RoomMember, error) {
	result, err := s.memberCollection.InsertOne(ctx, member)
	if err != nil {
		return nil, err
	}
	member.ID = result.InsertedID.(primitive.ObjectID)
	return member, nil
}
