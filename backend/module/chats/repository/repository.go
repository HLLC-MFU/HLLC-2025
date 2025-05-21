package repository

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Repository interface {
	Create(ctx context.Context, room *model.Room) error

	GetById(ctx context.Context, id primitive.ObjectID) (*model.Room, error)

	GetByName(ctx context.Context, thName, enName string) (*model.Room, error)

	List(ctx context.Context, page, limit int64) ([]*model.Room, int64, error)

	Update(ctx context.Context, room *model.Room) error

	Delete(ctx context.Context, id primitive.ObjectID) error

	ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error)

	SaveChatMessage(ctx context.Context, msg *model.ChatMessage) error

	GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessage, error)

	Save(ctx context.Context, msg *model.ChatMessage) (primitive.ObjectID, error)

	SaveReaction(ctx context.Context, reaction *model.MessageReaction) error
	SaveReadReceipt(ctx context.Context, receipt *model.MessageReadReceipt) error

	GetReactionsByMessageID(ctx context.Context, messageID primitive.ObjectID) ([]model.MessageReaction, error)
	GetReadReceiptsByMessageID(ctx context.Context, messageID primitive.ObjectID) ([]model.MessageReadReceipt, error)
	GetMessageByID(ctx context.Context, id primitive.ObjectID) (*model.ChatMessage, error)
}

type repository struct {
	db *mongo.Client
}

func NewRepository(db *mongo.Client) Repository {
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

func (r *repository) CreateChatHistories(ctx context.Context, chatHistory *model.ChatMessage) error {
	_, err := r.dbConnect(ctx).Collection("chat_histories").InsertOne(ctx, chatHistory)
	return err
}

func (r *repository) SaveChatMessage(ctx context.Context, msg *model.ChatMessage) error {
	_, err := r.dbConnect(ctx).Collection("chat_messages").InsertOne(ctx, msg)
	return err
}

func (r *repository) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessage, error) {
	filter := bson.M{"room_id": roomID}
	opts := options.Find().
		SetSort(bson.M{"timestamp": -1}).
		SetLimit(limit)

	cursor, err := r.dbConnect(ctx).Collection("chat_messages").Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var messages []model.ChatMessage
	if err := cursor.All(ctx, &messages); err != nil {
		return nil, err
	}

	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

func (r *repository) Save(ctx context.Context, msg *model.ChatMessage) (primitive.ObjectID, error) {
	res, err := r.dbConnect(ctx).Collection("chat_messages").InsertOne(ctx, msg)
	if err != nil {
		return primitive.NilObjectID, err
	}
	return res.InsertedID.(primitive.ObjectID), nil
}

func (r *repository) SaveReaction(ctx context.Context, reaction *model.MessageReaction) error {
	_, err := r.dbConnect(ctx).Collection("message_reactions").InsertOne(ctx, reaction)
	return err
}

func (r *repository) SaveReadReceipt(ctx context.Context, receipt *model.MessageReadReceipt) error {
	_, err := r.dbConnect(ctx).Collection("message_read_receipts").InsertOne(ctx, receipt)
	return err
}

func (r *repository) GetReactionsByMessageID(ctx context.Context, messageID primitive.ObjectID) ([]model.MessageReaction, error) {
	filter := bson.M{"message_id": messageID}
	cursor, err := r.dbConnect(ctx).Collection("message_reactions").Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var reactions []model.MessageReaction
	if err := cursor.All(ctx, &reactions); err != nil {
		return nil, err
	}
	return reactions, nil
}

func (r *repository) GetReadReceiptsByMessageID(ctx context.Context, messageID primitive.ObjectID) ([]model.MessageReadReceipt, error) {
	filter := bson.M{"message_id": messageID}
	cursor, err := r.dbConnect(ctx).Collection("message_read_receipts").Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var receipts []model.MessageReadReceipt
	if err := cursor.All(ctx, &receipts); err != nil {
		return nil, err
	}
	return receipts, nil
}

func (r *repository) GetMessageByID(ctx context.Context, id primitive.ObjectID) (*model.ChatMessage, error) {
	var msg model.ChatMessage
	err := r.dbConnect(ctx).Collection("chat_messages").
		FindOne(ctx, bson.M{"_id": id}).Decode(&msg)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	return &msg, err
}
