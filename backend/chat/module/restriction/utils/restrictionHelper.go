package utils

import (
	"context"
	"time"

	"chat/module/chat/model"
	"chat/module/chat/utils"
	notificationservice "chat/module/notification/service"
	restrictionModel "chat/module/restriction/model"
	userModel "chat/module/user/model"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Build a ChatMessage for restriction event (pattern like evoucher)
func BuildRestrictionMessage(action string, userID, roomID, restrictorID primitive.ObjectID, reason, duration string, endTime *time.Time, restriction string) *model.ChatMessage {
	return &model.ChatMessage{
		RoomID:    roomID,
		UserID:    restrictorID,
		Message:   generateRestrictionMessage(action, reason),
		Timestamp: time.Now(),
		ModerationInfo: &model.ModerationMessageInfo{
			ID:          primitive.NewObjectID(),
			Restriction: restriction,
			RoomID:      roomID,
			UserID:      userID,
			Timestamp:   time.Now(),
		},
	}
}

func generateRestrictionMessage(action, reason string) string {
	switch action {
	case "ban":
		return "🚫 User has been banned. Reason: " + reason
	case "mute":
		return "🔇 User has been muted. Reason: " + reason
	case "kick":
		return "👢 User has been kicked. Reason: " + reason
	case "unban":
		return "✅ User has been unbanned"
	case "unmute":
		return "✅ User has been unmuted"
	default:
		return "ℹ️ Moderation action: " + action + ". Reason: " + reason
	}
}

// Helper to get user info (for sender)
func GetUserById(ctx context.Context, db *mongo.Database, userID primitive.ObjectID) (*userModel.User, error) {
	var user userModel.User
	err := db.Collection("users").FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Emit and notify restriction event (pattern like evoucher)
func EmitAndNotifyRestriction(
	ctx context.Context,
	emitter *utils.ChatEventEmitter,
	notificationService *notificationservice.NotificationService,
	db *mongo.Database,
	userID, roomID, restrictorID primitive.ObjectID,
	record *restrictionModel.UserRestriction,
	action, reason, duration, restriction string,
	endTime *time.Time,
) error {
	// 1. Build moderation message
	msg := BuildRestrictionMessage(action, userID, roomID, restrictorID, reason, duration, endTime, restriction)

	// 2. Save moderation message to chat-messages collection
	chatMsgCollection := db.Collection("chat-messages")
	msg.CreatedAt = time.Now()
	msg.UpdatedAt = time.Now()
	res, err := chatMsgCollection.InsertOne(ctx, msg)
	if err != nil {
		return err
	}
	msg.ID = res.InsertedID.(primitive.ObjectID)

	// 3. Emit event
	sender, err := GetUserById(ctx, db, restrictorID)
	if err != nil {
		return err
	}
	if err := emitter.EmitRestrictionMessage(ctx, msg, sender, record); err != nil {
		return err
	}

	// 4. Get all room members
	roomCollection := db.Collection("rooms")
	var room struct {
		Members []primitive.ObjectID `bson:"members"`
	}
	err = roomCollection.FindOne(ctx, bson.M{"_id": roomID}).Decode(&room)
	if err != nil {
		return err
	}

	// 5. Get online users in room
	onlineUsers := emitter.GetHub().GetOnlineUsersInRoom(roomID.Hex())
	onlineMap := make(map[string]bool)
	for _, uid := range onlineUsers {
		onlineMap[uid] = true
	}

	// 6. Notify all offline members (except target user)
	targetUserHex := userID.Hex()
	for _, memberID := range room.Members {
		memberHex := memberID.Hex()
		if memberHex == targetUserHex {
			continue // skip target user, will handle below
		}
		if !onlineMap[memberHex] {
			// **FIXED: Use restriction type instead of message type**
			notificationService.SendOfflineNotification(ctx, memberHex, msg, "restriction")
		}
	}

	// 7. Notify target user if offline
	if !onlineMap[targetUserHex] {
		// **FIXED: Use restriction type instead of message type**
		notificationService.SendOfflineNotification(ctx, targetUserHex, msg, "restriction")
	}

	return nil
}
