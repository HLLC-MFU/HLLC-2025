package service

import (
	"chat/module/chat/model"
	chatModel "chat/module/notification/model"
	restrictionModel "chat/module/restriction/model"
	userModel "chat/module/user/model"
	userService "chat/module/user/service"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	"context"
	"log"
	"path/filepath"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type NotificationService struct {
	*queries.BaseService[chatModel.NotificationPayload]
	kafkaBus   *kafka.Bus
	collection *mongo.Collection
	roleService *userService.RoleService
}

func NewNotificationService(db *mongo.Database, kafkaBus *kafka.Bus, roleService *userService.RoleService) *NotificationService {
	collection := db.Collection("notifications")
	
	return &NotificationService{
		BaseService: queries.NewBaseService[chatModel.NotificationPayload](collection),
		kafkaBus:    kafkaBus,
		collection:  collection,
		roleService: roleService,
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

	// Get sender user model for role
	var senderUser *userModel.User
	userService := queries.NewBaseService[userModel.User](ns.collection.Database().Collection("users"))
	result, err := userService.FindOne(ctx, bson.M{"_id": message.UserID})
	if err == nil && len(result.Data) > 0 {
		senderUser = &result.Data[0]
	}
	role := ns.getNotificationUserRole(ctx, senderUser)

	// Get room info
	room, err := ns.getRoomById(ctx, message.RoomID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get room info for offline notification: %v", err)
		return
	}

	// --- สร้าง payload แบบเดียวกับ broadcast (websocket) ---
	userData := map[string]interface{}{
		"_id":      sender.ID,
		"username": sender.Username,
		"name": map[string]interface{}{
			"first":  sender.FirstName,
			"middle": "",
			"last":   sender.LastName,
		},
	}
	if role != nil {
		userData["role"] = map[string]interface{}{
			"_id": role.ID,
			"name": role.Name,
		}
	}

	messageData := map[string]interface{}{
		"_id":       message.ID.Hex(),
		"type":      messageType,
		"message":   message.Message,
		"timestamp": message.Timestamp,
	}

	payload := map[string]interface{}{
		"room": map[string]interface{}{
			"_id": room.ID,
		},
		"user": userData,
		"message": messageData,
		"timestamp": message.Timestamp,
	}

	// Sticker
	if message.StickerID != nil {
		payload["sticker"] = map[string]interface{}{
			"_id":   message.StickerID.Hex(),
			"image": message.Image,
		}
	}

	// Upload (file/image)
	if message.Image != "" && message.StickerID == nil {
		filename := filepath.Base(message.Image)
		payload["file"] = filename
	}

	// Evoucher
	if message.EvoucherInfo != nil {
		payload["evoucherInfo"] = map[string]interface{}{
			"title":       message.EvoucherInfo.Title,
			"description": message.EvoucherInfo.Description,
			"claimUrl":    message.EvoucherInfo.ClaimURL,
		}
	}

	// Mention
	if len(message.MentionInfo) > 0 {
		payload["mentions"] = message.MentionInfo
	}

	// Reply
	if message.ReplyToID != nil {
		// (Optional: ดึงข้อมูล replyTo message ถ้าต้องการ)
		payload["replyTo"] = map[string]interface{}{
			"message": map[string]interface{}{
				"_id": message.ReplyToID.Hex(),
			},
		}
	}

	// --- END payload ---

	// สร้าง root event object
	event := map[string]interface{}{
		"type": messageType,
		"payload": payload,
		"receiver": receiverID,
		"timestamp": message.Timestamp,
	}

	// ส่งไป Kafka (topic เดิม) เป็น object ตรงๆ ไม่ต้อง marshal เป็น string
	topic := "chat-notifications"
	err = ns.kafkaBus.Emit(ctx, topic, receiverID, event)
	if err != nil {
		log.Printf("[NotificationService] Failed to send event to Kafka: %v", err)
		return
	}
	log.Printf("[NotificationService] SUCCESS: sent offline notification to %s", receiverID)
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

	// Get sender user model for role
	var senderUser *userModel.User
	userService := queries.NewBaseService[userModel.User](ns.collection.Database().Collection("users"))
	result, err := userService.FindOne(ctx, bson.M{"_id": message.UserID})
	if err == nil && len(result.Data) > 0 {
		senderUser = &result.Data[0]
	}
	role := ns.getNotificationUserRole(ctx, senderUser)

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
		role,
	)

	// Send to generic notification topic
	success := ns.sendToKafka(ctx, receiverID, payload, message.RoomID.Hex(), message.UserID.Hex(), message.Message, messageType, message.ID.Hex())
	
	// Mark as sent only if successful
	if success {
		log.Printf("[NotificationService] SUCCESS: sent notification to %s", receiverID)
	}
}

// SendOfflineReactionNotification sends a reaction notification to offline user
func (ns *NotificationService) SendOfflineReactionNotification(ctx context.Context, receiverID string, message *model.ChatMessage, reaction *model.MessageReaction) {
	log.Printf("[NotificationService] Sending OFFLINE reaction notification: receiver=%s, message=%s", receiverID, message.ID.Hex())

	// Get sender info
	sender, err := ns.getUserById(ctx, reaction.UserID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get sender info: %v", err)
		return
	}

	// Build rich payload
	payload := map[string]interface{}{
		"type": "reaction",
		"payload": map[string]interface{}{
			"action": reaction.Reaction,
			"reactToId": map[string]interface{}{
				"_id": message.ID.Hex(),
			},
			"reaction": reaction.Reaction,
			"timestamp": reaction.Timestamp,
			"user": map[string]interface{}{
				"_id":      sender.ID,
				"username": sender.Username,
				"name": map[string]interface{}{
					"first":  sender.FirstName,
					"last":   sender.LastName,
					"middle": "",
				},
			},
		},
		"timestamp": reaction.Timestamp,
		"receiver":  receiverID,
	}

	topic := "chat-notifications"
	if err := ns.kafkaBus.Emit(ctx, topic, receiverID, payload); err != nil {
		log.Printf("[NotificationService] Failed to send offline reaction notification to Kafka: %v", err)
	} else {
		log.Printf("[NotificationService] SUCCESS: sent offline reaction notification to %s via topic %s", receiverID, topic)
	}
}

func (ns *NotificationService) SendOfflineRestrictionNotification(ctx context.Context, receiverID string, message *model.ChatMessage, restriction *restrictionModel.UserRestriction) {
	log.Printf("[NotificationService] Sending OFFLINE restriction notification: receiver=%s, message=%s", receiverID, message.ID.Hex())
	sender, err := ns.getUserById(ctx, message.UserID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get sender info for restriction notification: %v", err)
		return
	}
	room, err := ns.getRoomById(ctx, message.RoomID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get room info for restriction notification: %v", err)
		return
	}
	payload := chatModel.NotificationPayload{
		Type: "restriction",
		Room: chatModel.NotificationRoom{
			ID:   room.ID,
			Name: map[string]string{"th": room.NameTh, "en": room.NameEn},
		},
		User: chatModel.NotificationUser{
			ID:       sender.ID,
		Username: sender.Username,
		Name:     map[string]interface{}{ "first": sender.FirstName, "last": sender.LastName },
	},
	Message: chatModel.NotificationMessage{
		ID: message.ID.Hex(),
		Message: message.Message,
		Type: "restriction",
		Timestamp: message.Timestamp,
	},
	Receiver: receiverID,
	Timestamp: message.Timestamp,
}
_ = ns.sendOfflineToKafka(ctx, receiverID, payload, room.ID, sender.ID, message.Message, "restriction", message.ID.Hex())
}

// SendOfflineReplyNotification sends a reply notification to offline user
func (ns *NotificationService) SendOfflineReplyNotification(ctx context.Context, receiverID string, message *model.ChatMessage, replyTo *model.ChatMessage) {
	log.Printf("[NotificationService] Sending OFFLINE reply notification: receiver=%s, message=%s", receiverID, message.ID.Hex())
	sender, err := ns.getUserById(ctx, message.UserID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get sender info for reply notification: %v", err)
		return
	}
	room, err := ns.getRoomById(ctx, message.RoomID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get room info for reply notification: %v", err)
		return
	}
	payload := chatModel.NotificationPayload{
		Type: "reply",
		Room: chatModel.NotificationRoom{
			ID:   room.ID,
			Name: map[string]string{"th": room.NameTh, "en": room.NameEn},
		},
		User: chatModel.NotificationUser{
			ID:       sender.ID,
			Username: sender.Username,
			Name:     map[string]interface{}{ "first": sender.FirstName, "last": sender.LastName },
		},
		Message: chatModel.NotificationMessage{
			ID:        message.ID.Hex(),
			Message:   message.Message,
			Type:      "reply",
			Timestamp: message.Timestamp,
		},
		Receiver:  receiverID,
		Timestamp: message.Timestamp,
	}
	_ = ns.sendOfflineToKafka(ctx, receiverID, payload, room.ID, sender.ID, message.Message, "reply", message.ID.Hex())
}

// SendOfflineMentionNotification (overload) sends mention notification to offline user (standardized)
func (ns *NotificationService) SendOfflineMentionNotification(ctx context.Context, receiverID string, message *model.ChatMessage, senderInfo *SimpleUser, roomInfo *SimpleRoom) {
	log.Printf("[NotificationService] Sending OFFLINE mention notification to %s from %s", receiverID, senderInfo.Username)
	payload := chatModel.NotificationPayload{
		Type: "mention",
		Room: chatModel.NotificationRoom{
			ID:   roomInfo.ID,
			Name: map[string]string{"th": roomInfo.NameTh, "en": roomInfo.NameEn},
		},
		User: chatModel.NotificationUser{
			ID:       senderInfo.ID,
			Username: senderInfo.Username,
			Name:     map[string]interface{}{ "first": senderInfo.FirstName, "last": senderInfo.LastName },
		},
		Message: chatModel.NotificationMessage{
			ID:        message.ID.Hex(),
			Message:   message.Message,
			Type:      "mention",
			Timestamp: message.Timestamp,
		},
		Receiver:  receiverID,
		Timestamp: message.Timestamp,
	}
	_ = ns.sendOfflineToKafka(ctx, receiverID, payload, roomInfo.ID, senderInfo.ID, message.Message, "mention", message.ID.Hex())
}

// SendOfflineEvoucherNotification sends evoucher notification to offline user
func (ns *NotificationService) SendOfflineEvoucherNotification(ctx context.Context, receiverID string, message *model.ChatMessage) {
	log.Printf("[NotificationService] Sending OFFLINE evoucher notification: receiver=%s, message=%s", receiverID, message.ID.Hex())
	sender, err := ns.getUserById(ctx, message.UserID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get sender info for evoucher notification: %v", err)
		return
	}
	room, err := ns.getRoomById(ctx, message.RoomID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get room info for evoucher notification: %v", err)
		return
	}
	payload := chatModel.NotificationPayload{
		Type: "evoucher",
		Room: chatModel.NotificationRoom{
			ID:   room.ID,
			Name: map[string]string{"th": room.NameTh, "en": room.NameEn},
		},
		User: chatModel.NotificationUser{
			ID:       sender.ID,
			Username: sender.Username,
			Name:     map[string]interface{}{ "first": sender.FirstName, "last": sender.LastName },
		},
		Message: chatModel.NotificationMessage{
			ID:        message.ID.Hex(),
			Message:   message.Message,
			Type:      "evoucher",
			Timestamp: message.Timestamp,
		},
		Receiver:  receiverID,
		Timestamp: message.Timestamp,
	}
	_ = ns.sendOfflineToKafka(ctx, receiverID, payload, room.ID, sender.ID, message.Message, "evoucher", message.ID.Hex())
}

// SendOfflineUploadNotification sends upload notification to offline user
func (ns *NotificationService) SendOfflineUploadNotification(ctx context.Context, receiverID string, message *model.ChatMessage) {
	log.Printf("[NotificationService] Sending OFFLINE upload notification: receiver=%s, message=%s", receiverID, message.ID.Hex())
	// Get sender info
	sender, err := ns.getUserById(ctx, message.UserID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get sender info for upload notification: %v", err)
		return
	}
	room, err := ns.getRoomById(ctx, message.RoomID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get room info for upload notification: %v", err)
		return
	}

	filename := message.Image
	if idx := strings.LastIndex(filename, "/"); idx != -1 {
		filename = filename[idx+1:]
	}
	payload := map[string]interface{}{
		"type": "upload",
		"payload": map[string]interface{}{
			"file": filename,
			"message": map[string]interface{}{
				"_id":       message.ID.Hex(),
				"type":      "upload",
				"message":   message.Message,
				"timestamp": message.Timestamp,
			},
			"room": map[string]interface{}{
				"_id": room.ID,
			},
			"timestamp": message.Timestamp,
			"user": map[string]interface{}{
				"_id":      sender.ID,
				"username": sender.Username,
				"name": map[string]interface{}{
					"first":  sender.FirstName,
					"last":   sender.LastName,
					"middle": "",
				},
			},
		},
		"timestamp": message.Timestamp,
		"receiver":  receiverID,
	}

	topic := "chat-notifications"
	if err := ns.kafkaBus.Emit(ctx, topic, receiverID, payload); err != nil {
		log.Printf("[NotificationService] Failed to send offline upload notification to Kafka: %v", err)
	} else {
		log.Printf("[NotificationService] SUCCESS: sent offline upload notification to %s via topic %s", receiverID, topic)
	}
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
	if message.FileURL != "" {
		return "upload"
	}
	if message.StickerID != nil {
		return "sticker"
	}
	if message.EvoucherInfo != nil {
		return "evoucher"
	}
	if message.MentionInfo != nil {
		return "mention"
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

// Helper to get NotificationUserRole by user
func (ns *NotificationService) getNotificationUserRole(ctx context.Context, user *userModel.User) *chatModel.NotificationUserRole {
	if user == nil {
		return nil
	}
	var roleID, roleName string
	// Try to handle as primitive.ObjectID (from User struct)
	if oid, ok := any(user.Role).(primitive.ObjectID); ok {
		roleID = oid.Hex()
		if ns.roleService != nil {
			roleObj, err := ns.roleService.GetRoleById(ctx, roleID)
			if err == nil && roleObj != nil {
				roleName = roleObj.Name
			}
		}
	} else if v, ok := any(user.Role).(map[string]interface{}); ok {
		if id, ok := v["id"].(string); ok {
			roleID = id
		}
		if name, ok := v["name"].(string); ok {
			roleName = name
		}
	}
	if roleID == "" {
		return nil
	}
	return &chatModel.NotificationUserRole{
		ID:   roleID,
		Name: roleName,
	}
}

// SendOfflineStickerNotification sends sticker notification to offline user
func (ns *NotificationService) SendOfflineStickerNotification(ctx context.Context, receiverID string, message *model.ChatMessage) {
	log.Printf("[NotificationService] Sending OFFLINE sticker notification: receiver=%s, message=%s", receiverID, message.ID.Hex())
	// Get sender info
	sender, err := ns.getUserById(ctx, message.UserID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get sender info for sticker notification: %v", err)
		return
	}
	room, err := ns.getRoomById(ctx, message.RoomID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get room info for sticker notification: %v", err)
		return
	}

	// Build payload to match broadcast structure
	payload := map[string]interface{}{
		"type": "sticker",
		"payload": map[string]interface{}{
			"sticker": map[string]interface{}{
				"_id":   message.StickerID.Hex(),
				"image": message.Image,
			},
			"message": map[string]interface{}{
				"_id":       message.ID.Hex(),
				"type":      "sticker",
				"message":   message.Message,
				"timestamp": message.Timestamp,
			},
			"room": map[string]interface{}{
				"_id": room.ID,
			},
			"timestamp": message.Timestamp,
			"user": map[string]interface{}{
				"_id":      sender.ID,
				"username": sender.Username,
				"name": map[string]interface{}{
					"first":  sender.FirstName,
					"last":   sender.LastName,
					"middle": "",
				},
			},
		},
		"timestamp": message.Timestamp,
		"receiver":  receiverID,
	}

	topic := "chat-notifications"
	if err := ns.kafkaBus.Emit(ctx, topic, receiverID, payload); err != nil {
		log.Printf("[NotificationService] Failed to send offline sticker notification to Kafka: %v", err)
	} else {
		log.Printf("[NotificationService] SUCCESS: sent offline sticker notification to %s via topic %s", receiverID, topic)
	}
} 