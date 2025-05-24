package service

import (
	"context"
	"errors"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/chats/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrRoomNotFound = errors.New("room not found")
)

type Service interface {
	CreateRoom(ctx context.Context, room *model.Room) error
	GetRoom(ctx context.Context, id primitive.ObjectID) (*model.Room, error)
	ListRooms(ctx context.Context, page, limit int64) ([]*model.Room, int64, error)
	UpdateRoom(ctx context.Context, room *model.Room) error
	DeleteRoom(ctx context.Context, id primitive.ObjectID) error
	SaveChatMessage(ctx context.Context, msg *model.ChatMessage) error
	GetChatHistoryByRoom(ctx context.Context, roomID string, limit int) ([]*model.ChatMessage, error)
	SaveReadReceipt(ctx context.Context, receipt *model.MessageReadReceipt) error
	SaveReaction(ctx context.Context, reaction *model.MessageReaction) error
}

type service struct {
	db *mongo.Database
}

func NewService(db *mongo.Database) Service {
	return &service{db: db}
}

func (s *service) CreateRoom(ctx context.Context, room *model.Room) error {
	room.CreatedAt = time.Now()
	room.UpdatedAt = time.Now()
	_, err := s.db.Collection("rooms").InsertOne(ctx, room)
	return err
}

func (s *service) GetRoom(ctx context.Context, id primitive.ObjectID) (*model.Room, error) {
	var room model.Room
	err := s.db.Collection("rooms").FindOne(ctx, bson.M{"_id": id}).Decode(&room)
	if err == mongo.ErrNoDocuments {
		return nil, ErrRoomNotFound
	}
	if err != nil {
		return nil, err
	}
	return &room, nil
}

func (s *service) ListRooms(ctx context.Context, page, limit int64) ([]*model.Room, int64, error) {
	skip := (page - 1) * limit
	opts := options.Find().SetSkip(skip).SetLimit(limit)

	cursor, err := s.db.Collection("rooms").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var rooms []*model.Room
	if err = cursor.All(ctx, &rooms); err != nil {
		return nil, 0, err
	}

	total, err := s.db.Collection("rooms").CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, err
	}

	return rooms, total, nil
}

func (s *service) UpdateRoom(ctx context.Context, room *model.Room) error {
	room.UpdatedAt = time.Now()
	result, err := s.db.Collection("rooms").UpdateOne(
		ctx,
		bson.M{"_id": room.ID},
		bson.M{"$set": room},
	)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return ErrRoomNotFound
	}
	return nil
}

func (s *service) DeleteRoom(ctx context.Context, id primitive.ObjectID) error {
	result, err := s.db.Collection("rooms").DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}
	if result.DeletedCount == 0 {
		return ErrRoomNotFound
	}
	return nil
}

func (s *service) SaveChatMessage(ctx context.Context, msg *model.ChatMessage) error {
	msg.Timestamp = time.Now()
	_, err := s.db.Collection("messages").InsertOne(ctx, msg)
	return err
}

func (s *service) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int) ([]*model.ChatMessage, error) {
	opts := options.Find().SetSort(bson.M{"timestamp": -1}).SetLimit(int64(limit))
	cursor, err := s.db.Collection("messages").Find(ctx, bson.M{"roomId": roomID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var messages []*model.ChatMessage
	if err = cursor.All(ctx, &messages); err != nil {
		return nil, err
	}
	return messages, nil
}

func (s *service) SaveReadReceipt(ctx context.Context, receipt *model.MessageReadReceipt) error {
	_, err := s.db.Collection("read_receipts").InsertOne(ctx, receipt)
	return err
}

func (s *service) SaveReaction(ctx context.Context, reaction *model.MessageReaction) error {
	_, err := s.db.Collection("reactions").InsertOne(ctx, reaction)
	return err
} 