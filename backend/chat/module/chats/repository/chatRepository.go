package repository

import (
	"context"
	"fmt"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ChatRepository interface {
	SaveChatMessage(ctx context.Context, msg *model.ChatMessage) error
	GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessage, error)
	Save(ctx context.Context, msg *model.ChatMessage) (primitive.ObjectID, error)
	GetReactionsByMessageID(ctx context.Context, messageID primitive.ObjectID) ([]model.MessageReaction, error)
	GetMessageByID(ctx context.Context, id primitive.ObjectID) (*model.ChatMessage, error)
	DeleteMessagesByRoomID(ctx context.Context, roomID string) error
	DeleteReactionsByRoomID(ctx context.Context, roomID string) error
	DeleteReadReceiptsByRoomID(ctx context.Context, roomID string) error
	AddReactionToMessage(ctx context.Context, messageID primitive.ObjectID, reaction *model.MessageReaction) error
}
type repository struct {
	db *mongo.Client
}

func NewRepository(db *mongo.Client) ChatRepository {
	return &repository{db: db}
}

func (r *repository) dbConnect() *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *repository) SaveChatMessage(ctx context.Context, msg *model.ChatMessage) error {
	res, err := r.dbConnect().Collection("chat-messages").InsertOne(ctx, msg)
	if err != nil {
		return err
	}

	if oid, ok := res.InsertedID.(primitive.ObjectID); ok {
		msg.ID = oid
	} else {
		return fmt.Errorf("failed to assert InsertedID as ObjectID")
	}
	return nil
}

func (r *repository) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessage, error) {
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, err
	}
	filter := bson.M{"room_id": roomObjID}
	opts := options.Find().
		SetSort(bson.M{"timestamp": -1}).
		SetLimit(limit)

	cursor, err := r.dbConnect().Collection("chat-messages").Find(ctx, filter, opts)
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
	res, err := r.dbConnect().Collection("chat-messages").InsertOne(ctx, msg)
	if err != nil {
		return primitive.NilObjectID, err
	}
	return res.InsertedID.(primitive.ObjectID), nil
}

func (r *repository) GetReactionsByMessageID(ctx context.Context, messageID primitive.ObjectID) ([]model.MessageReaction, error) {
	filter := bson.M{"message_id": messageID}
	cursor, err := r.dbConnect().Collection("message_reactions").Find(ctx, filter)
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

func (r *repository) GetMessageByID(ctx context.Context, id primitive.ObjectID) (*model.ChatMessage, error) {
	var msg model.ChatMessage
	err := r.dbConnect().Collection("chat-messages").
		FindOne(ctx, bson.M{"_id": id}).Decode(&msg)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	return &msg, err
}

// DeleteMessagesByRoomID deletes all messages for a room
func (r *repository) DeleteMessagesByRoomID(ctx context.Context, roomID string) error {
	filter := bson.M{"room_id": roomID}
	_, err := r.dbConnect().Collection("chat-messages").DeleteMany(ctx, filter)
	return err
}

// DeleteReactionsByRoomID deletes all reactions for messages in a room
func (r *repository) DeleteReactionsByRoomID(ctx context.Context, roomID string) error {
	// First get all message IDs for this room
	var messageIDs []primitive.ObjectID
	filter := bson.M{"room_id": roomID}
	cursor, err := r.dbConnect().Collection("chat-messages").Find(ctx, filter, options.Find().SetProjection(bson.M{"_id": 1}))
	if err != nil {
		log.Printf("[DeleteReactionsByRoomID] Failed to find messages for room %s: %v", roomID, err)
		return err
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var msg struct {
			ID primitive.ObjectID `bson:"_id"`
		}
		if err := cursor.Decode(&msg); err != nil {
			log.Printf("[DeleteReactionsByRoomID] Failed to decode message ID: %v", err)
			return err
		}
		messageIDs = append(messageIDs, msg.ID)
	}

	log.Printf("[DeleteReactionsByRoomID] Found %d messages for room %s", len(messageIDs), roomID)

	if len(messageIDs) == 0 {
		return nil
	}

	// Delete all reactions for these messages
	reactionFilter := bson.M{"message_id": bson.M{"$in": messageIDs}}
	result, err := r.dbConnect().Collection("message_reactions").DeleteMany(ctx, reactionFilter)
	if err != nil {
		log.Printf("[DeleteReactionsByRoomID] Failed to delete reactions: %v", err)
		return err
	}
	log.Printf("[DeleteReactionsByRoomID] Deleted %d reactions for room %s", result.DeletedCount, roomID)
	return nil
}

// DeleteReadReceiptsByRoomID deletes all read receipts for messages in a room
func (r *repository) DeleteReadReceiptsByRoomID(ctx context.Context, roomID string) error {
	// First get all message IDs for this room
	var messageIDs []primitive.ObjectID
	filter := bson.M{"room_id": roomID}
	cursor, err := r.dbConnect().Collection("chat-messages").Find(ctx, filter, options.Find().SetProjection(bson.M{"_id": 1}))
	if err != nil {
		log.Printf("[DeleteReadReceiptsByRoomID] Failed to find messages for room %s: %v", roomID, err)
		return err
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var msg struct {
			ID primitive.ObjectID `bson:"_id"`
		}
		if err := cursor.Decode(&msg); err != nil {
			log.Printf("[DeleteReadReceiptsByRoomID] Failed to decode message ID: %v", err)
			return err
		}
		messageIDs = append(messageIDs, msg.ID)
	}

	log.Printf("[DeleteReadReceiptsByRoomID] Found %d messages for room %s", len(messageIDs), roomID)

	if len(messageIDs) == 0 {
		return nil
	}

	// Delete all read receipts for these messages
	receiptFilter := bson.M{"message_id": bson.M{"$in": messageIDs}}
	result, err := r.dbConnect().Collection("message_read_receipts").DeleteMany(ctx, receiptFilter)
	if err != nil {
		log.Printf("[DeleteReadReceiptsByRoomID] Failed to delete read receipts: %v", err)
		return err
	}
	log.Printf("[DeleteReadReceiptsByRoomID] Deleted %d read receipts for room %s", result.DeletedCount, roomID)
	return nil
}

func (r *repository) AddReactionToMessage(ctx context.Context, messageID primitive.ObjectID, reaction *model.MessageReaction) error {
	update := bson.M{
		"$push": bson.M{"reactions": reaction},
	}
	filter := bson.M{"_id": messageID}
	_, err := r.dbConnect().Collection("chat-messages").UpdateOne(ctx, filter, update)
	return err
}
