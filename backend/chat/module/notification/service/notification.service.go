package service

import (
	"chat/module/chat/model"
	chatModel "chat/module/notification/model"
	userModel "chat/module/user/model"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type NotificationService struct {
	*queries.BaseService[chatModel.NotificationPayload]
	kafkaBus   *kafka.Bus
	collection *mongo.Collection
}

func NewNotificationService(db *mongo.Database, kafkaBus *kafka.Bus) *NotificationService {
	collection := db.Collection("notifications")
	
	return &NotificationService{
		BaseService: queries.NewBaseService[chatModel.NotificationPayload](collection),
		kafkaBus:    kafkaBus,
		collection:  collection,
	}
}

// NotifyUsersInRoom sends notifications to offline users in a room only (not online users)
func (ns *NotificationService) NotifyUsersInRoom(ctx context.Context, message *model.ChatMessage, onlineUsers []string) {
	log.Printf("[NotificationService] Starting offline notification process for room %s", message.RoomID.Hex())

	// Create online user lookup map
	onlineUserMap := make(map[string]bool)
	for _, userID := range onlineUsers {
		onlineUserMap[userID] = true
	}

	// Get room members
	roomMembers, err := ns.getRoomMembers(ctx, message.RoomID)
	if err != nil {
		log.Printf("[NotificationService] Failed to get room members: %v", err)
		return
	}

	// Determine message type
	messageType := ns.determineMessageType(message)
	
	offlineCount := 0
	totalMembers := 0

	// Send notification to OFFLINE members only (except sender)
	for _, memberID := range roomMembers {
		memberIDStr := memberID.Hex()

		// Skip the sender
		if memberIDStr == message.UserID.Hex() {
			continue
		}
		
		totalMembers++

		// ✅ ส่ง notification เฉพาะ OFFLINE users เท่านั้น
		if !onlineUserMap[memberIDStr] {
			log.Printf("[NotificationService] User %s is OFFLINE, sending notification", memberIDStr)
			ns.SendOfflineNotification(ctx, memberIDStr, message, messageType)
			offlineCount++
		} else {
			log.Printf("[NotificationService] User %s is ONLINE, skipping notification (will receive via WebSocket)", memberIDStr)
		}
	}
	
	log.Printf("[NotificationService] Notification summary: %d offline users notified out of %d total members", offlineCount, totalMembers)
}

// SendOfflineNotification sends notification specifically for offline users
func (ns *NotificationService) SendOfflineNotification(ctx context.Context, receiverID string, message *model.ChatMessage, messageType string) {
	log.Printf("[NotificationService] Sending OFFLINE notification: receiver=%s, message=%s, type=%s", 
		receiverID, message.ID.Hex(), messageType)

	// Get sender info
	sender, err := ns.getUserById(ctx, message.UserID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get sender info for offline notification: %v", err)
		return
	}

	// Get room info
	room, err := ns.getRoomById(ctx, message.RoomID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get room info for offline notification: %v", err)
		return
	}

	// Create notification payload specifically for offline users
	payload := chatModel.CreateSimpleNotificationPayload(
		messageType,
		room.ID,
		room.NameTh, room.NameEn,
		sender.ID, sender.Username, sender.FirstName, sender.LastName,
		message.ID.Hex(), message.Message,
		receiverID,
	)

	// ✅ Send to dedicated offline notification topic
	success := ns.sendOfflineToKafka(ctx, receiverID, payload, message.RoomID.Hex(), message.UserID.Hex(), message.Message, messageType, message.ID.Hex())
	
	if success {
		log.Printf("[NotificationService] SUCCESS: sent offline notification to %s", receiverID)
	}
}

// SendMessageNotification sends a notification for a chat message (generic method)
func (ns *NotificationService) SendMessageNotification(ctx context.Context, receiverID string, message *model.ChatMessage, messageType string) {
	log.Printf("[NotificationService] Sending generic notification: receiver=%s, message=%s, type=%s", 
		receiverID, message.ID.Hex(), messageType)

	// Get sender info
	sender, err := ns.getUserById(ctx, message.UserID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get sender info: %v", err)
		return
	}

	// Get room info
	room, err := ns.getRoomById(ctx, message.RoomID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get room info: %v", err)
		return
	}

	// Create simplified payload using helper
	payload := chatModel.CreateSimpleNotificationPayload(
		messageType,
		room.ID,
		room.NameTh, room.NameEn,
		sender.ID, sender.Username, sender.FirstName, sender.LastName,
		message.ID.Hex(), message.Message,
		receiverID,
	)

	// Send to generic notification topic
	success := ns.sendToKafka(ctx, receiverID, payload, message.RoomID.Hex(), message.UserID.Hex(), message.Message, messageType, message.ID.Hex())
	
	// Mark as sent only if successful
	if success {
		log.Printf("[NotificationService] SUCCESS: sent notification to %s", receiverID)
	}
}

// SendOfflineMentionNotification sends mention notification to offline user
func (ns *NotificationService) SendOfflineMentionNotification(ctx context.Context, receiverID string, message *model.ChatMessage, senderInfo *SimpleUser, roomInfo *SimpleRoom) {
	log.Printf("[NotificationService] Sending OFFLINE mention notification to %s from %s", receiverID, senderInfo.Username)

	// Create enhanced mention payload
	payload := chatModel.CreateSimpleNotificationPayload(
		"mention",
		roomInfo.ID,
		roomInfo.NameTh, roomInfo.NameEn,
		senderInfo.ID, senderInfo.Username, senderInfo.FirstName, senderInfo.LastName,
		message.ID.Hex(), message.Message,
		receiverID,
	)

	// Send specifically to offline notification topic
	ns.sendOfflineToKafka(ctx, receiverID, payload, roomInfo.ID, senderInfo.ID, message.Message, "mention", message.ID.Hex())
}

// SendOfflineModerationNotification sends moderation notification to offline user
func (ns *NotificationService) SendOfflineModerationNotification(ctx context.Context, receiverID string, action, reason string, roomID string, moderatorInfo *SimpleUser) {
	log.Printf("[NotificationService] Sending OFFLINE moderation notification (%s) to %s by %s", action, receiverID, moderatorInfo.Username)

	// Get room info
	room, err := ns.getRoomById(ctx, roomID)
	if err != nil {
		log.Printf("[NotificationService] Failed to get room info for moderation notification: %v", err)
		return
	}

	// Create moderation message
	moderationMessage := fmt.Sprintf("You have been %s in %s. Reason: %s", action, room.NameEn, reason)

	// Create moderation payload
	payload := chatModel.CreateSimpleNotificationPayload(
		"moderation_"+action,
		room.ID,
		room.NameTh, room.NameEn,
		moderatorInfo.ID, moderatorInfo.Username, moderatorInfo.FirstName, moderatorInfo.LastName,
		"moderation-"+time.Now().Format("20060102150405"), moderationMessage,
		receiverID,
	)

	// Send to offline notification topic
	ns.sendOfflineToKafka(ctx, receiverID, payload, roomID, moderatorInfo.ID, moderationMessage, "moderation_"+action, "moderation-notification")
}

// NotifyOfflineUsersOnly sends notifications ONLY to users who are currently offline
func (ns *NotificationService) NotifyOfflineUsersOnly(ctx context.Context, message *model.ChatMessage, onlineUsers []string, roomMembers []primitive.ObjectID) {
	log.Printf("[NotificationService] Notifying OFFLINE users only for message %s", message.ID.Hex())

	// Create online user lookup map
	onlineUserMap := make(map[string]bool)
	for _, userID := range onlineUsers {
		onlineUserMap[userID] = true
	}

	// Determine message type
	messageType := ns.determineMessageType(message)
	
	offlineCount := 0

	// Send notification to OFFLINE members only (except sender)
	for _, memberID := range roomMembers {
		memberIDStr := memberID.Hex()

		// Skip the sender
		if memberIDStr == message.UserID.Hex() {
			continue
		}

		// ✅ Send notification only to OFFLINE users
		if !onlineUserMap[memberIDStr] {
			log.Printf("[NotificationService] Notifying offline user %s", memberIDStr)
			ns.SendOfflineNotification(ctx, memberIDStr, message, messageType)
			offlineCount++
		}
	}
	
	log.Printf("[NotificationService] Notified %d offline users", offlineCount)
}

// SendTestNotification sends a test notification for admin testing
func (ns *NotificationService) SendTestNotification(ctx context.Context, receiverID, messageType, messageText, roomID, adminUserID string) error {
	log.Printf("[NotificationService] Admin %s sending test notification to %s", adminUserID, receiverID)

	// Use default room if not specified
	if roomID == "" {
		roomID = "test-room-id"
	}

	// Create simple test payload
	payload := chatModel.CreateSimpleNotificationPayload(
		messageType,
		roomID,
		"ห้องทดสอบ", "Test Room",
		adminUserID, "admin", "Admin", "User",
		"test-message-id", messageText,
		receiverID,
	)

	// Send to Kafka
	ns.sendToKafka(ctx, receiverID, payload, roomID, adminUserID, messageText, messageType, "test-message-id")
	return nil
}

// Helper methods
func (ns *NotificationService) getRoomMembers(ctx context.Context, roomID primitive.ObjectID) ([]primitive.ObjectID, error) {
	roomCollection := ns.collection.Database().Collection("rooms")
	var room struct {
		Members []primitive.ObjectID `bson:"members"`
	}

	err := roomCollection.FindOne(ctx, bson.M{"_id": roomID}).Decode(&room)
	if err != nil {
		return nil, err
	}

	return room.Members, nil
}

func (ns *NotificationService) determineMessageType(message *model.ChatMessage) string {
	if message.ReplyToID != nil {
		return "reply"
	} else if message.StickerID != nil {
		return "sticker"
	} else if len(message.MentionInfo) > 0 {
		return "mention"
	} else if message.EvoucherID != nil {
		return "evoucher"
	}
	return "text"
}

type SimpleUser struct {
	ID        string
	Username  string
	FirstName string
	LastName  string
}

type SimpleRoom struct {
	ID     string
	NameTh string
	NameEn string
}

func (ns *NotificationService) getUserById(ctx context.Context, userID string) (*SimpleUser, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	userService := queries.NewBaseService[userModel.User](ns.collection.Database().Collection("users"))
	result, err := userService.FindOne(ctx, bson.M{"_id": userObjID})
	if err != nil {
		return nil, err
	}

	if len(result.Data) == 0 {
		return nil, mongo.ErrNoDocuments
	}

	user := result.Data[0]
	return &SimpleUser{
		ID:        user.ID.Hex(),
		Username:  user.Username,
		FirstName: user.Name.First,
		LastName:  user.Name.Last,
	}, nil
}

func (ns *NotificationService) getRoomById(ctx context.Context, roomID string) (*SimpleRoom, error) {
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, err
	}

	roomCollection := ns.collection.Database().Collection("rooms")
	var room struct {
		ID   primitive.ObjectID    `bson:"_id"`
		Name map[string]string     `bson:"name"`
	}

	err = roomCollection.FindOne(ctx, bson.M{"_id": roomObjID}).Decode(&room)
	if err != nil {
		return nil, err
	}

	return &SimpleRoom{
		ID:     room.ID.Hex(),
		NameTh: room.Name["th"],
		NameEn: room.Name["en"],
	}, nil
}

// sendOfflineToKafka sends notifications specifically for offline users to dedicated topic
func (ns *NotificationService) sendOfflineToKafka(ctx context.Context, receiverID string, payload chatModel.NotificationPayload, roomID, senderID, message, eventType, messageID string) bool {
	// ✅ Dedicated topic for offline notifications (for mobile push notifications, email, etc.)
	offlineNotificationTopic := "chat-notifications"
	
	log.Printf("[NotificationService] Sending OFFLINE notification to topic %s for receiver %s", offlineNotificationTopic, receiverID)
	log.Printf("[NotificationService] Offline payload type: %s, message: %s", payload.Type, payload.Message.Message)

	// Add offline-specific metadata to payload
	enhancedPayload := payload
	enhancedPayload.Type = "offline_" + payload.Type  // แยกแยะว่าเป็น offline notification
	
	// ส่ง enhanced payload แบบ structured ไปยัง offline topic
	if err := ns.kafkaBus.Emit(ctx, offlineNotificationTopic, receiverID, enhancedPayload); err != nil {
		log.Printf("[NotificationService] FAILED to send offline notification to Kafka: %v", err)
		return false
	} else {
		log.Printf("[NotificationService] SUCCESS: sent offline notification to %s via topic %s", receiverID, offlineNotificationTopic)
		return true
	}
}

// sendToKafka sends notifications to generic topic (for online users or general notifications)
func (ns *NotificationService) sendToKafka(ctx context.Context, receiverID string, payload chatModel.NotificationPayload, roomID, senderID, message, eventType, messageID string) bool {
	notificationTopic := "chat-notifications"
	
	log.Printf("[NotificationService] Sending generic notification to topic %s for receiver %s", notificationTopic, receiverID)
	log.Printf("[NotificationService] Payload type: %s, message: %s", payload.Type, payload.Message.Message)

	// ส่ง payload แบบ structured ตรงๆ ไม่ต้อง marshal เป็น bytes
	// Kafka Bus จะจัดการ marshaling เองและได้ structured JSON
	if err := ns.kafkaBus.Emit(ctx, notificationTopic, receiverID, payload); err != nil {
		log.Printf("[NotificationService] FAILED to send to Kafka: %v", err)
		return false
	} else {
		log.Printf("[NotificationService] SUCCESS: sent generic notification to %s", receiverID)
		return true
	}
} 