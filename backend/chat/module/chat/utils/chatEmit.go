package utils

import (
	"chat/module/chat/model"
	userModel "chat/module/user/model"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ChatEventEmitter struct {
	hub   *Hub
	bus   *kafka.Bus
	redis *redis.Client
	mongo *mongo.Database
}

func NewChatEventEmitter(hub *Hub, bus *kafka.Bus, redis *redis.Client, mongo *mongo.Database) *ChatEventEmitter {
	return &ChatEventEmitter{
		hub:   hub,
		bus:   bus,
		redis: redis,
		mongo: mongo,
	}
}

func (e *ChatEventEmitter) EmitMessage(ctx context.Context, msg *model.ChatMessage) error {
	log.Printf("[TRACE] EmitMessage called for message ID=%s Room=%s Text=%s", 
		msg.ID.Hex(), msg.RoomID.Hex(), msg.Message)

	// Get user data
	userInfo, err := e.getUserInfo(ctx, msg.UserID)
	if err != nil {
		log.Printf("[WARN] Failed to get user info: %v", err)
		userInfo = model.UserInfo{ID: msg.UserID.Hex()}
	}

	// Get room data (basic for now)
	roomInfo := model.RoomInfo{ID: msg.RoomID.Hex()}

	// Determine message type and event type
	var messageType string
	var eventType string
	
	if msg.StickerID != nil {
		eventType = model.EventTypeSticker
		messageType = model.MessageTypeSticker
	} else if msg.ReplyToID != nil {
		eventType = model.EventTypeReply  
		messageType = model.MessageTypeReply
	} else {
		eventType = model.EventTypeMessage
		messageType = model.MessageTypeText
	}

	// Create message info
	messageInfo := model.MessageInfo{
		ID:        msg.ID.Hex(),
		Type:      messageType,
		Message:   msg.Message,
		Timestamp: msg.Timestamp,
	}

	// Create appropriate payload based on message type
	if msg.StickerID != nil {
		// Sticker message
		stickerInfo := model.StickerInfo{
			ID:    msg.StickerID.Hex(),
			Image: msg.Image,
		}
		
		payload := model.ChatStickerPayload{
			BasePayload: model.BasePayload{
				Room:      roomInfo,
				User:      userInfo,
				Timestamp: msg.Timestamp,
			},
			Message: messageInfo,
			Sticker: stickerInfo,
		}

		event := model.Event{
			Type:      eventType,
			Payload:   payload,
			Timestamp: msg.Timestamp,
		}
		
		return e.emitEventStructured(ctx, msg, event)
	} else {
		// Text or reply message
		payload := model.ChatMessagePayload{
			BasePayload: model.BasePayload{
				Room:      roomInfo,
				User:      userInfo,
				Timestamp: msg.Timestamp,
			},
			Message: messageInfo,
		}

		// Add reply information if this is a reply
		if msg.ReplyToID != nil {
			if replyToMsg, err := e.getReplyToMessage(ctx, *msg.ReplyToID); err == nil {
				payload.ReplyTo = replyToMsg
			}
		}

		event := model.Event{
			Type:      eventType,
			Payload:   payload,
			Timestamp: msg.Timestamp,
		}
		
		return e.emitEventStructured(ctx, msg, event)
	}
}

func (e *ChatEventEmitter) emitEvent(ctx context.Context, msg *model.ChatMessage, event ChatEvent) error {
	// Don't modify the event payload here - it's already been set correctly
	
	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	e.hub.BroadcastEvent(event)

	roomTopic := getRoomTopic(msg.RoomID.Hex())

	if err := e.bus.Emit(ctx, roomTopic, msg.RoomID.Hex(), eventBytes); err != nil {
		log.Printf("[WARN] Failed to emit to Kafka (continuing without Kafka): %v", err)
		// Don't return error - continue without Kafka
	}

	log.Printf("[Kafka] Successfully published message ID=%s to topic %s", msg.ID.Hex(), roomTopic)
	return nil
}

func (e *ChatEventEmitter) EmitReaction(ctx context.Context, reaction *model.MessageReaction, roomID primitive.ObjectID) error {
	// Get user data for the person who reacted
	userInfo, err := e.getUserInfo(ctx, reaction.UserID)
	if err != nil {
		log.Printf("[WARN] Failed to get user info for reaction: %v", err)
		userInfo = model.UserInfo{ID: reaction.UserID.Hex()}
	}

	// Get room data
	roomInfo := model.RoomInfo{ID: roomID.Hex()}

	// Determine reaction type (add vs remove)
	reactionType := model.ReactionTypeAdd
	if reaction.Reaction == "remove" {
		reactionType = model.ReactionTypeRemove
	}

	// Create message info for reaction (message being reacted to)
	messageInfo := model.MessageInfo{
		ID:        reaction.MessageID.Hex(),
		Type:      "reaction",
		Reaction:  reaction.Reaction,
		Timestamp: reaction.Timestamp,
	}

	event := model.ChatReactionPayload{
		BasePayload: model.BasePayload{
			Room:      roomInfo,
			User:      userInfo,
			Timestamp: reaction.Timestamp,
		},
		Message:      messageInfo,
		ReactionType: reactionType,
	}

	return e.emitReactionEvent(ctx, roomID, event)
}

func (e *ChatEventEmitter) EmitReactionRemoved(ctx context.Context, messageID, userID, roomID primitive.ObjectID) error {
	event := ChatEvent{
		Type: "reaction_removed",
		Payload: map[string]string{
			"messageId": messageID.Hex(),
			"userId":    userID.Hex(),
		},
	}

	eventBytes, _ := json.Marshal(event)
	e.hub.BroadcastToRoom(roomID.Hex(), eventBytes)

	roomTopic := getRoomTopic(roomID.Hex())
	if err := e.bus.Emit(ctx, roomTopic, roomID.Hex(), eventBytes); err != nil {
		log.Printf("[WARN] Failed to emit reaction removal to Kafka (continuing without Kafka): %v", err)
		// Don't return error - continue without Kafka
	}

	log.Printf("[Kafka] Successfully published reaction removal to topic %s", roomTopic)
	return nil
}

func (e *ChatEventEmitter) EmitTyping(ctx context.Context, roomID, userID string) error {
	event := ChatEvent{
		Type:      "typing",
		Payload: map[string]string{
			"roomId": roomID,
			"userId": userID,
		},
	}

	eventBytes, _ := json.Marshal(event)
	e.hub.BroadcastToRoom(roomID, eventBytes)
	return nil
}

func (e *ChatEventEmitter) EmitUserJoined(ctx context.Context, roomID, userID string) error {
	event := ChatEvent{
		Type:      "user_joined",
		Payload: map[string]string{
			"roomId": roomID,
			"userId": userID,
		},
	}

	eventBytes, _ := json.Marshal(event)
	e.hub.BroadcastToRoom(roomID, eventBytes)

	roomTopic := getRoomTopic(roomID)
	if err := e.bus.Emit(ctx, roomTopic, roomID, eventBytes); err != nil {
		log.Printf("[WARN] Failed to emit user_joined to Kafka (continuing without Kafka): %v", err)
		// Don't return error - continue without Kafka
	}

	log.Printf("[Kafka] Successfully published user_joined to topic %s", roomTopic)
	return nil
}

func (e *ChatEventEmitter) EmitUserLeft(ctx context.Context, roomID, userID string) error {
	event := ChatEvent{
		Type: "user_left",
		Payload: map[string]string{
			"roomId": roomID,
			"userId": userID,
		},
	}

	eventBytes, _ := json.Marshal(event)
	e.hub.BroadcastToRoom(roomID, eventBytes)

	roomTopic := getRoomTopic(roomID)
	if err := e.bus.Emit(ctx, roomTopic, roomID, eventBytes); err != nil {
		log.Printf("[WARN] Failed to emit user_left to Kafka (continuing without Kafka): %v", err)
		// Don't return error - continue without Kafka
	}

	log.Printf("[Kafka] Successfully published user_left to topic %s", roomTopic)
	return nil
}

// Helper methods for mobile event structure

func (e *ChatEventEmitter) getUserInfo(ctx context.Context, userID primitive.ObjectID) (model.UserInfo, error) {
	userService := queries.NewBaseService[userModel.User](e.mongo.Collection("users"))
	result, err := userService.FindOneWithPopulate(ctx, bson.M{"_id": userID}, "role", "roles")
	
	if err != nil || len(result.Data) == 0 {
		return model.UserInfo{ID: userID.Hex()}, err
	}

	user := result.Data[0]
	userInfo := model.UserInfo{
		ID:       user.ID.Hex(),
		Username: user.Username,
		Name:     map[string]interface{}{
			"first":  user.Name.First,
			"middle": user.Name.Middle,
			"last":   user.Name.Last,
		},
	}

	// Add role information if available
	if user.Role != primitive.NilObjectID {
		roleService := queries.NewBaseService[interface{}](e.mongo.Collection("roles"))
		roleResult, err := roleService.FindOne(ctx, bson.M{"_id": user.Role})
		if err == nil && len(roleResult.Data) > 0 {
			if roleData, ok := roleResult.Data[0].(map[string]interface{}); ok {
				userInfo.Role = &model.RoleInfo{
					ID:   roleData["_id"].(primitive.ObjectID).Hex(),
					Name: roleData["name"].(string),
				}
			}
		}
	}

	return userInfo, nil
}

func (e *ChatEventEmitter) getReplyToMessage(ctx context.Context, replyToID primitive.ObjectID) (*model.MessageInfo, error) {
	// Get the original message being replied to
	replyToService := queries.NewBaseService[model.ChatMessage](e.mongo.Collection("chat_messages"))
	replyResult, err := replyToService.FindOne(ctx, bson.M{"_id": replyToID})
	
	if err != nil || len(replyResult.Data) == 0 {
		return nil, err
	}

	replyMsg := replyResult.Data[0]
	
	// Determine message type
	var messageType string
	if replyMsg.StickerID != nil {
		messageType = model.MessageTypeSticker
	} else {
		messageType = model.MessageTypeText
	}

	return &model.MessageInfo{
		ID:        replyMsg.ID.Hex(),
		Type:      messageType,
		Message:   replyMsg.Message,
		Timestamp: replyMsg.Timestamp,
	}, nil
}

// emitEventStructured handles the new unified Event structure
func (e *ChatEventEmitter) emitEventStructured(ctx context.Context, msg *model.ChatMessage, event model.Event) error {
	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal structured event: %w", err)
	}

	// Broadcast directly to room instead of using BroadcastEvent
	e.hub.BroadcastToRoom(msg.RoomID.Hex(), eventBytes)

	roomTopic := getRoomTopic(msg.RoomID.Hex())
	if err := e.bus.Emit(ctx, roomTopic, msg.RoomID.Hex(), eventBytes); err != nil {
		log.Printf("[WARN] Failed to emit to Kafka (continuing without Kafka): %v", err)
		// Don't return error - continue without Kafka
	}

	log.Printf("[Kafka] Successfully published structured event type=%s to topic %s", event.Type, roomTopic)
	return nil
}

func (e *ChatEventEmitter) emitReactionEvent(ctx context.Context, roomID primitive.ObjectID, payload model.ChatReactionPayload) error {
	// Create proper Event structure
	event := model.Event{
		Type:      model.EventTypeReaction,
		Payload:   payload,
		Timestamp: payload.Timestamp,
	}

	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal reaction event: %w", err)
	}

	// Broadcast directly to room instead of using BroadcastEvent
	e.hub.BroadcastToRoom(roomID.Hex(), eventBytes)

	// Emit to Kafka
	roomTopic := getRoomTopic(roomID.Hex())
	if err := e.bus.Emit(ctx, roomTopic, roomID.Hex(), eventBytes); err != nil {
		log.Printf("[WARN] Failed to emit reaction to Kafka (continuing without Kafka): %v", err)
		// Don't return error - continue without Kafka
	}

	log.Printf("[Kafka] Successfully published reaction event type=%s to topic %s", event.Type, roomTopic)
	return nil
}