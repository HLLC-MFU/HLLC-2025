package utils

import (
	"chat/module/chat/model"
	"chat/pkg/database/queries"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// MessageBuilder handles message building and payload creation
type MessageBuilder struct {
	mongo *mongo.Database
}

// NewMessageBuilder creates a new MessageBuilder
func NewMessageBuilder(mongo *mongo.Database) *MessageBuilder {
	return &MessageBuilder{
		mongo: mongo,
	}
}

// ExtractPreStructuredEvent checks if metadata contains a complete event structure
func (mb *MessageBuilder) ExtractPreStructuredEvent(metadata interface{}, timestamp time.Time) *model.Event {
	metadataMap, ok := metadata.(map[string]interface{})
	if !ok {
		return nil
	}

	eventType, hasType := metadataMap["type"]
	payload, hasPayload := metadataMap["payload"]

	if !hasType || !hasPayload {
		return nil
	}

	return &model.Event{
		Type:      eventType.(string),
		Payload:   payload,
		Timestamp: timestamp,
	}
}

// DetermineMessageTypes determines the appropriate message and event types
func (mb *MessageBuilder) DetermineMessageTypes(msg *model.ChatMessage, metadata interface{}) (string, string) {
	// Check metadata first
	if metadataMap, ok := metadata.(map[string]interface{}); ok && metadataMap["type"] != nil {
		messageType := metadataMap["type"].(string)
		return messageType, messageType
	}

	// Determine from message content
	if msg.StickerID != nil {
		return model.MessageTypeSticker, model.EventTypeSticker
	}

	if msg.ReplyToID != nil {
		return model.MessageTypeReply, model.EventTypeReply
	}

	if msg.Image != "" {
		return "upload", "upload"
	}

	return model.MessageTypeText, model.EventTypeMessage
}

// BuildMessagePayload creates the appropriate payload based on message type
func (mb *MessageBuilder) BuildMessagePayload(msg *model.ChatMessage, userInfo model.UserInfo, roomInfo model.RoomInfo, messageInfo model.MessageInfo, eventType string) map[string]interface{} {
	basePayload := mb.CreateBasePayload(roomInfo, userInfo, messageInfo, msg.Timestamp)

	switch eventType {
	case model.EventTypeSticker:
		return mb.BuildStickerPayload(basePayload, msg)
	case "upload":
		return mb.BuildUploadPayload(basePayload, msg)
	case model.EventTypeReply:
		return mb.BuildReplyPayload(basePayload, msg)
	default:
		return basePayload
	}
}

// createBasePayload creates the common payload structure
func (mb *MessageBuilder) CreateBasePayload(roomInfo model.RoomInfo, userInfo model.UserInfo, messageInfo model.MessageInfo, timestamp time.Time) map[string]interface{} {
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

	return map[string]interface{}{
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
		"timestamp": timestamp,
	}
}

// buildStickerPayload adds sticker-specific data to the payload
func (mb *MessageBuilder) BuildStickerPayload(basePayload map[string]interface{}, msg *model.ChatMessage) map[string]interface{} {
	stickerInfo := model.StickerInfo{
		ID:    msg.StickerID.Hex(),
		Image: msg.Image,
	}

	basePayload["sticker"] = map[string]interface{}{
		"_id":   stickerInfo.ID,
		"image": stickerInfo.Image,
	}

	return basePayload
}

// buildUploadPayload adds upload-specific data to the payload
func (mb *MessageBuilder) BuildUploadPayload(basePayload map[string]interface{}, msg *model.ChatMessage) map[string]interface{} {
	basePayload["filename"] = msg.Image
	return basePayload
}

// buildReplyPayload adds reply-specific data to the payload
func (mb *MessageBuilder) BuildReplyPayload(basePayload map[string]interface{}, msg *model.ChatMessage) map[string]interface{} {
	if msg.ReplyToID == nil {
		return basePayload
	}

	// Get reply information
	replyToInfo, err := mb.GetReplyToMessage(context.Background(), *msg.ReplyToID)
	if err != nil {
		log.Printf("[WARN] Failed to get reply message: %v", err)
		return basePayload
	}

	// Get the full reply message for user data
	replyToService := queries.NewBaseService[model.ChatMessage](mb.mongo.Collection("chat-messages"))
	replyResult, err := replyToService.FindOne(context.Background(), bson.M{"_id": *msg.ReplyToID})
	if err != nil || len(replyResult.Data) == 0 {
		log.Printf("[WARN] Failed to get reply message data: %v", err)
		return basePayload
	}

	replyMsg := replyResult.Data[0]

	// Get user data for the reply message
	replyUserData := mb.GetReplyUserData(context.Background(), replyMsg.UserID)

	basePayload["replyTo"] = map[string]interface{}{
		"message": map[string]interface{}{
			"_id":       replyToInfo.ID,
			"message":   replyToInfo.Message,
			"timestamp": replyToInfo.Timestamp,
		},
		"user": replyUserData,
	}

	return basePayload
}

// getReplyUserData gets user data for reply messages
func (mb *MessageBuilder) GetReplyUserData(ctx context.Context, userID primitive.ObjectID) map[string]interface{} {
	userInfoService := NewUserInfoService(mb.mongo)
	if replyUser, err := userInfoService.GetUserInfo(ctx, userID); err == nil {
		return map[string]interface{}{
			"_id":      replyUser.ID,
			"username": replyUser.Username,
			"name":     replyUser.Name,
		}
	}

	return map[string]interface{}{
		"_id": userID.Hex(),
	}
}

// getReplyToMessage retrieves the message being replied to
func (mb *MessageBuilder) GetReplyToMessage(ctx context.Context, replyToID primitive.ObjectID) (*model.MessageInfo, error) {
	// Get the original message being replied to
	replyToService := queries.NewBaseService[model.ChatMessage](mb.mongo.Collection("chat-messages"))
	replyResult, err := replyToService.FindOne(ctx, bson.M{"_id": replyToID})

	if err != nil || len(replyResult.Data) == 0 {
		return nil, fmt.Errorf("reply message not found: %w", err)
	}

	replyMsg := replyResult.Data[0]

	// Determine message type
	messageType := mb.determineReplyMessageType(replyMsg)

	return &model.MessageInfo{
		ID:        replyMsg.ID.Hex(),
		Type:      messageType,
		Message:   replyMsg.Message,
		Timestamp: replyMsg.Timestamp,
	}, nil
}

// determineReplyMessageType determines the type of reply message
func (mb *MessageBuilder) determineReplyMessageType(replyMsg model.ChatMessage) string {
	if replyMsg.StickerID != nil {
		return model.MessageTypeSticker
	}
	return model.MessageTypeText
}

// BuildMentionPayload creates the mention message event payload
func (mb *MessageBuilder) BuildMentionPayload(roomInfo model.RoomInfo, userInfo model.UserInfo, messageInfo model.MessageInfo, mentionInfo []model.MentionInfo, timestamp time.Time) map[string]interface{} {
	return map[string]interface{}{
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
		"timestamp": timestamp,
	}
}

// BuildEvoucherPayload creates the evoucher message event payload
func (mb *MessageBuilder) BuildEvoucherPayload(roomInfo model.RoomInfo, userInfo model.UserInfo, messageInfo model.MessageInfo, msg *model.ChatMessage) map[string]interface{} {
	return map[string]interface{}{
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
}

// BuildEvoucherClaimedPayload creates the evoucher claimed event payload
func (mb *MessageBuilder) BuildEvoucherClaimedPayload(msg *model.ChatMessage, senderInfo, claimerInfo model.UserInfo) map[string]interface{} {
	return map[string]interface{}{
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
}

// BuildRestrictionPayload creates the restriction event payload
func (mb *MessageBuilder) BuildRestrictionPayload(restrictionInfo model.RestrictionInfo, senderInfo model.UserInfo, messageInfo model.MessageInfo) map[string]interface{} {
	return map[string]interface{}{
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
	}
}
