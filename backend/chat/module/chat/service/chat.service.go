package service

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	notificationService "chat/module/notification/service"
	restrictionService "chat/module/restriction/service"
	userModel "chat/module/user/model"
	userService "chat/module/user/service"
	"chat/pkg/config"
	"chat/pkg/core/kafka"
	"chat/pkg/database/queries"
	"chat/pkg/helpers/service"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	roomModel "chat/module/room/room/model"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// กำหนดค่าตรวจสอบสถานะระบบ
const (
	QueueCapacityThreshold = 80  // จำนวน Queue ต่อหน่วยความจำ
	ErrorRateThreshold     = 5   // อัตราความผิดพลาด
	HighLoadThreshold      = 100 // จำนวนข้อความต่อวินาที
)

type (
	SystemMetrics struct {
		QueueCapacity float64       // กำหนดจำนวน queue ต่อหน่วยความจำ
		ErrorRate     float64       // กำหนดอัตราความผิดพลาด
		MessageRate   float64       // กำหนดจำนวนข้อความต่อวินาที
		LastAlertTime time.Time     // กำหนดวันที่ของการแจ้งเตือนล่าสุด
		AlertCooldown time.Duration // กำหนดระยะเวลาการแจ้งเตือน
	}

	ChatService struct {
		*queries.BaseService[model.ChatMessage]
		cache               *utils.ChatCacheService
		hub                 *utils.Hub
		fkValidator         *service.ForeignKeyValidator
		collection          *mongo.Collection
		emitter             *utils.ChatEventEmitter
		kafkaBus            *kafka.Bus
		mongo               *mongo.Database
		redis               *redis.Client
		Config              *config.Config
		notificationService *notificationService.NotificationService
		historyService      *HistoryService
		restrictionService  *restrictionService.RestrictionService

		// **NEW: Async helper for worker pools and error handling**
		asyncHelper      *utils.AsyncHelper
		statusCollection *mongo.Collection
		mu               sync.RWMutex
	}
)

func NewChatService(
	db *mongo.Database,
	redis *redis.Client,
	kafkaBus *kafka.Bus,
	cfg *config.Config,
) *ChatService {
	collection := db.Collection("chat-messages")
	statusCollection := db.Collection("message-status")

	if err := kafkaBus.Start(); err != nil {
		log.Printf("[ERROR] Failed to start Kafka bus: %v", err)
	}

	// Create notification topics
	if err := kafkaBus.CreateTopics([]string{
		"chat-notifications",
	}); err != nil {
		log.Printf("[ERROR] Failed to create Kafka topics: %v", err)
	} else {
		log.Printf("[INFO] Successfully created notification topics")
	}

	hub := utils.NewHub()
	emitter := utils.NewChatEventEmitter(hub, kafkaBus, redis, db)

	// Create role service
	roleService := userService.NewRoleService(db)

	chatService := &ChatService{
		BaseService:         queries.NewBaseService[model.ChatMessage](collection),
		cache:               utils.NewChatCacheService(redis),
		hub:                 hub,
		fkValidator:         service.NewForeignKeyValidator(db),
		collection:          collection,
		emitter:             emitter,
		kafkaBus:            kafkaBus,
		mongo:               db,
		redis:               redis,
		Config:              cfg,
		notificationService: notificationService.NewNotificationService(db, kafkaBus, roleService),
		historyService:      NewHistoryService(db, utils.NewChatCacheService(redis)),
		statusCollection:    statusCollection,
	}

	// **NEW: Initialize async helper**
	chatService.asyncHelper = utils.NewAsyncHelper(db, cfg)
	chatService.asyncHelper.SetPhantomDetectorHandler(chatService)

	chatService.restrictionService = restrictionService.NewRestrictionService(db, chatService.hub, chatService.emitter, chatService.notificationService, kafkaBus)

	// Start monitoring
	go chatService.monitorSystemHealth()

	return chatService
}

/* Helper function for Validate Empty Message */
func isValidChatMessage(msg *model.ChatMessage) bool {
	return msg != nil &&
		(msg.Message != "" || msg.StickerID != nil || msg.FileName != "" ||
			msg.EvoucherInfo != nil || msg.MentionInfo != nil || msg.ModerationInfo != nil)
}

// **Interface implementations for AsyncHelper**
/* Prevent save empty message to database */
func (s *ChatService) SaveMessageToDB(ctx context.Context, msg *model.ChatMessage) error {
	if !isValidChatMessage(msg) {
		log.Printf("[ChatService] Skipping empty message from user %s in room %s", msg.UserID.Hex(), msg.RoomID.Hex())
		return nil
	}

	_, err := s.Create(ctx, *msg)
	return err
}

/* Prevent save empty message to database */
func (s *ChatService) SaveMessageToCache(ctx context.Context, msg *model.ChatMessage) error {
	if !isValidChatMessage(msg) {
		log.Printf("[ChatService] Skipping cache for empty message %s", msg.ID.Hex())
		return nil
	}

	enriched := model.ChatMessageEnriched{
		ChatMessage: *msg,
	}

	// Enrich if reply-to exists
	if msg.ReplyToID != nil {
		replyToMsg, err := s.historyService.getReplyToMessageWithUser(ctx, *msg.ReplyToID)
		if err != nil {
			log.Printf("[ChatService] Failed to get reply-to message for caching: %v", err)
		} else {
			enriched.ReplyTo = replyToMsg
			log.Printf("[ChatService] Added reply-to message to cached message %s", msg.ID.Hex())
		}
	}

	// Log special cases
	if msg.EvoucherInfo != nil {
		log.Printf("[ChatService] Caching evoucher message %s", msg.ID.Hex())
	}
	if msg.MentionInfo != nil {
		log.Printf("[ChatService] Caching mention message %s with %d mentions", msg.ID.Hex(), len(msg.Mentions))
	}
	if msg.ModerationInfo != nil {
		log.Printf("[ChatService] Caching restriction message %s", msg.ID.Hex())
	}
	if msg.StickerID != nil {
		log.Printf("[ChatService] Caching sticker message %s", msg.ID.Hex())
	}

	return s.cache.SaveMessage(ctx, msg.RoomID.Hex(), &enriched)
}

// **NEW: Batch processing methods**
func (s *ChatService) SaveMessageBatch(ctx context.Context, msgs []*model.ChatMessage) error {
	if len(msgs) == 0 {
		return nil
	}

	// Filter valid messages only
	validMsgs := make([]interface{}, 0, len(msgs))
	for _, msg := range msgs {
		if isValidChatMessage(msg) {
			validMsgs = append(validMsgs, *msg)
		} else {
			log.Printf("[ChatService] Skipping empty message in batch from user %s in room %s", msg.UserID.Hex(), msg.RoomID.Hex())
		}
	}

	if len(validMsgs) == 0 {
		// No valid messages to insert
		return nil
	}

	// Bulk insert valid messages
	_, err := s.collection.InsertMany(ctx, validMsgs)
	return err
}

func (s *ChatService) SaveMessageBatchToCache(ctx context.Context, roomID string, msgs []*model.ChatMessage) error {
	if len(msgs) == 0 {
		return nil
	}

	pipeline := s.redis.Pipeline()
	key := fmt.Sprintf("chat:room:%s:messages", roomID)

	for _, msg := range msgs {
		if !isValidChatMessage(msg) {
			log.Printf("[ChatService] Skipping empty message in batch cache for room %s", roomID)
			continue
		}

		enriched := model.ChatMessageEnriched{
			ChatMessage: *msg,
		}

		jsonData, err := json.Marshal(enriched)
		if err != nil {
			return fmt.Errorf("failed to marshal message: %w", err)
		}

		score := float64(msg.Timestamp.UnixNano())
		pipeline.ZAdd(ctx, key, redis.Z{
			Score:  score,
			Member: jsonData,
		})
	}

	_, err := pipeline.Exec(ctx)
	return err
}

// SendNotifications sends notifications to offline users
func (s *ChatService) SendNotifications(ctx context.Context, message *model.ChatMessage, onlineUsers []string) error {
	// โหลด room เต็ม (metadata)
	fullRoom, err := s.getFullRoomById(ctx, message.RoomID)
	if err != nil {
		// fallback เดิม
		roomType, err := s.getRoomType(ctx, message.RoomID)
		if err == nil && (roomType == "mc" || roomType == "normal") {
			log.Printf("[ChatService] Skipping notification for MC & Normal room %s", message.RoomID.Hex())
			return nil
		}
	} else {
		if fullRoom.Type == "mc" {
			log.Printf("[ChatService] Skipping notification for MC room %s", message.RoomID.Hex())
			return nil
		}
		if fullRoom.Type == "normal" && !(fullRoom.GetGroupType() == "school" || fullRoom.GetGroupType() == "major") {
			log.Printf("[ChatService] Skipping notification for Normal room (not school/major) %s", message.RoomID.Hex())
			return nil
		}
	}
	log.Printf("[ChatService] Sending notifications for message %s", message.ID.Hex())

	// Get room members
	roomMembers, err := s.getRoomMembers(ctx, message.RoomID)
	if err != nil {
		log.Printf("[ChatService] Failed to get room members: %v", err)
		return err
	}

	// Create online user lookup map
	onlineUserMap := make(map[string]bool)
	for _, userID := range onlineUsers {
		onlineUserMap[userID] = true
	}

	// Determine message type
	messageType := s.determineMessageType(message)

	// Send notification to offline members only (except sender)
	for _, memberID := range roomMembers {
		memberIDStr := memberID.Hex()

		// Skip the sender
		if memberIDStr == message.UserID.Hex() {
			continue
		}

		// Skip online users
		if onlineUserMap[memberIDStr] {
			continue
		}

		// Send notification with proper message type and file info
		s.notificationService.SendOfflineNotification(ctx, memberIDStr, message, messageType)
	}

	return nil
}

// getRoomMembers gets all members of a room
func (s *ChatService) getRoomMembers(ctx context.Context, roomID primitive.ObjectID) ([]primitive.ObjectID, error) {
	log.Printf("[ChatService] Getting room members for room %s", roomID.Hex())

	roomCollection := s.collection.Database().Collection("rooms")

	// Use bson.M to handle any document structure
	var room bson.M

	err := roomCollection.FindOne(ctx, bson.M{"_id": roomID}).Decode(&room)
	if err != nil {
		log.Printf("[ChatService] ❌ Failed to find room %s: %v", roomID.Hex(), err)
		return nil, err
	}

	// Extract members array safely
	membersRaw, exists := room["members"]
	if !exists {
		log.Printf("[ChatService] ⚠️ Room %s has no members field", roomID.Hex())
		return []primitive.ObjectID{}, nil
	}

	// Convert to array of ObjectIDs
	membersArray, ok := membersRaw.(primitive.A)
	if !ok {
		log.Printf("[ChatService] ❌ Members field is not an array in room %s", roomID.Hex())
		return []primitive.ObjectID{}, nil
	}

	members := make([]primitive.ObjectID, 0, len(membersArray))
	for i, memberRaw := range membersArray {
		if memberID, ok := memberRaw.(primitive.ObjectID); ok {
			members = append(members, memberID)
			log.Printf("[ChatService] Member %d: %s", i+1, memberID.Hex())
		} else {
			log.Printf("[ChatService] ⚠️ Invalid member at index %d: %v", i, memberRaw)
		}
	}

	roomName := "Unknown"
	if name, exists := room["name"]; exists {
		if nameMap, ok := name.(map[string]interface{}); ok {
			if thName, exists := nameMap["th"]; exists {
				roomName = fmt.Sprintf("%v", thName)
			}
		}
	}

	log.Printf("[ChatService] ✅ Found room %s (%s) with %d members",
		roomID.Hex(), roomName, len(members))

	return members, nil
}

// getRoomType returns the type of the room (e.g., "normal", "mc", etc.)
func (s *ChatService) getRoomType(ctx context.Context, roomID primitive.ObjectID) (string, error) {
	roomCollection := s.mongo.Collection("rooms")
    var room struct {
        Type string `bson:"type"`
    }
    err := roomCollection.FindOne(ctx, bson.M{"_id": roomID}).Decode(&room)
    if err != nil {
        return "", err
    }
    return room.Type, nil
}

// determineMessageType determines the type of message for notification
func (s *ChatService) determineMessageType(message *model.ChatMessage) string {
	if message.FileName != "" {
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
	if message.ReplyToID != nil {
		return "reply"
	}
	if message.ModerationInfo != nil {
		return "restriction"
	}
	return "text"
}

func (s *ChatService) CreateMessageStatus(messageID primitive.ObjectID, roomID primitive.ObjectID) error {
	return s.createMessageStatus(messageID, roomID)
}

func (s *ChatService) UpdateMessageStatus(messageID primitive.ObjectID, field string, value interface{}) {
	s.updateMessageStatus(messageID, field, value)
}

func (s *ChatService) UpdateMessageStatusWithError(messageID primitive.ObjectID, errorMsg string, retryCount int) {
	s.updateMessageStatusWithError(messageID, errorMsg, retryCount)
}

func (s *ChatService) RetrieveMessage(messageID primitive.ObjectID) (*model.ChatMessage, error) {
	filter := bson.M{"_id": messageID}
	var message model.ChatMessage

	err := s.collection.FindOne(context.Background(), filter).Decode(&message)
	if err == nil {
		return &message, nil
	}

	return nil, fmt.Errorf("message not found: %s", messageID.Hex())
}

// **Delegate to AsyncHelper**
func (s *ChatService) SubmitDatabaseJob(jobType string, msg *model.ChatMessage, ctx context.Context) bool {
	return s.asyncHelper.SubmitDatabaseJob(jobType, msg, ctx, s)
}

func (s *ChatService) SubmitNotificationJob(msg *model.ChatMessage, onlineUsers []string, ctx context.Context) bool {
	// โหลด room เต็ม (metadata)
	fullRoom, err := s.getFullRoomById(ctx, msg.RoomID)
	if err != nil {
		// fallback เดิม
		roomType, err := s.getRoomType(ctx, msg.RoomID)
		if err == nil && roomType == "mc" {
			log.Printf("[ChatService] Skipping notification job for MC room %s", msg.RoomID.Hex())
			return false
		}
	} else {
		if fullRoom.Type == "mc" {
			log.Printf("[ChatService] Skipping notification job for MC room %s", msg.RoomID.Hex())
			return false
		}
		if fullRoom.Type == "normal" && !(fullRoom.GetGroupType() == "school" || fullRoom.GetGroupType() == "major") {
			log.Printf("[ChatService] Skipping notification job for Normal room (not school/major) %s", msg.RoomID.Hex())
			return false
		}
	}
	return s.asyncHelper.SubmitNotificationJob(msg, onlineUsers, ctx, s)
}

// **Message Status Management**
func (s *ChatService) createMessageStatus(messageID primitive.ObjectID, roomID primitive.ObjectID) error {
	status := &utils.MessageStatus{
		ID:               primitive.NewObjectID(),
		MessageID:        messageID,
		RoomID:           roomID,
		BroadcastAt:      time.Now(),
		SavedToDB:        false,
		SavedToCache:     false,
		NotificationSent: false,
		RetryCount:       0,
		Status:           "pending",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	_, err := s.statusCollection.InsertOne(context.Background(), status)
	if err != nil {
		return fmt.Errorf("failed to create message status: %v", err)
	}

	return nil
}

func (s *ChatService) updateMessageStatus(messageID primitive.ObjectID, field string, value interface{}) {
	filter := bson.M{"message_id": messageID}
	update := bson.M{
		"$set": bson.M{
			field:        value,
			"updated_at": time.Now(),
		},
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	_, err := s.statusCollection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		log.Printf("[ERROR] Failed to update message status %s.%s: %v", messageID.Hex(), field, err)
	}
}

func (s *ChatService) updateMessageStatusWithError(messageID primitive.ObjectID, errorMsg string, retryCount int) {
	filter := bson.M{"message_id": messageID}
	update := bson.M{
		"$set": bson.M{
			"last_error":  errorMsg,
			"retry_count": retryCount,
			"updated_at":  time.Now(),
		},
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	_, err := s.statusCollection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		log.Printf("[ERROR] Failed to update message status with error %s: %v", messageID.Hex(), err)
	}
}

func (s *ChatService) Shutdown() {
	log.Printf("[ChatService] Starting graceful shutdown...")
	s.asyncHelper.Shutdown()
	log.Printf("[ChatService] Graceful shutdown completed")
}

func (s *ChatService) GetHub() *utils.Hub {
	return s.hub
}

func (s *ChatService) GetRedis() *redis.Client {
	return s.redis
}

func (s *ChatService) GetMongo() *mongo.Database {
	return s.mongo
}

func (s *ChatService) GetUserById(ctx context.Context, userID string) (*userModel.User, error) {
	log.Printf("[DEBUG] GetUserById called for user: %s", userID)

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("[ERROR] Invalid user ID format: %s, error: %v", userID, err)
		return nil, err
	}

	userService := queries.NewBaseService[userModel.User](s.mongo.Collection("users"))
	result, err := userService.FindOne(ctx, bson.M{"_id": userObjID})
	if err != nil {
		log.Printf("[ERROR] Failed to query user %s: %v", userID, err)
		return nil, err
	}

	if len(result.Data) == 0 {
		log.Printf("[ERROR] User %s not found", userID)
		return nil, fmt.Errorf("user not found")
	}

	user := result.Data[0]
	log.Printf("[DEBUG] Successfully retrieved user: %s (%s %s)", user.Username, user.Name.First, user.Name.Last)
	return &user, nil
}

func (s *ChatService) GetNotificationService() *notificationService.NotificationService {
	return s.notificationService
}

func (s *ChatService) GetRestrictionService() *restrictionService.RestrictionService {
	return s.restrictionService
}

func (s *ChatService) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error) {
	return s.historyService.GetChatHistoryByRoom(ctx, roomID, limit)
}

func (s *ChatService) DeleteRoomMessages(ctx context.Context, roomID string) error {
	return s.historyService.DeleteRoomMessages(ctx, roomID)
}

// **NEW: Health check methods for HealthController**
func (s *ChatService) GetWorkerPoolStatus() map[string]interface{} {
	return s.asyncHelper.GetWorkerPoolStatus()
}

// ถ้าเกิด message  สร้างไม่เสร็จ ไป trigger ให้มัน retry 3 รอบ
func (s *ChatService) TriggerPhantomMessageFix() error {
	s.asyncHelper.TriggerPhantomMessageDetection()
	return nil
}

func (s *ChatService) monitorSystemHealth() {
	metrics := &SystemMetrics{
		AlertCooldown: 5 * time.Minute,
	}

	ticker := time.NewTicker(30 * time.Second)
	for range ticker.C {
		s.checkSystemMetrics(metrics)
	}
}

func (s *ChatService) checkSystemMetrics(metrics *SystemMetrics) {
	// Check queue capacity
	dbQueueSize, dbQueueCapacity := s.asyncHelper.GetDatabaseWorkerQueueMetrics()
	queueCapacityPercentage := float64(dbQueueSize) / float64(dbQueueCapacity) * 100

	if queueCapacityPercentage > QueueCapacityThreshold {
		s.alertHighQueueCapacity(queueCapacityPercentage)
	}

	// Check error rate
	if metrics.ErrorRate > ErrorRateThreshold {
		s.alertHighErrorRate(metrics.ErrorRate)
	}

	// Check message rate
	if metrics.MessageRate > HighLoadThreshold {
		s.alertHighLoad(metrics.MessageRate)
	}
}

func (s *ChatService) alertHighQueueCapacity(capacity float64) {
	log.Printf("[ALERT] High queue capacity: %.2f%% (threshold: %d%%)",
		capacity, QueueCapacityThreshold)
	// Implement alert notification (e.g., Slack, email, etc.)
}

func (s *ChatService) alertHighErrorRate(rate float64) {
	log.Printf("[ALERT] High error rate: %.2f%% (threshold: %d%%)",
		rate, ErrorRateThreshold)
	// Implement alert notification
}

func (s *ChatService) alertHighLoad(rate float64) {
	log.Printf("[ALERT] High message rate: %.2f/s (threshold: %d/s)",
		rate, HighLoadThreshold)
	// Implement alert notification
}

// เพิ่ม helper สำหรับโหลด room เต็ม (metadata)
func (s *ChatService) getFullRoomById(ctx context.Context, roomID primitive.ObjectID) (*roomModel.Room, error) {
    roomCollection := s.mongo.Collection("rooms")
    var room roomModel.Room
    err := roomCollection.FindOne(ctx, bson.M{"_id": roomID}).Decode(&room)
    if err != nil {
        return nil, err
    }
    return &room, nil
}
