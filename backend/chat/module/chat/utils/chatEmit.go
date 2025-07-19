package utils

import (
	"chat/module/chat/model"
	restrictionModel "chat/module/restriction/model"
	userModel "chat/module/user/model"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

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
		// Ensure fallback userInfo is always complete
		userInfo = model.UserInfo{
			ID:       msg.UserID.Hex(),
			Username: "user_" + msg.UserID.Hex()[:8],
			Name: map[string]interface{}{
				"first":  "User",
				"middle": "",
				"last":   msg.UserID.Hex()[:8],
			},
		}
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

		// Build user map (with role if present)
		userMap := map[string]interface{}{
			"_id":      userInfo.ID,
			"username": userInfo.Username,
			"name":     userInfo.Name,
		}
		if userInfo.Role != nil {
			userMap["role"] = map[string]interface{}{
				"_id": userInfo.Role.ID,
			}
		}

		// Create payload
		manualPayload := map[string]interface{}{
			"room": map[string]interface{}{
				"_id": roomInfo.ID,
			},
			"user": userMap,
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
			"filename":  msg.Image,
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
		var replyMsg *model.ChatMessage
		if msg.ReplyToID != nil {
			if replyToMsg, err := e.getReplyToMessage(ctx, *msg.ReplyToID); err == nil {
				replyToInfo = replyToMsg
			}
			// Get the full reply message for user data
			replyToService := queries.NewBaseService[model.ChatMessage](e.mongo.Collection("chat-messages"))
			replyResult, err := replyToService.FindOne(ctx, bson.M{"_id": *msg.ReplyToID})
			if err == nil && len(replyResult.Data) > 0 {
				replyMsg = &replyResult.Data[0]
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
		if replyToInfo != nil && replyMsg != nil {
			// Get user data for the reply message
			var replyUserData map[string]interface{}
			if replyUser, err := e.getUserInfo(ctx, replyMsg.UserID); err == nil {
				replyUserData = map[string]interface{}{
					"_id":      replyUser.ID,
					"username": replyUser.Username,
					"name":     replyUser.Name,
				}
			} else {
				replyUserData = map[string]interface{}{
					"_id": replyMsg.UserID.Hex(),
				}
			}

			manualPayload["replyTo"] = map[string]interface{}{
				"message": map[string]interface{}{
					"_id":       replyToInfo.ID,
					"message":   replyToInfo.Message,
					"timestamp": replyToInfo.Timestamp,
				},
				"user": replyUserData,
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

func (e *ChatEventEmitter) EmitTyping(ctx context.Context, roomID, userID string) error {
	event := ChatEvent{
		Type: "typing",
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
		Type: "user_joined",
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
		log.Printf("[WARN] Failed to query user %s: %v, using fallback", userID.Hex(), err)
		// **FIXED: Never return error, always return valid user info**
		return model.UserInfo{
			ID:       userID.Hex(),
			Username: "user_" + userID.Hex()[:8],
			Name: map[string]interface{}{
				"first":  "User",
				"middle": "",
				"last":   userID.Hex()[:8],
			},
		}, nil
	}

	if len(result.Data) == 0 {
		log.Printf("[WARN] User %s not found in database, using fallback", userID.Hex())
		// **FIXED: Never return error, always return valid user info**
		return model.UserInfo{
			ID:       userID.Hex(),
			Username: "user_" + userID.Hex()[:8],
			Name: map[string]interface{}{
				"first":  "User",
				"middle": "",
				"last":   userID.Hex()[:8],
			},
		}, nil
	}

	user := result.Data[0]

	// **LOG RAW DATA FOR DEBUGGING**
	log.Printf("[DEBUG] Raw user data: ID=%s, Username='%s', Name.First='%s', Name.Middle='%s', Name.Last='%s'",
		user.ID.Hex(), user.Username, user.Name.First, user.Name.Middle, user.Name.Last)

	// **BUILD USER INFO WITH VALIDATION**
	// **FIXED: Make validation less strict to handle missing fields gracefully**
	if user.Username == "" {
		log.Printf("[WARN] User %s has empty username, using fallback", userID.Hex())
		user.Username = "user_" + userID.Hex()[:8] // Use first 8 chars of ID as fallback
	}

	if user.Name.First == "" && user.Name.Last == "" {
		log.Printf("[WARN] User %s has empty name, using fallback", userID.Hex())
		user.Name.First = "User"
		user.Name.Last = userID.Hex()[:8] // Use first 8 chars of ID as fallback
	}

	userInfo := model.UserInfo{
		ID:       user.ID.Hex(),
		Username: user.Username,
		Name: map[string]interface{}{
			"first": user.Name.First,
			"middle": func() string {
				if user.Name.Middle == "" {
					return ""
				}
				return user.Name.Middle
			}(),
			"last": user.Name.Last,
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
	if msg == nil || msg.RoomID.IsZero() || msg.ID.IsZero() {
		return fmt.Errorf("invalid message data: RoomID=%s, MessageID=%s",
			msg.RoomID.Hex(), msg.ID.Hex())
	}
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
		// **FIXED: Ensure user field exists even if retrieval fails**
		userInfo = model.UserInfo{
			ID:       msg.UserID.Hex(),
			Username: "",
			Name:     map[string]interface{}{},
		}
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
		"mentions":  mentionInfo,
		"timestamp": msg.Timestamp,
	}

	event := model.Event{
		Type:      model.EventTypeMention,
		Payload:   manualPayload,
		Timestamp: msg.Timestamp,
	}

	return e.emitEventStructured(ctx, msg, event)
}

// EmitEvoucherMessage emits an evoucher message event
func (e *ChatEventEmitter) EmitEvoucherMessage(ctx context.Context, msg *model.ChatMessage) error {
	log.Printf("[TRACE] EmitEvoucherMessage called for message ID=%s Room=%s",
		msg.ID.Hex(), msg.RoomID.Hex())

	// Get user data
	userInfo, err := e.getUserInfo(ctx, msg.UserID)
	if err != nil {
		log.Printf("[WARN] Failed to get user info for evoucher message: %v", err)
		// **FIXED: Ensure user field exists even if retrieval fails**
		userInfo = model.UserInfo{
			ID:       msg.UserID.Hex(),
			Username: "",
			Name:     map[string]interface{}{},
		}
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
			"message":      msg.EvoucherInfo.Message,
			"claimUrl":     msg.EvoucherInfo.ClaimURL,
			"sponsorImage": msg.EvoucherInfo.SponsorImage,
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

// EmitEvoucherClaimed emits an evoucher claimed event
func (e *ChatEventEmitter) EmitEvoucherClaimed(ctx context.Context, msg *model.ChatMessage, claimedByUserID primitive.ObjectID) error {
	log.Printf("[ChatEventEmitter] Emitting evoucher claimed event for message %s by user %s",
		msg.ID.Hex(), claimedByUserID.Hex())

	// Get user info for the person who claimed
	claimerInfo, err := e.getUserInfo(ctx, claimedByUserID)
	if err != nil {
		log.Printf("[ChatEventEmitter] Failed to get claimer info: %v", err)
		return err
	}

	// Get sender info
	senderInfo, err := e.getUserInfo(ctx, msg.UserID)
	if err != nil {
		log.Printf("[ChatEventEmitter] Failed to get sender info: %v", err)
		return err
	}

	// Create payload for evoucher claimed event
	payload := map[string]interface{}{
		"room": map[string]interface{}{
			"_id": msg.RoomID.Hex(),
		},
		"user":    senderInfo,  // Original sender
		"claimer": claimerInfo, // User who claimed
		"message": map[string]interface{}{
			"_id":       msg.ID.Hex(),
			"type":      model.MessageTypeEvoucher,
			"message":   msg.Message,
			"timestamp": msg.Timestamp,
		},
		"evoucherInfo": map[string]interface{}{
			"message":      msg.EvoucherInfo.Message,
			"claimUrl":     msg.EvoucherInfo.ClaimURL,
			"sponsorImage": msg.EvoucherInfo.SponsorImage,
			"claimedBy":    msg.EvoucherInfo.ClaimedBy,
		},
		"timestamp": time.Now(),
	}

	// Create event
	event := model.Event{
		Type:      "evoucher_claimed",
		Payload:   payload,
		Timestamp: time.Now(),
	}

	// Emit to WebSocket
	eventData, err := json.Marshal(event)
	if err != nil {
		log.Printf("[ChatEventEmitter] Failed to marshal evoucher claimed event: %v", err)
		return err
	}

	e.hub.BroadcastToRoom(msg.RoomID.Hex(), eventData)
	log.Printf("[ChatEventEmitter] Broadcasted evoucher claimed event to room %s", msg.RoomID.Hex())

	// Emit to Kafka
	roomTopic := "chat-room-" + msg.RoomID.Hex()
	if err := e.bus.Emit(ctx, roomTopic, msg.RoomID.Hex(), event); err != nil {
		log.Printf("[ChatEventEmitter] Failed to emit evoucher claimed to Kafka: %v", err)
		return err
	}

	log.Printf("[ChatEventEmitter] Successfully emitted evoucher claimed event for message %s", msg.ID.Hex())
	return nil
}

func (e *ChatEventEmitter) EmitRestrictionMessage(ctx context.Context, msg *model.ChatMessage, sender *userModel.User, restriction *restrictionModel.UserRestriction) error {
	log.Printf("[TRACE] EmitRestrictionMessage called for message ID=%s Room=%s",
		restriction.ID.Hex(), restriction.RoomID.Hex())

	//Create sender info
	senderInfo := model.UserInfo{
		ID:       sender.ID.Hex(),
		Username: sender.Username,
		Name: map[string]interface{}{
			"first":  sender.Name.First,
			"middle": sender.Name.Middle,
			"last":   sender.Name.Last,
		},
	}

	//Create restriction info
	restrictionInfo := model.RestrictionInfo{
		ID:          restriction.ID.Hex(),
		RoomID:      restriction.RoomID.Hex(),
		UserID:      restriction.UserID.Hex(),
		Restriction: restriction.Restriction,
	}

	//Create message info (use msg.ID, msg.Timestamp, msg.Message)
	messageInfo := model.MessageInfo{
		ID:        msg.ID.Hex(),
		Type:      model.MessageTypeRestriction,
		Message:   msg.Message,
		Timestamp: msg.Timestamp,
	}

	// Create Structured Restriction notice event
	restrictionEvent := model.Event{
		Type: model.EventTypeRestriction,
		Payload: map[string]interface{}{
			"room": map[string]interface{}{
				"_id": restrictionInfo.RoomID,
			},
			"user": map[string]interface{}{
				"_id":      senderInfo.ID,
				"username": senderInfo.Username,
				"name":     senderInfo.Name,
			},
			"restriction": restrictionInfo,
			"message":     messageInfo,
		},
		Timestamp: msg.Timestamp,
	}

	// For WebSocket, marshal to bytes (needed for WebSocket protocol)
	eventBytes, err := json.Marshal(restrictionEvent)
	if err != nil {
		return fmt.Errorf("failed to marshal restriction event: %w", err)
	}

	// Broadcast to room (WebSocket)
	e.hub.BroadcastToRoom(restriction.RoomID.Hex(), eventBytes)

	// Publish to Kafka topic chat-room-<roomId>
	roomTopic := getRoomTopic(restriction.RoomID.Hex())
	if err := e.bus.Emit(ctx, roomTopic, restriction.RoomID.Hex(), restrictionEvent); err != nil {
		log.Printf("[WARN] Failed to emit restriction event to Kafka (continuing without Kafka): %v", err)
		// Don't return error - continue without Kafka
	}

	log.Printf("[Kafka] Successfully published restriction notice to topic %s", roomTopic)
	return nil
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

// GetHub returns the chat hub (for use in restriction/event helpers)
func (e *ChatEventEmitter) GetHub() *Hub {
	return e.hub
}
