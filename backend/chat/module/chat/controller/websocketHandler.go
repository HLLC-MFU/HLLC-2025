package controller

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	"chat/pkg/core/connection"
	"chat/pkg/middleware"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	mentionService "chat/module/chat/service"
	userService "chat/module/user/service"

	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	WebSocketHandler struct {
		chatService        ChatService
		mentionService     mentionService.MentionService
		roomService        RoomService
		restrictionService RestrictionServiceChatService
		connManager        *connection.ConnectionManager
		roleService        *userService.RoleService
		rbacMiddleware     middleware.IRBACMiddleware
	}

	RestrictionServiceChatService interface {
		CanUserSendMessages(ctx context.Context, userID, roomID primitive.ObjectID) bool
		CanUserViewMessages(ctx context.Context, userID, roomID primitive.ObjectID) bool
		IsUserBanned(ctx context.Context, userID, roomID primitive.ObjectID) bool
		IsUserMuted(ctx context.Context, userID, roomID primitive.ObjectID) bool
	}
)

func NewWebSocketHandler(
	chatService ChatService,
	mentionService mentionService.MentionService,
	roomService RoomService,
	restrictionService RestrictionServiceChatService,
	connManager *connection.ConnectionManager,
	roleService *userService.RoleService,
	rbacMiddleware middleware.IRBACMiddleware,
) *WebSocketHandler {
	return &WebSocketHandler{
		chatService:        chatService,
		mentionService:     mentionService,
		roomService:        roomService,
		restrictionService: restrictionService,
		connManager:        connManager,
		roleService:        roleService,
		rbacMiddleware:     rbacMiddleware,
	}
}

// Send chat history
func (h *WebSocketHandler) sendChatHistory(ctx context.Context, conn *websocket.Conn, roomID string) {
	log.Printf("[WebSocket] 🔍 Fetching chat history for room %s", roomID)

	messages, err := h.chatService.GetChatHistoryByRoom(ctx, roomID, 50)
	if err != nil {
		log.Printf("[WebSocket] ❌ Failed to get chat history for room %s: %v", roomID, err)
		return
	}

	log.Printf("[WebSocket] 📊 Retrieved %d messages from history for room %s", len(messages), roomID)

	// ตรวจสอบวันที่ของข้อความ
	if len(messages) > 0 {
		log.Printf("[WebSocket] 📅 First message timestamp: %v", messages[0].ChatMessage.Timestamp)
		log.Printf("[WebSocket] 📅 Last message timestamp: %v", messages[len(messages)-1].ChatMessage.Timestamp)
	}

	// **ENHANCED: Log special message types found in history**
	specialMessageCount := 0
	for _, msg := range messages {
		if msg.ChatMessage.EvoucherInfo != nil {
			log.Printf("[WebSocket] 🎫 Found evoucher message in history: %s", msg.ChatMessage.ID.Hex())
			specialMessageCount++
		}
		if msg.ChatMessage.MentionInfo != nil {
			log.Printf("[WebSocket] 📢 Found mention message in history: %s with %d mentions", msg.ChatMessage.ID.Hex(), len(msg.ChatMessage.Mentions))
			specialMessageCount++
		}
		if msg.ChatMessage.ModerationInfo != nil {
			log.Printf("[WebSocket] 🚫 Found restriction message in history: %s", msg.ChatMessage.ID.Hex())
			specialMessageCount++
		}
		if msg.ChatMessage.StickerID != nil {
			log.Printf("[WebSocket] 😀 Found sticker message in history: %s", msg.ChatMessage.ID.Hex())
			specialMessageCount++
		}
		if msg.ReplyTo != nil {
			log.Printf("[WebSocket] ↩️ Found reply message in history: %s -> %s", msg.ChatMessage.ID.Hex(), msg.ReplyTo.ID.Hex())
			specialMessageCount++
		}

	}

	log.Printf("[WebSocket] 🎯 Found %d special message types in history for room %s", specialMessageCount, roomID)

	// Reverse array เพื่อให้ client ได้รับ oldest first สำหรับการแสดงผล
	reversedMessages := make([]model.ChatMessageEnriched, len(messages))

	// loop เรียง array ใหม่
	for i, j := 0, len(messages)-1; i < len(messages); i, j = i+1, j-1 {
		reversedMessages[i] = messages[j]
	}

	// ===== เพิ่มโค้ด filter เฉพาะ MC room =====
	userID, err := h.rbacMiddleware.ExtractUserIDFromContext(ctx)
	if err != nil {
		log.Printf("[WebSocket] ❌ Failed to extract userID from context: %v", err)
		return
	}
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	mcHelper := utils.NewMCRoomHelper(h.chatService.GetMongo())
	roomObjID, _ := primitive.ObjectIDFromHex(roomID)
	isMCRoom := mcHelper.IsMCRoom(ctx, roomObjID)

	filteredMessages := reversedMessages
	if isMCRoom {
		filteredMessages = make([]model.ChatMessageEnriched, 0, len(reversedMessages))
		for _, msg := range reversedMessages {
			shouldShow, err := mcHelper.ShouldShowMessage(ctx, msg.ChatMessage.UserID, userObjID, roomObjID)
			if err == nil && shouldShow {
				filteredMessages = append(filteredMessages, msg)
			}
		}
	}
	// ======= ใช้ filteredMessages แทน reversedMessages ใน loop เดิม =======

	log.Printf("[WebSocket] 📤 Sending %d chat messages for room %s (oldest first for proper display)", len(filteredMessages), roomID)

	messagesSent := 0
	for _, msg := range filteredMessages {
		// Get user details with role populated
		var userData map[string]interface{}
		if user, err := h.chatService.GetUserById(ctx, msg.ChatMessage.UserID.Hex()); err == nil {
			userData = map[string]interface{}{
				"_id":      user.ID.Hex(),
				"username": user.Username,
				"name": map[string]interface{}{
					"first":  user.Name.First,
					"middle": user.Name.Middle,
					"last":   user.Name.Last,
				},
			}

			// Add role information (excluding permissions)
			if user.Role != primitive.NilObjectID {
				userData["role"] = map[string]interface{}{
					"_id": user.Role.Hex(),
				}
			}
		} else {
			userData = map[string]interface{}{
				"_id": msg.ChatMessage.UserID.Hex(),
			}
		}

		// Determine event type and message type (same logic as ChatEventEmitter)
		var eventType, messageType string
		if msg.ChatMessage.StickerID != nil {
			eventType = model.EventTypeSticker
			messageType = model.MessageTypeSticker
		} else if msg.ChatMessage.ReplyToID != nil {
			eventType = model.EventTypeReply
			messageType = model.MessageTypeReply
		} else if len(msg.ChatMessage.MentionInfo) > 0 {
			eventType = model.EventTypeMention
			messageType = model.MessageTypeMention
		} else if msg.ChatMessage.EvoucherInfo != nil {
			eventType = model.EventTypeEvoucher
			messageType = model.MessageTypeEvoucher
		} else if msg.ChatMessage.Image != "" {
			eventType = "upload"
			messageType = "upload"
		} else {
			eventType = model.EventTypeMessage
			messageType = model.MessageTypeText
		}

		// Create payload structure that matches ChatEventEmitter exactly
		payload := map[string]interface{}{
			"room": map[string]interface{}{
				"_id": roomID,
			},
			"user": userData,
			"message": map[string]interface{}{
				"_id":       msg.ChatMessage.ID.Hex(),
				"type":      messageType,
				"message":   msg.ChatMessage.Message,
				"timestamp": msg.ChatMessage.Timestamp,
			},
			"timestamp": msg.ChatMessage.Timestamp,
		}

		// Add sticker info if exists (matches ChatEventEmitter)
		if msg.ChatMessage.StickerID != nil {
			payload["sticker"] = map[string]interface{}{
				"_id":   msg.ChatMessage.StickerID.Hex(),
				"image": msg.ChatMessage.Image,
			}
		}

		// Add file upload info if exists (matches ChatEventEmitter)
		if msg.ChatMessage.Image != "" && msg.ChatMessage.StickerID == nil {
			filename := msg.ChatMessage.Image
			if idx := strings.LastIndex(filename, "/"); idx != -1 {
				filename = filename[idx+1:]
			}
			payload["file"] = filename
		}

		// Add evoucher info if exists (matches ChatEventEmitter)
		if msg.ChatMessage.EvoucherInfo != nil {
			payload["evoucherInfo"] = map[string]interface{}{
				"message":      msg.ChatMessage.EvoucherInfo.Message,
				"claimUrl":     msg.ChatMessage.EvoucherInfo.ClaimURL,
				"sponsorImage": msg.ChatMessage.EvoucherInfo.SponsorImage,
				"claimedBy":    msg.ChatMessage.EvoucherInfo.ClaimedBy,
			}
		}

		// Add mention info if exists (matches ChatEventEmitter)
		if len(msg.ChatMessage.MentionInfo) > 0 {
			payload["mentions"] = msg.ChatMessage.MentionInfo
		}

		// Add reply info if exists (matches ChatEventEmitter)
		if msg.ReplyTo != nil {
			log.Printf("[DEBUG] History message is a reply: messageID=%s, replyToID=%s", msg.ChatMessage.ID.Hex(), msg.ReplyTo.ID.Hex())
			// Get reply user data
			var replyUserData map[string]interface{}
			if replyUser, err := h.chatService.GetUserById(ctx, msg.ReplyTo.UserID.Hex()); err == nil {
				replyUserData = map[string]interface{}{
					"_id":      replyUser.ID.Hex(),
					"username": replyUser.Username,
					"name":     replyUser.Name,
				}
			} else {
				replyUserData = map[string]interface{}{
					"_id": msg.ReplyTo.UserID.Hex(),
				}
			}
			payload["replyTo"] = map[string]interface{}{
				"message": map[string]interface{}{
					"_id":       msg.ReplyTo.ID.Hex(),
					"message":   msg.ReplyTo.Message,
					"timestamp": msg.ReplyTo.Timestamp,
				},
				"user": replyUserData,
			}
		}

		// Create event
		event := model.Event{
			Type:      eventType,
			Payload:   payload,
			Timestamp: msg.ChatMessage.Timestamp,
		}

		// Send event to client
		if eventBytes, err := json.Marshal(event); err == nil {
			if err := conn.WriteMessage(websocket.TextMessage, eventBytes); err != nil {
				log.Printf("[WebSocket] ❌ Failed to send history message %s to client: %v", msg.ChatMessage.ID.Hex(), err)
				break
			}
			messagesSent++

			// Log special message types being sent
			if msg.ChatMessage.EvoucherInfo != nil {
				log.Printf("[WebSocket] 📤 Sent evoucher message in history: %s", msg.ChatMessage.ID.Hex())
			}
			if msg.ChatMessage.MentionInfo != nil {
				log.Printf("[WebSocket] 📤 Sent mention message in history: %s", msg.ChatMessage.ID.Hex())
			}
			if msg.ChatMessage.ModerationInfo != nil {
				log.Printf("[WebSocket] 📤 Sent restriction message in history: %s", msg.ChatMessage.ID.Hex())
			}
			if msg.ChatMessage.StickerID != nil {
				log.Printf("[WebSocket] 📤 Sent sticker message in history: %s", msg.ChatMessage.ID.Hex())
			}
			if msg.ReplyTo != nil {
				log.Printf("[WebSocket] 📤 Sent reply message in history: %s", msg.ChatMessage.ID.Hex())
			}

		} else {
			log.Printf("[WebSocket] ❌ Failed to marshal history message %s: %v", msg.ChatMessage.ID.Hex(), err)
		}
	}

	log.Printf("[WebSocket] ✅ Successfully sent %d/%d history messages to client for room %s", messagesSent, len(filteredMessages), roomID)
}

func (h *WebSocketHandler) HandleWebSocket(conn *websocket.Conn) {
	// Setup ping/pong handlers
	h.connManager.SetupPingPong(conn)

	// Get client IP for cleanup
	clientIP := conn.RemoteAddr().String()
	defer h.connManager.RemoveConnection(clientIP)

	roomID := conn.Params("roomId")

	if roomID == "" {
		conn.WriteMessage(websocket.TextMessage, []byte("Missing roomID"))
		conn.Close()
		return
	}

	ctx := context.Background()

	// Extract userID from JWT token
	userID, err := h.rbacMiddleware.ExtractUserIDFromContext(conn)
	if err != nil {
		log.Printf("[WebSocket] Failed to extract userID from token: %v", err)
		conn.WriteMessage(websocket.TextMessage, []byte("Invalid authentication token"))
		conn.Close()
		return
	}

	log.Printf("[WebSocket] 🔌 User %s connecting to room %s", userID, roomID)

	// --- Set userRole in context for permission checks ---
	user, err := h.chatService.GetUserById(ctx, userID)
	var userRole string
	if err == nil && user != nil {
		userRole = ""
		if user.Role != primitive.NilObjectID {
			roleObj, err := h.roleService.GetRoleById(ctx, user.Role.Hex())
			if err == nil && roleObj != nil {
				userRole = roleObj.Name
			}
		}
	}
	ctx = context.WithValue(ctx, "userRole", userRole)
	// --- End set userRole ---

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Invalid room ID"))
		conn.Close()
		return
	}

	// Validate and track connection using RoomService
	if err := h.roomService.ValidateAndTrackConnection(ctx, roomObjID, userID); err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte(err.Error()))
		conn.Close()
		return
	}

	// Sub ไปยัง Kafka Topic Room (Async ไม่โดน Blocking แน่ๆ)
	if err := h.chatService.SubscribeToRoom(ctx, roomID); err != nil {
		log.Printf("[WARN] Failed to subscribe to room topic (continuing without Kafka): %v", err)
	}

	// Validate user ID
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		h.roomService.RemoveConnection(ctx, roomObjID, userID)
		conn.WriteMessage(websocket.TextMessage, []byte("Invalid user ID"))
		conn.Close()
		return
	}

	// ตรวจสอบ BAN status หลังจาก validate user ID แล้ว ถ้าเป็น BAN ก็ต้องออกจากห้อง
	if h.restrictionService.IsUserBanned(ctx, userObjID, roomObjID) {
		log.Printf("[BANNED] User %s is banned from room %s", userID, roomID)
		h.roomService.RemoveConnection(ctx, roomObjID, userID)
		conn.WriteMessage(websocket.TextMessage, []byte("You are banned from this room"))
		conn.Close()
		return
	}

	// **NEW: Check if user is still a member of the room**
	room, err := h.roomService.GetRoomById(ctx, roomObjID)
	if err != nil {
		log.Printf("[ERROR] Failed to get room %s: %v", roomObjID.Hex(), err)
		conn.WriteMessage(websocket.TextMessage, []byte("Failed to get room information"))
		conn.Close()
		return
	}

	// Check if user is still a member
	isMember := false
	for _, memberID := range room.Members {
		if memberID == userObjID {
			isMember = true
			break
		}
	}

	if !isMember {
		log.Printf("[KICKED] User %s is not a member of room %s (likely kicked)", userID, roomID)
		conn.WriteMessage(websocket.TextMessage, []byte("You are not a member of this room"))
		conn.Close()
		return
	}

	// Send room status
	if status, err := h.roomService.GetRoomStatus(ctx, roomObjID); err == nil {
		if statusBytes, err := json.Marshal(map[string]interface{}{
			"type": "room_status",
			"data": status,
		}); err == nil {
			conn.WriteMessage(websocket.TextMessage, statusBytes)
		}
	}

	// **ENHANCED: Send chat history with better logging**
	log.Printf("[WebSocket] 📚 Sending chat history to user %s for room %s", userID, roomID)
	h.sendChatHistory(ctx, conn, roomID)
	log.Printf("[WebSocket] ✅ Chat history sent to user %s for room %s", userID, roomID)

	// Create client object
	client := &model.ClientObject{
		RoomID: roomObjID,
		UserID: userObjID,
		Conn:   conn,
	}

	// Register client with hub first
	h.chatService.GetHub().Register(utils.Client{
		Conn:   conn,
		RoomID: roomObjID,
		UserID: userObjID,
	})

	// WebSocket connection established - send join notification
	log.Printf("[WebSocket] ✅ User %s successfully connected to WebSocket for room %s", userObjID.Hex(), roomID)

	defer func() {
		log.Printf("[WebSocket] 🔌 User %s disconnected from WebSocket for room %s", userObjID.Hex(), roomID)

		// Unregister and cleanup
		h.chatService.GetHub().Unregister(utils.Client{
			Conn:   conn,
			RoomID: roomObjID,
			UserID: userObjID,
		})
		h.roomService.RemoveConnection(ctx, roomObjID, userID)

		// Unsubscribe from room's Kafka topic if no more clients
		if count, err := h.roomService.GetActiveConnectionsCount(ctx, roomObjID); err == nil && count == 0 {
			if err := h.chatService.UnsubscribeFromRoom(ctx, roomID); err != nil {
				log.Printf("[WARN] Failed to unsubscribe from room topic: %v", err)
			}
		}
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("[WebSocket] ❌ User %s connection error: %v", userObjID.Hex(), err)
			break
		}

		messageText := strings.TrimSpace(string(msg))

		// **IMPROVED: Enhanced WebSocket command handling**

		// ให้มัน support action ต่างๆใน socket message เช่น /reply /react /unsend
		switch {
		case strings.HasPrefix(messageText, "/reply "):
			h.handleReplyMessage(messageText, *client, ctx)

		case strings.HasPrefix(messageText, "/unsend "):
			h.handleUnsendMessage(messageText, *client, ctx)
		default:
			// **NEW: Check for kick events and handle disconnection**
			if strings.Contains(messageText, "\"type\":\"user_kicked\"") {
				log.Printf("[WS] User %s received kick event, disconnecting", userID)
				conn.WriteMessage(websocket.TextMessage, []byte("You have been kicked from this room"))
				conn.Close()
				return
			}
			// Check if room is still active (prevent messages in inactive rooms)
			room, err := h.roomService.GetRoomById(ctx, roomObjID)
			if err != nil {
				log.Printf("[WS] Failed to get room %s: %v", roomObjID.Hex(), err)
				continue
			}

			if room.IsInactive() {
				conn.WriteMessage(websocket.TextMessage, []byte("This room is inactive and not accepting messages"))
				continue
			}

			// ตรวจสอบสิทธิ์การส่งข้อความ (restriction + room type)
			canSend, err := h.roomService.CanUserSendMessage(ctx, roomObjID, userID)
			if err != nil || !canSend {
				conn.WriteMessage(websocket.TextMessage, []byte("You cannot send messages in this room (read-only or restricted)"))
				continue
			}

			// ตรวจสอบ restriction status เพิ่มเติม
			if !h.restrictionService.CanUserSendMessages(ctx, userObjID, roomObjID) {
				if h.restrictionService.IsUserBanned(ctx, userObjID, roomObjID) {
					conn.WriteMessage(websocket.TextMessage, []byte("You are banned from this room"))
				} else if h.restrictionService.IsUserMuted(ctx, userObjID, roomObjID) {
					conn.WriteMessage(websocket.TextMessage, []byte("You are muted in this room"))
				} else {
					conn.WriteMessage(websocket.TextMessage, []byte("You cannot send messages in this room"))
				}
				continue
			}

			// Check if message contains mentions (detected by @ symbol)
			if strings.Contains(messageText, "@") {
				// Send as mention message if contains @ symbols
				if _, err := h.mentionService.SendMentionMessage(ctx, userObjID, roomObjID, messageText); err != nil {
					log.Printf("[ERROR] Failed to send mention message: %v", err)
					continue
				}
			} else {
				// Create regular message and send it once
				chatMsg := &model.ChatMessage{
					RoomID:    roomObjID,
					UserID:    userObjID,
					Message:   messageText,
					Timestamp: time.Now(),
				}

				// Always save to DB via SendMessage (this ensures DB persistence)
				metadata := map[string]interface{}{
					"type": "message",
				}
				if err := h.chatService.SendMessage(ctx, chatMsg, metadata); err != nil {
					log.Printf("[ERROR] Failed to send message: %v", err)
					continue
				}
			}
		}
	}
}

// Helper methods for WebSocket message handling
func (h *WebSocketHandler) handleReplyMessage(messageText string, client model.ClientObject, ctx context.Context) {
	// Check if room is still active
	room, err := h.roomService.GetRoomById(ctx, client.RoomID)
	if err != nil {
		log.Printf("[WS] Failed to get room %s: %v", client.RoomID.Hex(), err)
		return
	}

	if room.IsInactive() {
		client.Conn.WriteMessage(websocket.TextMessage, []byte("This room is inactive and not accepting messages"))
		return
	}

	// ตรวจสอบสิทธิ์การส่งข้อความก่อน
	canSend, err := h.roomService.CanUserSendMessage(ctx, client.RoomID, client.UserID.Hex())
	if err != nil || !canSend {
		client.Conn.WriteMessage(websocket.TextMessage, []byte("You cannot send messages in this room (read-only or restricted)"))
		return
	}

	// ตรวจสอบว่ามีการ reply หรือไม่
	parts := strings.SplitN(messageText, " ", 3)
	if len(parts) < 3 {
		return
	}

	// ตรวจสอบว่า messageID มีค่าไหม
	replyToID, err := primitive.ObjectIDFromHex(parts[1])
	if err != nil {
		return
	}

	// สร้าง message ใหม่
	msg := &model.ChatMessage{
		RoomID:    client.RoomID,
		UserID:    client.UserID,
		Message:   parts[2],
		ReplyToID: &replyToID,
		Timestamp: time.Now(),
	}
	// ส่งข้อความ reply ไปยังห้อง
	metadata := map[string]interface{}{
		"type": "reply",
	}
	if err := h.chatService.SendMessage(ctx, msg, metadata); err != nil {
		log.Printf("[ERROR] Failed to send reply message: %v", err)
	}
}

// handleUnsendMessage จะต้องมีการตรวจสอบสิทธิ์การส่งข้อความก่อน
func (h *WebSocketHandler) handleUnsendMessage(messageText string, client model.ClientObject, ctx context.Context) {
	// Check if room is still active
	room, err := h.roomService.GetRoomById(ctx, client.RoomID)
	if err != nil {
		log.Printf("[WS] Failed to get room %s: %v", client.RoomID.Hex(), err)
		return
	}

	if room.IsInactive() {
		client.Conn.WriteMessage(websocket.TextMessage, []byte("This room is inactive and not accepting messages"))
		return
	}

	// เช็คว่ามีการส่ง messageID หรือไม่
	parts := strings.SplitN(messageText, " ", 2)
	if len(parts) < 2 {
		log.Printf("[WS] Invalid unsend format from user %s", client.UserID.Hex())
		return
	}

	// ดึง messageID ออกมา
	messageID := parts[1]

	log.Printf("[WS] User %s wants to unsend message %s", client.UserID.Hex(), messageID)

	// ตรวจสอบสิทธิ์การส่งข้อความก่อน
	if h.restrictionService.IsUserBanned(ctx, client.UserID, client.RoomID) {
		log.Printf("[WS] Banned user %s tried to unsend message in room %s", client.UserID.Hex(), client.RoomID.Hex())
		return
	}

	// ตรวจสอบสิทธิ์การส่งข้อความก่อน
	if h.restrictionService.IsUserMuted(ctx, client.UserID, client.RoomID) {
		log.Printf("[WS] Muted user %s tried to unsend message in room %s", client.UserID.Hex(), client.RoomID.Hex())
		return
	}

	// แปลง messageID เป็น ObjectID
	messageObjID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		log.Printf("[WS] Invalid message ID for unsend: %s", messageID)
		return
	}

	// ส่งข้อความ unsend ไปยังห้อง
	if err := h.chatService.UnsendMessage(ctx, messageObjID, client.UserID); err != nil {
		log.Printf("[WS] Failed to unsend message %s by user %s: %v", messageID, client.UserID.Hex(), err)

		// ส่ง error message ไปยัง user
		errorEvent := model.Event{
			Type: "error",
			Payload: model.ChatNoticePayload{
				Room:      model.RoomInfo{ID: client.RoomID.Hex()},
				Message:   fmt.Sprintf("Failed to unsend message: %s", err.Error()),
				Timestamp: time.Now(),
			},
			Timestamp: time.Now(),
		}

		if eventData, err := json.Marshal(errorEvent); err == nil {
			client.Conn.WriteMessage(websocket.TextMessage, eventData)
		}
		return
	}

	// ส่งข้อความ unsend ไปยังห้อง
	log.Printf("[WS] Successfully unsent message %s by user %s", messageID, client.UserID.Hex())
}

// HandleRoomStatusChange handles room status change events and disconnects users if room becomes inactive
func (h *WebSocketHandler) HandleRoomStatusChange(ctx context.Context, roomID string, newStatus string) {
	log.Printf("[WS] 🚨 Room status change event received: room=%s, status=%s", roomID, newStatus)

	// Only handle status changes to inactive
	if newStatus != "inactive" {
		log.Printf("[WS] Room %s status changed to %s (not inactive), skipping disconnect", roomID, newStatus)
		return
	}

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		log.Printf("[WS] ❌ Invalid room ID for status change: %s", roomID)
		return
	}

	// Check if room has active connections
	connectedRooms := h.chatService.GetHub().GetConnectedRooms()
	if !connectedRooms[roomID] {
		log.Printf("[WS] ℹ️ Room %s has no active connections, skipping disconnect", roomID)
		return
	}

	log.Printf("[WS] 🔥 Room %s is inactive and has active connections, disconnecting all users", roomID)

	// Create deactivation message
	deactivationEvent := map[string]interface{}{
		"type": "room_deactivated",
		"data": map[string]interface{}{
			"roomId":    roomID,
			"message":   "This room has been deactivated. You will be disconnected.",
			"timestamp": time.Now(),
		},
	}

	eventBytes, err := json.Marshal(deactivationEvent)
	if err != nil {
		log.Printf("[WS] ❌ Failed to marshal deactivation event: %v", err)
		return
	}

	// Broadcast deactivation message to all users in the room
	h.chatService.GetHub().BroadcastToRoom(roomID, eventBytes)
	log.Printf("[WS] 📢 Broadcasted deactivation message to room %s", roomID)

	// Force disconnect all users from the room immediately
	disconnectedCount := h.chatService.GetHub().ForceDisconnectAllUsersFromRoom(roomID)
	log.Printf("[WS] 🔌 Force disconnected %d connections from room %s", disconnectedCount, roomID)

	// Also call the service method to clean up cache
	if err := h.roomService.DisconnectAllUsersFromRoom(ctx, roomObjID); err != nil {
		log.Printf("[WS] ❌ Failed to clean up room cache for %s: %v", roomID, err)
	}

	log.Printf("[WS] ✅ Successfully disconnected all users from inactive room %s", roomID)
}
