package repository

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type RoomRepository interface {
	Create(ctx context.Context, room *model.Room) error

	GetById(ctx context.Context, id primitive.ObjectID) (*model.Room, error)

	GetByName(ctx context.Context, thName, enName string) (*model.Room, error)

	List(ctx context.Context, page, limit int64) ([]*model.Room, int64, error)

	Update(ctx context.Context, room *model.Room) error

	Delete(ctx context.Context, id primitive.ObjectID) error

	ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error)

	FilterRooms(ctx context.Context, filter bson.M) ([]*model.Room, error)
}

type repository struct {
	db *mongo.Client
}

func NewRepository(db *mongo.Client) RoomRepository {
	return &repository{db: db}
}

func (r *repository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *repository) Create(ctx context.Context, room *model.Room) error {
	_, err := r.dbConnect(ctx).Collection("rooms").InsertOne(ctx, room)
	return err
}

func (r *repository) GetById(ctx context.Context, id primitive.ObjectID) (*model.Room, error) {
	var room model.Room
	err := r.dbConnect(ctx).Collection("rooms").FindOne(ctx, bson.M{"_id": id}).Decode(&room)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *repository) GetByName(ctx context.Context, thName, enName string) (*model.Room, error) {
	var room model.Room
	err := r.dbConnect(ctx).Collection("rooms").FindOne(ctx, bson.M{
		"name.th_name": thName,
		"name.en_name": enName,
	}).Decode(&room)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *repository) List(ctx context.Context, page, limit int64) ([]*model.Room, int64, error) {
	skip := (page - 1) * limit

	total, err := r.dbConnect(ctx).Collection("rooms").CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, nil
	}

	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := r.dbConnect(ctx).Collection("rooms").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var rooms []*model.Room
	if err := cursor.All(ctx, &rooms); err != nil {
		return nil, 0, err
	}
	return rooms, total, nil
}

func (r *repository) Update(ctx context.Context, room *model.Room) error {
	_, err := r.dbConnect(ctx).Collection("rooms").ReplaceOne(ctx, bson.M{"_id": room.ID}, room)
	return err
}

func (r *repository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.dbConnect(ctx).Collection("rooms").DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *repository) ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error) {
	count, err := r.dbConnect(ctx).Collection("rooms").CountDocuments(ctx, bson.M{"_id": id})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *repository) FilterRooms(ctx context.Context, filter bson.M) ([]*model.Room, error) {
	cursor, err := r.dbConnect(ctx).Collection("rooms").Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var rooms []*model.Room
	if err := cursor.All(ctx, &rooms); err != nil {
		return nil, err
	}
	return rooms, nil
}
