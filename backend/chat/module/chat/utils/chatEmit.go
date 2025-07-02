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
	"path/filepath"

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

func (e *ChatEventEmitter) EmitMessage(ctx context.Context, msg *model.ChatMessage, metadata interface{}) error {
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

	// If metadata is a complete event, use it directly
	if metadataMap, ok := metadata.(map[string]interface{}); ok {
		if eventType, hasType := metadataMap["type"]; hasType {
			if payload, hasPayload := metadataMap["payload"]; hasPayload {
				event := model.Event{
					Type:      eventType.(string),
					Payload:   payload,
					Timestamp: msg.Timestamp,
				}
				return e.emitEventStructured(ctx, msg, event)
			}
		}
	}

	// Otherwise, determine message type from metadata or message content
	var messageType string
	var eventType string
	
	if metadataMap, ok := metadata.(map[string]interface{}); ok && metadataMap["type"] != nil {
		messageType = metadataMap["type"].(string)
		eventType = messageType
	} else if msg.StickerID != nil {
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

		// Create payload without reactions (new messages don't have reactions yet)
		manualPayload := map[string]interface{}{
			"room": map[string]interface{}{
				"_id": roomInfo.ID,
			},
			"user": map[string]interface{}{
				"_id":      userInfo.ID,
				"username": userInfo.Username,
				"name":     userInfo.Name,
			},
			"message": map[string]interface{}{
				"_id":       messageInfo.ID,
				"type":      messageInfo.Type,
				"message":   messageInfo.Message,
				"timestamp": messageInfo.Timestamp,
			},
			"sticker": map[string]interface{}{
				"_id":   stickerInfo.ID,
				"image": stickerInfo.Image,
			},
			"timestamp": msg.Timestamp,
		}

		event := model.Event{
			Type:      eventType,
			Payload:   manualPayload,
			Timestamp: msg.Timestamp,
		}
		
		return e.emitEventStructured(ctx, msg, event)
	} else if msg.Image != "" {
		// File upload message
		filePath := filepath.Join("uploads", msg.Image)
		manualPayload := map[string]interface{}{
			"room": map[string]interface{}{
				"_id": roomInfo.ID,
			},
			"user": map[string]interface{}{
				"_id":      userInfo.ID,
				"username": userInfo.Username,
				"name":     userInfo.Name,
			},
			"message": map[string]interface{}{
				"_id":       messageInfo.ID,
				"type":      "upload",
				"message":   messageInfo.Message,
				"timestamp": messageInfo.Timestamp,
			},
			"filename": msg.Image,
			"file": map[string]interface{}{
				"path": filePath,
			},
			"timestamp": msg.Timestamp,
		}

		event := model.Event{
			Type:      "upload",
			Payload:   manualPayload,
			Timestamp: msg.Timestamp,
		}
		
		return e.emitEventStructured(ctx, msg, event)
	} else {
		// Text or reply message
		// Get reply information if this is a reply
		var replyToInfo *model.MessageInfo
		if msg.ReplyToID != nil {
			if replyToMsg, err := e.getReplyToMessage(ctx, *msg.ReplyToID); err == nil {
				replyToInfo = replyToMsg
			}
		}

		// Create payload without reactions (new messages don't have reactions yet)
		manualPayload := map[string]interface{}{
			"room": map[string]interface{}{
				"_id": roomInfo.ID,
			},
			"user": map[string]interface{}{
				"_id":      userInfo.ID,
				"username": userInfo.Username,
				"name":     userInfo.Name,
			},
			"message": map[string]interface{}{
				"_id":       messageInfo.ID,
				"type":      messageInfo.Type,
				"message":   messageInfo.Message,
				"timestamp": messageInfo.Timestamp,
			},
			"timestamp": msg.Timestamp,
		}

		// Add reply info if exists
		if replyToInfo != nil {
			manualPayload["replyTo"] = map[string]interface{}{
				"message": map[string]interface{}{
					"_id":       replyToInfo.ID,
					"message":   replyToInfo.Message,
					"timestamp": replyToInfo.Timestamp,
				},
			}
		}

		event := model.Event{
			Type:      eventType,
			Payload:   manualPayload,
			Timestamp: msg.Timestamp,
		}
		
		return e.emitEventStructured(ctx, msg, event)
	}
}

func (e *ChatEventEmitter) EmitReaction(ctx context.Context, reaction *model.MessageReaction, roomID primitive.ObjectID) error {
	// Get user data for the person who reacted
	userInfo, err := e.getUserInfo(ctx, reaction.UserID)
	if err != nil {
		log.Printf("[WARN] Failed to get user info for reaction: %v", err)
		userInfo = model.UserInfo{ID: reaction.UserID.Hex()}
	}

	// Determine action (add vs remove)
	action := "add"
	if reaction.Reaction == "remove" {
		action = "remove"
	}

	// **SIMPLIFIED: Just get updated reactions for this message (lighter query)**
	reactionCollection := e.mongo.Collection("message-reactions")
	cursor, err := reactionCollection.Find(ctx, bson.M{"message_id": reaction.MessageID})
	if err != nil {
		log.Printf("[ERROR] Failed to get updated reactions: %v", err)
		return err
	}
	defer cursor.Close(ctx)

	var updatedReactions []model.MessageReaction
	if err = cursor.All(ctx, &updatedReactions); err != nil {
		log.Printf("[ERROR] Failed to decode reactions: %v", err)
		return err
	}

	// **NEW: Create lightweight reaction update event (no full message)**
	reactionUpdateEvent := map[string]interface{}{
		"type": "message_reaction_update",
		"payload": map[string]interface{}{
			"messageId": reaction.MessageID.Hex(),
			"reactionUpdate": map[string]interface{}{
				"action":    action,
				"reaction":  reaction.Reaction,
				"user": map[string]interface{}{
					"_id":      userInfo.ID,
					"username": userInfo.Username,
					"name":     userInfo.Name,
				},
			},
			"reactions": updatedReactions, // All current reactions for this message
			"room": map[string]interface{}{
				"_id": roomID.Hex(),
			},
			"timestamp": reaction.Timestamp,
		},
		"timestamp": reaction.Timestamp,
	}

	eventBytes, err := json.Marshal(reactionUpdateEvent)
	if err != nil {
		return fmt.Errorf("failed to marshal reaction update event: %w", err)
	}

	// Broadcast to WebSocket clients
	e.hub.BroadcastToRoom(roomID.Hex(), eventBytes)

	// Emit to Kafka
	roomTopic := getRoomTopic(roomID.Hex())
	if err := e.bus.Emit(ctx, roomTopic, roomID.Hex(), eventBytes); err != nil {
		log.Printf("[WARN] Failed to emit reaction update to Kafka (continuing without Kafka): %v", err)
	}

	log.Printf("[Kafka] Successfully published lightweight reaction update to topic %s", roomTopic)
	return nil
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
	log.Printf("[DEBUG] Getting user info for ID: %s", userID.Hex())
	
	// **USE SIMPLE QUERY WITHOUT POPULATE TO AVOID ROLE DECODING ISSUES**
	userService := queries.NewBaseService[userModel.User](e.mongo.Collection("users"))
	result, err := userService.FindOne(ctx, bson.M{"_id": userID})
	
	if err != nil {
		log.Printf("[ERROR] Failed to query user %s: %v", userID.Hex(), err)
		return model.UserInfo{}, fmt.Errorf("failed to query user %s: %w", userID.Hex(), err)
	}
	
	if len(result.Data) == 0 {
		log.Printf("[ERROR] User %s not found in database", userID.Hex())
		return model.UserInfo{}, fmt.Errorf("user %s not found in database", userID.Hex())
	}

	user := result.Data[0]
	
	// **LOG RAW DATA FOR DEBUGGING**
	log.Printf("[DEBUG] Raw user data: ID=%s, Username='%s', Name.First='%s', Name.Middle='%s', Name.Last='%s'", 
		user.ID.Hex(), user.Username, user.Name.First, user.Name.Middle, user.Name.Last)

	// **BUILD USER INFO WITH VALIDATION**
	if user.Username == "" {
		log.Printf("[ERROR] User %s has empty username", userID.Hex())
		return model.UserInfo{}, fmt.Errorf("user %s has empty username", userID.Hex())
	}
	
	if user.Name.First == "" && user.Name.Last == "" {
		log.Printf("[ERROR] User %s has empty name", userID.Hex())
		return model.UserInfo{}, fmt.Errorf("user %s has empty name", userID.Hex())
	}

	userInfo := model.UserInfo{
		ID:       user.ID.Hex(),
		Username: user.Username,
		Name:     map[string]interface{}{
			"first":  user.Name.First,
			"middle": user.Name.Middle,
			"last":   user.Name.Last,
		},
	}

	// **GET ROLE SEPARATELY TO AVOID POPULATION ISSUES**
	if user.Role != primitive.NilObjectID {
		log.Printf("[DEBUG] Getting role for user %s, role ID: %s", userID.Hex(), user.Role.Hex())
		roleService := queries.NewBaseService[interface{}](e.mongo.Collection("roles"))
		roleResult, err := roleService.FindOne(ctx, bson.M{"_id": user.Role})
		if err == nil && len(roleResult.Data) > 0 {
			if roleData, ok := roleResult.Data[0].(map[string]interface{}); ok {
				if roleID, exists := roleData["_id"]; exists {
					if roleName, exists := roleData["name"]; exists {
						userInfo.Role = &model.RoleInfo{
							ID:   roleID.(primitive.ObjectID).Hex(),
							Name: roleName.(string),
						}
						log.Printf("[DEBUG] Successfully added role: %s", roleName.(string))
					}
				}
			}
		} else {
			log.Printf("[WARNING] Failed to get role %s: %v", user.Role.Hex(), err)
		}
	}

	log.Printf("[SUCCESS] Built userInfo: ID=%s, Username=%s, Name=%+v", userInfo.ID, userInfo.Username, userInfo.Name)
	return userInfo, nil
}

func (e *ChatEventEmitter) getReplyToMessage(ctx context.Context, replyToID primitive.ObjectID) (*model.MessageInfo, error) {
	// Get the original message being replied to
	replyToService := queries.NewBaseService[model.ChatMessage](e.mongo.Collection("chat-messages"))
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
	// For WebSocket broadcasting, marshal to bytes (needed for WebSocket protocol)
	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal structured event: %w", err)
	}

	// Broadcast directly to room instead of using BroadcastEvent
	e.hub.BroadcastToRoom(msg.RoomID.Hex(), eventBytes)

	// For Kafka, send structured payload directly (no double marshaling)
	roomTopic := getRoomTopic(msg.RoomID.Hex())
	if err := e.bus.Emit(ctx, roomTopic, msg.RoomID.Hex(), event); err != nil {
		log.Printf("[WARN] Failed to emit to Kafka (continuing without Kafka): %v", err)
		// Don't return error - continue without Kafka
	}

	log.Printf("[Kafka] Successfully published structured event type=%s to topic %s", event.Type, roomTopic)
	return nil
}

// EmitMentionMessage emits a message event with mention information
func (e *ChatEventEmitter) EmitMentionMessage(ctx context.Context, msg *model.ChatMessage, mentionInfo []model.MentionInfo) error {
	log.Printf("[TRACE] EmitMentionMessage called for message ID=%s Room=%s with %d mentions", 
		msg.ID.Hex(), msg.RoomID.Hex(), len(mentionInfo))

	// Get user data
	userInfo, err := e.getUserInfo(ctx, msg.UserID)
	if err != nil {
		log.Printf("[WARN] Failed to get user info for mention message: %v", err)
		userInfo = model.UserInfo{ID: msg.UserID.Hex()}
	}

	// Get room data (basic for now)
	roomInfo := model.RoomInfo{ID: msg.RoomID.Hex()}

	// Create message info
	messageInfo := model.MessageInfo{
		ID:        msg.ID.Hex(),
		Type:      model.MessageTypeMention,
		Message:   msg.Message,
		Timestamp: msg.Timestamp,
	}

	// Create payload with mention information
	manualPayload := map[string]interface{}{
		"room": map[string]interface{}{
			"_id": roomInfo.ID,
		},
		"user": map[string]interface{}{
			"_id":      userInfo.ID,
			"username": userInfo.Username,
			"name":     userInfo.Name,
		},
		"message": map[string]interface{}{
			"_id":       messageInfo.ID,
			"type":      messageInfo.Type,
			"message":   messageInfo.Message,
			"timestamp": messageInfo.Timestamp,
		},
		"mentions": mentionInfo,
		"timestamp": msg.Timestamp,
	}

	event := model.Event{
		Type:      model.EventTypeMention,
		Payload:   manualPayload,
		Timestamp: msg.Timestamp,
	}
	
	return e.emitEventStructured(ctx, msg, event)
}

// EmitMentionNotice sends a personal mention notification to a specific user
func (e *ChatEventEmitter) EmitMentionNotice(ctx context.Context, msg *model.ChatMessage, sender *userModel.User, mentionedUser *userModel.User) error {
	log.Printf("[TRACE] EmitMentionNotice called for user %s from message %s", 
		mentionedUser.ID.Hex(), msg.ID.Hex())

	// Create sender info
	senderInfo := model.UserInfo{
		ID:       sender.ID.Hex(),
		Username: sender.Username,
		Name: map[string]interface{}{
			"first":  sender.Name.First,
			"middle": sender.Name.Middle,
			"last":   sender.Name.Last,
		},
	}

	// Create mentioned user info
	mentionedUserInfo := model.UserInfo{
		ID:       mentionedUser.ID.Hex(),
		Username: mentionedUser.Username,
		Name: map[string]interface{}{
			"first":  mentionedUser.Name.First,
			"middle": mentionedUser.Name.Middle,
			"last":   mentionedUser.Name.Last,
		},
	}

	// Create room info
	roomInfo := model.RoomInfo{ID: msg.RoomID.Hex()}

	// Create message info
	messageInfo := model.MessageInfo{
		ID:        msg.ID.Hex(),
		Type:      model.MessageTypeMention,
		Message:   msg.Message,
		Timestamp: msg.Timestamp,
	}

	// Create structured mention notice event
	noticeEvent := model.Event{
		Type: model.EventTypeMentionNotice,
		Payload: map[string]interface{}{
			"room":           roomInfo,
			"message":        messageInfo,
			"mentionedBy":    senderInfo,
			"mentionedUser":  mentionedUserInfo,
			"timestamp":      msg.Timestamp,
		},
		Timestamp: msg.Timestamp,
	}

	// For WebSocket, marshal to bytes (needed for WebSocket protocol)
	eventBytes, err := json.Marshal(noticeEvent)
	if err != nil {
		return fmt.Errorf("failed to marshal mention notice: %w", err)
	}
	// Also broadcast to room so other clients can see who was mentioned (WebSocket needs bytes)
	e.hub.BroadcastToRoom(msg.RoomID.Hex(), eventBytes)

	log.Printf("[Kafka] Successfully published mention notice to user %s", mentionedUser.ID.Hex())
	return nil
}

// EmitEvoucherMessage emits an evoucher message event
func (e *ChatEventEmitter) EmitEvoucherMessage(ctx context.Context, msg *model.ChatMessage) error {
	log.Printf("[TRACE] EmitEvoucherMessage called for message ID=%s Room=%s", 
		msg.ID.Hex(), msg.RoomID.Hex())

	// Get user data
	userInfo, err := e.getUserInfo(ctx, msg.UserID)
	if err != nil {
		log.Printf("[WARN] Failed to get user info for evoucher message: %v", err)
		userInfo = model.UserInfo{ID: msg.UserID.Hex()}
	}

	// Get room data (basic for now)
	roomInfo := model.RoomInfo{ID: msg.RoomID.Hex()}

	// Create message info
	messageInfo := model.MessageInfo{
		ID:        msg.ID.Hex(),
		Type:      model.MessageTypeEvoucher,
		Message:   msg.Message,
		Timestamp: msg.Timestamp,
	}

	// Create manual payload structure to match expected format
	manualPayload := map[string]interface{}{
		"room": map[string]interface{}{
			"_id": roomInfo.ID,
		},
		"user": map[string]interface{}{
			"_id":      userInfo.ID,
			"username": userInfo.Username,
			"name":     userInfo.Name,
		},
		"message": map[string]interface{}{
			"_id":       messageInfo.ID,
			"type":      messageInfo.Type,
			"message":   messageInfo.Message,
			"timestamp": messageInfo.Timestamp,
		},
		"evoucherInfo": map[string]interface{}{
			"title":       msg.EvoucherInfo.Title,
			"description": msg.EvoucherInfo.Description,
			"claimUrl":    msg.EvoucherInfo.ClaimURL,
		},
		"timestamp": msg.Timestamp,
	}

	// Create event
	event := model.Event{
		Type:      model.EventTypeEvoucher,
		Payload:   manualPayload,
		Timestamp: msg.Timestamp,
	}

	// Emit event using common emitter
	return e.emitEventStructured(ctx, msg, event)
}

// EmitEvent emits a custom event
func (e *ChatEventEmitter) EmitEvent(ctx context.Context, msg *model.ChatMessage, event interface{}) error {
	// Convert event to JSON
	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Broadcast to room
	e.hub.BroadcastToRoom(msg.RoomID.Hex(), eventBytes)

	// Publish to Kafka
	roomTopic := getRoomTopic(msg.RoomID.Hex())
	if err := e.bus.Emit(ctx, roomTopic, msg.RoomID.Hex(), event); err != nil {
		log.Printf("[WARN] Failed to emit to Kafka (continuing without Kafka): %v", err)
		// Don't return error - continue without Kafka
	}

	log.Printf("[Kafka] Successfully published event to topic %s", roomTopic)
	return nil
}