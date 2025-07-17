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
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type NotificationService struct {
	*queries.BaseService[chatModel.NotificationPayload]
	kafkaBus    *kafka.Bus
	collection  *mongo.Collection
	roleService *userService.RoleService
}

// Helper types for simple data structures
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
	Image  string
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

// ==================== MAIN NOTIFICATION METHODS ====================

// NotifyUsersInRoom sends notifications to offline users in a room only (not online users)
func (ns *NotificationService) NotifyUsersInRoom(ctx context.Context, message *model.ChatMessage, onlineUsers []string) {
	log.Printf("[NotificationService] Starting offline notification process for room %s", message.RoomID.Hex())

	// **NEW: Check if this is an evoucher message**
	if message.EvoucherInfo != nil {
		log.Printf("[NotificationService] ✅ EVOUCHER MESSAGE DETECTED: ID=%s, ClaimURL=%s, Message=%s",
			message.ID.Hex(), message.EvoucherInfo.ClaimURL, message.EvoucherInfo.Message.Th)
	} else {
		log.Printf("[NotificationService] Regular message detected: ID=%s, Type=%s",
			message.ID.Hex(), ns.determineMessageType(message))
	}

	// Create online user lookup map
	onlineUserMap := make(map[string]bool)
	for _, userID := range onlineUsers {
		onlineUserMap[userID] = true
	}
	log.Printf("[NotificationService] Online users in room: %v (%d users)", onlineUsers, len(onlineUsers))

	// Get room members
	roomMembers, err := ns.getRoomMembers(ctx, message.RoomID)
	if err != nil {
		log.Printf("[NotificationService] Failed to get room members: %v", err)
		return
	}
	log.Printf("[NotificationService] Total room members: %d", len(roomMembers))
	log.Printf("[NotificationService] Room members: %v", roomMembers)

	// Get common data for all notifications
	sender, err := ns.getUserById(ctx, message.UserID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get sender info: %v", err)
		return
	}
	log.Printf("[NotificationService] Sender info: %+v", sender)

	// Get sender user model for role
	var senderUser *userModel.User
	userService := queries.NewBaseService[userModel.User](ns.collection.Database().Collection("users"))
	result, err := userService.FindOne(ctx, bson.M{"_id": message.UserID})
	if err == nil && len(result.Data) > 0 {
		senderUser = &result.Data[0]
	}
	role := ns.getNotificationUserRole(ctx, senderUser)
	log.Printf("[NotificationService] Sender role: %+v", role)

	// Get room info
	room, err := ns.getRoomById(ctx, message.RoomID.Hex())
	if err != nil {
		log.Printf("[NotificationService] Failed to get room info: %v", err)
		return
	}
	log.Printf("[NotificationService] Room info: %+v", room)

	offlineCount := 0
	senderID := message.UserID.Hex()

	// **NEW: Detailed member analysis**
	log.Printf("[NotificationService] ==================== MEMBER ANALYSIS ====================")
	for i, memberID := range roomMembers {
		memberIDStr := memberID.Hex()
		isOnline := onlineUserMap[memberIDStr]
		isSender := memberIDStr == senderID

		log.Printf("[NotificationService] Member %d: %s", i+1, memberIDStr)
		log.Printf("[NotificationService]   - Is Sender: %v", isSender)
		log.Printf("[NotificationService]   - Is Online: %v", isOnline)

		if isSender {
			log.Printf("[NotificationService]   - ⏭️  SKIPPING (is sender)")
			continue
		}

		if isOnline {
			log.Printf("[NotificationService]   - ⏭️  SKIPPING (is online - will receive via WebSocket)")
		} else {
			log.Printf("[NotificationService]   - 🎯 SENDING NOTIFICATION (offline user)")

			// **NEW: Extra debug for evoucher messages**
			if message.EvoucherInfo != nil {
				log.Printf("[NotificationService]   - 🎟️ EVOUCHER NOTIFICATION for user %s", memberIDStr)
				log.Printf("[NotificationService]   - 🎟️ Evoucher data: %+v", message.EvoucherInfo)
			}

			// Create notification based on message type
			ns.createAndSendNotification(ctx, memberIDStr, message, room, sender, role)
			offlineCount++
		}
	}
	log.Printf("[NotificationService] ========================================================")

	log.Printf("[NotificationService] SUMMARY: Notified %d offline users (total members: %d, eligible: %d)",
		offlineCount, len(roomMembers), len(roomMembers)-1)
}

// ==================== CONDITIONAL NOTIFICATION CREATION ====================

// createAndSendNotification creates the appropriate notification based on message type
func (ns *NotificationService) createAndSendNotification(ctx context.Context, receiverID string, message *model.ChatMessage, room *SimpleRoom, sender *SimpleUser, role *chatModel.NotificationSenderRole) {
	// เช็ค message ว่างก่อนส่ง
	if strings.TrimSpace(message.Message) == "" {
		log.Printf("[NotificationService] Empty message detected, skipping notification for receiver %s", receiverID)
		return
	}

	messageType := ns.determineMessageType(message)

	log.Printf("[NotificationService] Creating %s notification for receiver %s", messageType, receiverID)

	// Create base notification components
	notificationRoom := chatModel.CreateNotificationRoom(room.ID, room.NameTh, room.NameEn, room.Image)
	notificationSender := chatModel.CreateNotificationSender(sender.ID, sender.Username, sender.FirstName, sender.LastName, role)
	notificationMessage := chatModel.CreateNotificationMessage(message.ID.Hex(), message.Message, messageType, message.Timestamp)

	var payload chatModel.NotificationPayload

	switch messageType {
	case chatModel.MessageTypeSticker:
		payload = ns.createStickerNotification(notificationRoom, notificationSender, notificationMessage, message, receiverID)
	case chatModel.MessageTypeUpload:
		payload = ns.createUploadNotification(notificationRoom, notificationSender, notificationMessage, message, receiverID)
	case chatModel.MessageTypeEvoucher:
		payload = ns.createEvoucherNotification(notificationRoom, notificationSender, notificationMessage, message, receiverID)
	case chatModel.MessageTypeMention:
		payload = ns.createMentionNotification(notificationRoom, notificationSender, notificationMessage, message, receiverID)
	case chatModel.MessageTypeReply:
		payload = ns.createReplyNotification(ctx, notificationRoom, notificationSender, notificationMessage, message, receiverID)

	case chatModel.MessageTypeRestriction:
		// Determine specific restriction type from message content
		restrictionType := ns.determineRestrictionType(message)
		payload = ns.createSpecificRestrictionNotification(notificationRoom, notificationSender, notificationMessage, message, receiverID, restrictionType)

	case chatModel.MessageTypeUnsend:
		payload = ns.createUnsendNotification(notificationRoom, notificationSender, notificationMessage, message, receiverID)
	default:
		payload = ns.createTextNotification(notificationRoom, notificationSender, notificationMessage, message, receiverID)
	}

	ns.sendNotificationToKafka(ctx, receiverID, payload)
}

// ==================== TYPE-SPECIFIC NOTIFICATION CREATORS ====================

// createTextNotification creates a standard text message notification
func (ns *NotificationService) createTextNotification(room chatModel.NotificationRoom, sender chatModel.NotificationSender, message chatModel.NotificationMessage, chatMessage *model.ChatMessage, receiverID string) chatModel.NotificationPayload {
	// For regular messages, use the basic structure with "message" type
	message.Type = chatModel.MessageTypeMessage
	return chatModel.NewTextNotification(room, sender, message, receiverID)
}

// createStickerNotification creates a sticker notification with sticker info
func (ns *NotificationService) createStickerNotification(room chatModel.NotificationRoom, sender chatModel.NotificationSender, message chatModel.NotificationMessage, chatMessage *model.ChatMessage, receiverID string) chatModel.NotificationPayload {
	// Add sticker info to message
	if chatMessage.StickerID != nil {
		stickerInfo := chatModel.NotificationStickerInfo{
			ID:    chatMessage.StickerID.Hex(),
			Image: chatMessage.Image,
		}
		message.StickerInfo = &stickerInfo
	}

	return chatModel.NewStickerNotification(room, sender, message, chatModel.NotificationStickerInfo{
		ID:    chatMessage.StickerID.Hex(),
		Image: chatMessage.Image,
	}, receiverID)
}

// createUploadNotification creates an upload notification with file info
func (ns *NotificationService) createUploadNotification(room chatModel.NotificationRoom, sender chatModel.NotificationSender, message chatModel.NotificationMessage, chatMessage *model.ChatMessage, receiverID string) chatModel.NotificationPayload {
	// Extract filename from path
	filename := chatMessage.Image
	if idx := strings.LastIndex(filename, "/"); idx != -1 {
		filename = filename[idx+1:]
	}

	uploadInfo := chatModel.NotificationUploadInfo{
		FileName: filename,
	}

	// Add upload info to message
	message.UploadInfo = &uploadInfo

	return chatModel.NewUploadNotification(room, sender, message, uploadInfo, receiverID)
}

// createEvoucherNotification creates an evoucher notification with evoucher info
func (ns *NotificationService) createEvoucherNotification(room chatModel.NotificationRoom, sender chatModel.NotificationSender, message chatModel.NotificationMessage, chatMessage *model.ChatMessage, receiverID string) chatModel.NotificationPayload {
	// Add evoucher info to message
	if chatMessage.EvoucherInfo != nil {
		message.EvoucherInfo = chatMessage.EvoucherInfo
	}

	return chatModel.NewEvoucherNotification(room, sender, message, chatMessage.EvoucherInfo, receiverID)
}

// createMentionNotification creates a mention notification with mention info
func (ns *NotificationService) createMentionNotification(room chatModel.NotificationRoom, sender chatModel.NotificationSender, message chatModel.NotificationMessage, chatMessage *model.ChatMessage, receiverID string) chatModel.NotificationPayload {
	// Add mention info to message
	if len(chatMessage.MentionInfo) > 0 {
		message.MentionInfo = chatMessage.MentionInfo
	}

	return chatModel.NewMentionNotification(room, sender, message, chatMessage.MentionInfo, receiverID)
}

// createReplyNotification creates a reply notification with reply info
func (ns *NotificationService) createReplyNotification(ctx context.Context, room chatModel.NotificationRoom, sender chatModel.NotificationSender, message chatModel.NotificationMessage, chatMessage *model.ChatMessage, receiverID string) chatModel.NotificationPayload {
	// Get the original message that was replied to
	var replyToMessage *model.ChatMessage
	if chatMessage.ReplyToID != nil {
		log.Printf("[NotificationService] Getting reply message for ID: %s", chatMessage.ReplyToID.Hex())
		// Get the original message from database
		chatService := queries.NewBaseService[model.ChatMessage](ns.collection.Database().Collection("chat-messages"))
		result, err := chatService.FindOne(ctx, bson.M{"_id": chatMessage.ReplyToID})
		if err == nil && len(result.Data) > 0 {
			replyToMessage = &result.Data[0]
			log.Printf("[NotificationService] Found reply message: ID=%s, UserID=%s, Message=%s",
				replyToMessage.ID.Hex(), replyToMessage.UserID.Hex(), replyToMessage.Message)
		} else {
			log.Printf("[NotificationService] Failed to get reply message: %v", err)
		}
	}

	// Get the user who was replied to
	var replyToUser *SimpleUser
	if replyToMessage != nil {
		replyToUser, _ = ns.getUserById(ctx, replyToMessage.UserID.Hex())
		if replyToUser != nil {
			log.Printf("[NotificationService] Found reply user: ID=%s, Username=%s",
				replyToUser.ID, replyToUser.Username)
		} else {
			log.Printf("[NotificationService] Failed to get reply user info")
		}
	}

	// Create enhanced reply info
	replyInfo := chatModel.NotificationReplyInfo{
		MessageID: chatMessage.ReplyToID.Hex(),
	}

	// Add reply message content if available
	if replyToMessage != nil {
		replyInfo.Message = replyToMessage.Message
		replyInfo.ReplyUserID = replyToMessage.UserID.Hex()
		if replyToUser != nil {
			replyInfo.ReplyUserName = replyToUser.Username
		}
		log.Printf("[NotificationService] Final reply info: MessageID=%s, Message=%s, ReplyUserID=%s, ReplyUserName=%s",
			replyInfo.MessageID, replyInfo.Message, replyInfo.ReplyUserID, replyInfo.ReplyUserName)
	}

	// Add reply info to message
	message.ReplyTo = &replyInfo

	// Create enhanced room info with name and image
	enhancedRoom := chatModel.NotificationRoom{
		ID:    room.ID,
		Name:  room.Name,
		Image: room.Image,
	}

	return chatModel.NewReplyNotification(enhancedRoom, sender, message, replyInfo, receiverID)
}

// createSpecificRestrictionNotification creates a specific restriction notification based on type
func (ns *NotificationService) createSpecificRestrictionNotification(room chatModel.NotificationRoom, sender chatModel.NotificationSender, message chatModel.NotificationMessage, chatMessage *model.ChatMessage, receiverID string, restrictionType string) chatModel.NotificationPayload {
	// Set the specific restriction type in the message
	message.Type = restrictionType

	// Create specific notification based on restriction type
	switch restrictionType {
	case chatModel.MessageTypeRestrictionBan:
		return chatModel.NewRestrictionBanNotification(room, sender, message, receiverID)
	case chatModel.MessageTypeRestrictionUnban:
		return chatModel.NewRestrictionUnbanNotification(room, sender, message, receiverID)
	case chatModel.MessageTypeRestrictionMute:
		return chatModel.NewRestrictionMuteNotification(room, sender, message, receiverID)
	case chatModel.MessageTypeRestrictionUnmute:
		return chatModel.NewRestrictionUnmuteNotification(room, sender, message, receiverID)
	case chatModel.MessageTypeRestrictionKick:
		return chatModel.NewRestrictionKickNotification(room, sender, message, receiverID)
	default:
		// Fallback to generic restriction notification
		return chatModel.NewRestrictionNotification(room, sender, message, receiverID)
	}
}

// determineRestrictionType determines the specific restriction type from message content
func (ns *NotificationService) determineRestrictionType(message *model.ChatMessage) string {
	// Check message content to determine restriction type
	msgContent := strings.ToLower(message.Message)

	if strings.Contains(msgContent, "banned") {
		return chatModel.MessageTypeRestrictionBan
	} else if strings.Contains(msgContent, "unbanned") {
		return chatModel.MessageTypeRestrictionUnban
	} else if strings.Contains(msgContent, "muted") {
		return chatModel.MessageTypeRestrictionMute
	} else if strings.Contains(msgContent, "unmuted") {
		return chatModel.MessageTypeRestrictionUnmute
	} else if strings.Contains(msgContent, "kicked") {
		return chatModel.MessageTypeRestrictionKick
	}

	// Default fallback
	return chatModel.MessageTypeRestriction
}

// createUnsendNotification creates an unsend notification with custom message
func (ns *NotificationService) createUnsendNotification(room chatModel.NotificationRoom, sender chatModel.NotificationSender, message chatModel.NotificationMessage, chatMessage *model.ChatMessage, receiverID string) chatModel.NotificationPayload {
	// Custom message for unsend
	unsendMessage := chatModel.CreateNotificationMessage(
		chatMessage.ID.Hex(),
		sender.Username+" has unsent the message",
		chatModel.MessageTypeUnsend, // FIXED: Use MessageTypeUnsend constant
		chatMessage.Timestamp,
	)

	// Use the proper constructor function
	return chatModel.NewUnsendNotification(room, sender, unsendMessage, receiverID)
}

// ==================== LEGACY COMPATIBILITY METHODS ====================

// SendOfflineNotification sends a structured notification to offline users (legacy method for backward compatibility)
func (ns *NotificationService) SendOfflineNotification(ctx context.Context, receiverID string, message *model.ChatMessage, messageType string) {
	log.Printf("[NotificationService] Legacy SendOfflineNotification: receiver=%s, message=%s, type=%s",
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

	// Create notification based on message type
	ns.createAndSendNotification(ctx, receiverID, message, room, sender, role)
}

// These methods are kept for backward compatibility with existing code
func (ns *NotificationService) SendOfflineRestrictionNotification(ctx context.Context, receiverID string, message *model.ChatMessage, restriction *restrictionModel.UserRestriction) {
	ns.SendOfflineNotification(ctx, receiverID, message, chatModel.MessageTypeRestriction)
}

func (ns *NotificationService) SendOfflineReplyNotification(ctx context.Context, receiverID string, message *model.ChatMessage, replyTo *model.ChatMessage) {
	ns.SendOfflineNotification(ctx, receiverID, message, chatModel.MessageTypeReply)
}

func (ns *NotificationService) SendOfflineEvoucherNotification(ctx context.Context, receiverID string, message *model.ChatMessage) {
	ns.SendOfflineNotification(ctx, receiverID, message, chatModel.MessageTypeEvoucher)
}

func (ns *NotificationService) SendOfflineUploadNotification(ctx context.Context, receiverID string, message *model.ChatMessage) {
	ns.SendOfflineNotification(ctx, receiverID, message, chatModel.MessageTypeUpload)
}

func (ns *NotificationService) SendOfflineStickerNotification(ctx context.Context, receiverID string, message *model.ChatMessage) {
	ns.SendOfflineNotification(ctx, receiverID, message, chatModel.MessageTypeSticker)
}

func (ns *NotificationService) SendMessageNotification(ctx context.Context, receiverID string, message *model.ChatMessage, messageType string) {
	ns.SendOfflineNotification(ctx, receiverID, message, messageType)
}

// ==================== HELPER METHODS ====================

// sendNotificationToKafka sends a structured notification to Kafka
func (ns *NotificationService) sendNotificationToKafka(ctx context.Context, receiverID string, payload chatModel.NotificationPayload) {
	// ตรวจสอบว่าข้อความว่างหรือไม่
	if strings.TrimSpace(payload.Message.Message) == "" &&
		payload.Type != chatModel.MessageTypeSticker &&
		payload.Type != chatModel.MessageTypeUpload &&
		payload.Type != chatModel.MessageTypeEvoucher &&
		payload.Type != chatModel.MessageTypeRestriction &&
		payload.Type != chatModel.MessageTypeUnsend {

		log.Printf("[NotificationService] 🚫 Skipping notification: empty message for receiver=%s (type=%s)", receiverID, payload.Type)
		return
	}

	log.Printf("[NotificationService] Sending notification to Kafka: receiver=%s, payloadType=%s, topic=chat-notifications, payload=%+v", receiverID, payload.Type, payload)
	topic := "chat-notifications"
	err := ns.kafkaBus.Emit(ctx, topic, receiverID, payload)
	if err != nil {
		log.Printf("[NotificationService] Failed to send notification to Kafka: %v", err)
	} else {
		log.Printf("[NotificationService] ✅ Successfully sent notification to Kafka for %s", receiverID)
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

	// Get common data for all notifications
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

			// Create notification based on message type
			ns.createAndSendNotification(ctx, memberIDStr, message, room, sender, role)
			offlineCount++
		}
	}

	log.Printf("[NotificationService] Notified %d offline users", offlineCount)
}

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
	// Check for unsend first (has IsDeleted flag)
	if message.IsDeleted != nil && *message.IsDeleted {
		return chatModel.MessageTypeUnsend // FIXED: Return unsend_message for unsend messages
	}
	// Check for upload first (has Image but no StickerID)
	if message.Image != "" && message.StickerID == nil {
		return chatModel.MessageTypeUpload
	}
	// Check for sticker
	if message.StickerID != nil {
		return chatModel.MessageTypeSticker
	}
	// Check for evoucher
	if message.EvoucherInfo != nil {
		return chatModel.MessageTypeEvoucher
	}
	// Check for mention
	if len(message.MentionInfo) > 0 {
		return chatModel.MessageTypeMention
	}
	// Check for reply
	if message.ReplyToID != nil {
		return chatModel.MessageTypeReply
	}
	// **FIXED: Check for ModerationInfo instead of RestrictionInfo**
	if message.ModerationInfo != nil {
		return chatModel.MessageTypeRestriction
	}
	// Default to message (not text)
	return chatModel.MessageTypeMessage
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
		ID    primitive.ObjectID `bson:"_id"`
		Name  map[string]string  `bson:"name"`
		Image string             `bson:"image"`
	}

	err = roomCollection.FindOne(ctx, bson.M{"_id": roomObjID}).Decode(&room)
	if err != nil {
		return nil, err
	}

	return &SimpleRoom{
		ID:     room.ID.Hex(),
		NameTh: room.Name["th"],
		NameEn: room.Name["en"],
		Image:  room.Image,
	}, nil
}

// Helper to get NotificationUserRole by user
func (ns *NotificationService) getNotificationUserRole(ctx context.Context, user *userModel.User) *chatModel.NotificationSenderRole {
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
	return &chatModel.NotificationSenderRole{
		ID:   roleID,
		Name: roleName,
	}
}

// SendOfflineMentionNotification sends a mention notification to offline user
func (ns *NotificationService) SendOfflineMentionNotification(ctx context.Context, receiverID string, message *model.ChatMessage) {
	log.Printf("[NotificationService] Sending OFFLINE mention notification: receiver=%s, message=%s", receiverID, message.ID.Hex())

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

	// Create notification components
	notificationRoom := chatModel.CreateNotificationRoom(room.ID, room.NameTh, room.NameEn, room.Image)
	notificationSender := chatModel.CreateNotificationSender(sender.ID, sender.Username, sender.FirstName, sender.LastName, nil)
	notificationMessage := chatModel.CreateNotificationMessage(message.ID.Hex(), message.Message, chatModel.MessageTypeMention, message.Timestamp)

	// Add mention info to message
	if len(message.MentionInfo) > 0 {
		notificationMessage.MentionInfo = message.MentionInfo
		log.Printf("[NotificationService] Added %d mentions to notification", len(message.MentionInfo))
	}

	payload := chatModel.NewMentionNotification(notificationRoom, notificationSender, notificationMessage, message.MentionInfo, receiverID)
	log.Printf("[NotificationService] Payload to Kafka: %+v", payload)

	ns.sendNotificationToKafka(ctx, receiverID, payload)

	log.Printf("[NotificationService] ✅ Sent mention notification to user %s", receiverID)
}
