package repository

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/members/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type RoomMemberRepository interface {
	AddUserToRoom(ctx context.Context, roomID primitive.ObjectID, userID primitive.ObjectID) error
	RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID primitive.ObjectID) error
	GetRoomMembers(ctx context.Context, roomID primitive.ObjectID) ([]primitive.ObjectID, error)
	IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID primitive.ObjectID) (bool, error)
	ListRoomMembers(ctx context.Context, page, limit int64) ([]*model.RoomMember, int64, error)
}

type roomMemberRepository struct {
	db *mongo.Client
}

func NewRoomMemberRepository(db *mongo.Client) RoomMemberRepository {
	return &roomMemberRepository{db: db}
}

func (r *roomMemberRepository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *roomMemberRepository) AddUserToRoom(ctx context.Context, roomID primitive.ObjectID, userID primitive.ObjectID) error {
	filter := bson.M{"room_id": roomID}
	update := bson.M{"$addToSet": bson.M{"user_ids": userID}}
	_, err := r.dbConnect(ctx).Collection("room_members").UpdateOne(ctx, filter, update, options.Update().SetUpsert(true))
	return err
}

func (r *roomMemberRepository) RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID primitive.ObjectID) error {
	filter := bson.M{"room_id": roomID}
	update := bson.M{"$pull": bson.M{"user_ids": userID}}
	_, err := r.dbConnect(ctx).Collection("room_members").UpdateOne(ctx, filter, update)
	return err
}

func (r *roomMemberRepository) GetRoomMembers(ctx context.Context, roomID primitive.ObjectID) ([]primitive.ObjectID, error) {
	var room model.RoomMember
	err := r.dbConnect(ctx).Collection("room_members").FindOne(ctx, bson.M{"room_id": roomID}).Decode(&room)
	if err != nil {
		return nil, err
	}
	return room.UserIDs, nil
}

func (r *roomMemberRepository) IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID primitive.ObjectID) (bool, error) {
	filter := bson.M{"room_id": roomID, "user_ids": userID}
	count, err := r.dbConnect(ctx).Collection("room_members").CountDocuments(ctx, filter)
	return count > 0, err
}

func (r *roomMemberRepository) ListRoomMembers(ctx context.Context, page, limit int64) ([]*model.RoomMember, int64, error) {
	skip := (page - 1) * limit

	total, err := r.dbConnect(ctx).Collection("room_members").CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, nil
	}

	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := r.dbConnect(ctx).Collection("room_members").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var roomMember []*model.RoomMember
	if err := cursor.All(ctx, &roomMember); err != nil {
		return nil, 0, err
	}
	return roomMember, total, nil
}
