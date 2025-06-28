package service

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	userModel "chat/module/user/model"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	"context"
	"encoding/json"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type NotificationService struct {
	mongo    *mongo.Database
	kafkaBus *kafka.Bus
}

func NewNotificationService(mongo *mongo.Database, kafkaBus *kafka.Bus) *NotificationService {
	return &NotificationService{
		mongo:    mongo,
		kafkaBus: kafkaBus,
	}
}

// NotifyUsersInRoom sends notifications to all users in a room (except sender)
func (ns *NotificationService) NotifyUsersInRoom(ctx context.Context, message *model.ChatMessage, onlineUsers []string) {
	log.Printf("[NotificationService] Starting notification process for room %s", message.RoomID.Hex())

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

	// Send notification to each member (except sender)
	for _, memberID := range roomMembers {
		memberIDStr := memberID.Hex()

		// Skip the sender
		if memberIDStr == message.UserID.Hex() {
			continue
		}

		// Log user status
		if onlineUserMap[memberIDStr] {
			log.Printf("[NotificationService] User %s is online, but sending notification anyway for external system", memberIDStr)
		} else {
			log.Printf("[NotificationService] User %s is offline, sending notification", memberIDStr)
		}

		// Send notification
		ns.SendMessageNotification(ctx, memberIDStr, message, messageType)
	}
}

// SendMessageNotification sends a notification for a chat message
func (ns *NotificationService) SendMessageNotification(ctx context.Context, receiverID string, message *model.ChatMessage, messageType string) {
	log.Printf("[NotificationService] Sending notification: receiver=%s, message=%s, type=%s", 
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
	payload := utils.CreateSimpleNotificationPayload(
		messageType,
		room.ID,
		room.NameTh, room.NameEn,
		sender.ID, sender.Username, sender.FirstName, sender.LastName,
		message.ID.Hex(), message.Message,
		receiverID,
	)

	// Send to Kafka
	success := ns.sendToKafka(ctx, receiverID, payload, message.RoomID.Hex(), message.UserID.Hex(), message.Message, messageType, message.ID.Hex())
	
	// Mark as sent only if successful
	if success {
		log.Printf("[NotificationService] SUCCESS: sent notification to %s", receiverID)
	}
}

// SendTestNotification sends a test notification for admin testing
func (ns *NotificationService) SendTestNotification(ctx context.Context, receiverID, messageType, messageText, roomID, adminUserID string) error {
	log.Printf("[NotificationService] Admin %s sending test notification to %s", adminUserID, receiverID)

	// Use default room if not specified
	if roomID == "" {
		roomID = "test-room-id"
	}

	// Create simple test payload
	payload := utils.CreateSimpleNotificationPayload(
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
	roomCollection := ns.mongo.Collection("rooms")
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

	userService := queries.NewBaseService[userModel.User](ns.mongo.Collection("users"))
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

	roomCollection := ns.mongo.Collection("rooms")
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

func (ns *NotificationService) sendToKafka(ctx context.Context, receiverID string, payload utils.NotificationPayload, roomID, senderID, message, eventType, messageID string) bool {
	notificationTopic := "chat-notifications"
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[NotificationService] Failed to marshal payload: %v", err)
		return false
	}

	log.Printf("[NotificationService] Sending to topic %s, payload size: %d bytes", notificationTopic, len(payloadBytes))

	if err := ns.kafkaBus.Emit(ctx, notificationTopic, receiverID, payloadBytes); err != nil {
		log.Printf("[NotificationService] FAILED to send to Kafka: %v", err)
		return false
	} else {
		log.Printf("[NotificationService] SUCCESS: sent notification to %s", receiverID)
		return true
	}
} 