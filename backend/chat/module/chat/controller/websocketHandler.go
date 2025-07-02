package controller

import (
	"chat/module/chat/model"
	"chat/module/chat/utils"
	"chat/pkg/core/connection"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	WebSocketHandler struct {
		chatService        ChatService
		mentionService    MentionChatService
		reactionService   ReactionChatService
		roomService       RoomService
		restrictionService RestrictionServiceChatService
		connManager       *connection.ConnectionManager
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
	mentionService MentionChatService,
	reactionService ReactionChatService,
	roomService RoomService,
	restrictionService RestrictionServiceChatService,
	connManager *connection.ConnectionManager,
) *WebSocketHandler {
	return &WebSocketHandler{
		chatService:        chatService,
		mentionService:    mentionService,
		reactionService:   reactionService,
		roomService:       roomService,
		restrictionService: restrictionService,
		connManager:       connManager,
	}
}

// Send chat history
func (h *WebSocketHandler) sendChatHistory(ctx context.Context, conn *websocket.Conn, roomID string) {
	messages, err := h.chatService.GetChatHistoryByRoom(ctx, roomID, 50)
	if err == nil {
		
		// ตรวจสอบวันที่ของข้อความ
		if len(messages) > 0 {
			log.Printf("[WebSocket] First message timestamp: %v", messages[0].ChatMessage.Timestamp)
			log.Printf("[WebSocket] Last message timestamp: %v", messages[len(messages)-1].ChatMessage.Timestamp)
		}
		
		// Reverse array เพื่อให้ client ได้รับ oldest first สำหรับการแสดงผล
		reversedMessages := make([]model.ChatMessageEnriched, len(messages))

		// loop เรียง array ใหม่
		for i, j := 0, len(messages)-1; i < len(messages); i, j = i+1, j-1 {
			reversedMessages[i] = messages[j]
		}
		
		log.Printf("[WebSocket] Sending %d chat messages for room %s (oldest first for proper display)", len(reversedMessages), roomID)
		
	for _, msg := range reversedMessages {
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
		} else {
				eventType = model.EventTypeMessage
			messageType = model.MessageTypeText
		}

		// Create comprehensive payload structure
		payload := map[string]interface{}{
			"room": map[string]interface{}{
				"_id": roomID,
			},
			"message": map[string]interface{}{
				"_id":       msg.ChatMessage.ID.Hex(),
				"type":      messageType,
				"message":   msg.ChatMessage.Message,
				"timestamp": msg.ChatMessage.Timestamp,
			},
			"user":      userData,
			"timestamp": msg.ChatMessage.Timestamp,
			}

		if len(msg.Reactions) > 0 {
			// Format reactions with user info
			formattedReactions := make([]map[string]interface{}, 0, len(msg.Reactions))
			for _, reaction := range msg.Reactions {
				reactionData := map[string]interface{}{
					"messageId": reaction.MessageID.Hex(),
					"userId":    reaction.UserID.Hex(),
					"reaction":  reaction.Reaction,
					"timestamp": reaction.Timestamp,
				}
				
				// Try to get user info for reaction
				if reactionUser, err := h.chatService.GetUserById(ctx, reaction.UserID.Hex()); err == nil {
					reactionData["user"] = map[string]interface{}{
						"_id":      reactionUser.ID.Hex(),
						"username": reactionUser.Username,
						"name":     reactionUser.Name,
					}
				}
				
				formattedReactions = append(formattedReactions, reactionData)
			}
			payload["reactions"] = formattedReactions
		}

			// **UPDATED: Include mention info if available**
		if len(msg.ChatMessage.MentionInfo) > 0 {
			payload["mentions"] = msg.ChatMessage.MentionInfo
		}

			// Add reply info if exists
		if msg.ReplyTo != nil {
				// Get reply user data
			var replyUserData map[string]interface{}
			if replyUser, err := h.chatService.GetUserById(ctx, msg.ReplyTo.UserID.Hex()); err == nil {
				replyUserData = map[string]interface{}{
					"_id":      replyUser.ID.Hex(),
					"username": replyUser.Username,
						"name":     replyUser.Name,
					}
					
					if replyUser.Role != primitive.NilObjectID {
						replyUserData["role"] = map[string]interface{}{
							"_id": replyUser.Role.Hex(),
						}
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

			// Add sticker info if exists
			if msg.ChatMessage.StickerID != nil {
				payload["sticker"] = map[string]interface{}{
					"_id":   msg.ChatMessage.StickerID.Hex(),
					"image": msg.ChatMessage.Image,
				}
	}

			// **NEW: Add evoucher info if exists**
			if msg.ChatMessage.EvoucherInfo != nil {
				payload["evoucherInfo"] = map[string]interface{}{
					"title":       msg.ChatMessage.EvoucherInfo.Title,
					"description": msg.ChatMessage.EvoucherInfo.Description,
					"claimUrl":    msg.ChatMessage.EvoucherInfo.ClaimURL,
				}
			}

			// **UPDATED: Use actual event type instead of "history"**
	event := model.Event{
				Type:      eventType,
				Payload:   payload,
				Timestamp: msg.ChatMessage.Timestamp,
	}

	if data, err := json.Marshal(event); err == nil {
		conn.WriteMessage(websocket.TextMessage, data)
			}
		}
	}
}

func (h *WebSocketHandler) HandleWebSocket(conn *websocket.Conn) {
	// Setup ping/pong handlers
	h.connManager.SetupPingPong(conn)

	// Get client IP for cleanup
	clientIP := conn.RemoteAddr().String()
	defer h.connManager.RemoveConnection(clientIP)

	roomID := conn.Params("roomId")
	userID := conn.Params("userId")

	if userID == "" || roomID == "" {
		conn.WriteMessage(websocket.TextMessage, []byte("Missing roomID or userID"))
		conn.Close()
		return
	}

	ctx := context.Background()
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

	// Subscribe to room's Kafka topic (non-blocking)

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

	// Send room status

	// ส่ง Room Status
	if status, err := h.roomService.GetRoomStatus(ctx, roomObjID); err == nil {
		if statusBytes, err := json.Marshal(map[string]interface{}{
			"type": "room_status",
			"data": status,
		}); err == nil {
			conn.WriteMessage(websocket.TextMessage, statusBytes)
		}
	}

	// Send chat history
	h.sendChatHistory(ctx, conn, roomID)

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

	// WebSocket connection established - no notification needed
	log.Printf("[DEBUG] User %s connected to WebSocket for room %s", userObjID.Hex(), roomID)
	
	defer func() {
		// WebSocket disconnection - no notification needed
		log.Printf("[DEBUG] User %s disconnected from WebSocket for room %s", userObjID.Hex(), roomID)

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
			break
		}

		messageText := strings.TrimSpace(string(msg))

		// **IMPROVED: Enhanced WebSocket command handling**

		// ให้มัน support action ต่างๆใน socket message เช่น /reply /react /unsend
		switch {
		case strings.HasPrefix(messageText, "/reply "):
			h.handleReplyMessage(messageText, *client)
		case strings.HasPrefix(messageText, "/react "):
			h.handleReactionMessage(messageText, *client)
		case strings.HasPrefix(messageText, "/unsend "):
			h.handleUnsendMessage(messageText, *client)
		default:
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
				
				// Send message through single channel
				if err := h.chatService.SendMessage(ctx, chatMsg); err != nil {
					log.Printf("[ERROR] Failed to send message: %v", err)
					continue
				}
			}
		}
	}
}

// Helper methods for WebSocket message handling
func (h *WebSocketHandler) handleReplyMessage(messageText string, client model.ClientObject) {
	
	// ตรวจสอบสิทธิ์การส่งข้อความก่อน
	canSend, err := h.roomService.CanUserSendMessage(context.Background(), client.RoomID, client.UserID.Hex())
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
	if err := h.chatService.SendMessage(context.Background(), msg); err != nil {
		log.Printf("[ERROR] Failed to send reply message: %v", err)
	}
}

func (h *WebSocketHandler) handleReactionMessage(messageText string, client model.ClientObject) {
	// Parse reaction command: /react messageID emoji
	parts := strings.SplitN(messageText, " ", 3)
	if len(parts) < 3 {
		log.Printf("[WS] Invalid reaction format from user %s", client.UserID.Hex())
		return
	}

	messageID := parts[1]
	reaction := parts[2]

	log.Printf("[WS] User %s wants to react to message %s with %s", 
		client.UserID.Hex(), messageID, reaction)

	// ตรวจสอบสิทธิ์การส่งข้อความก่อน
	canSendReaction, err := h.roomService.CanUserSendReaction(context.Background(), client.RoomID, client.UserID.Hex())
	if err != nil {
		log.Printf("[WS] Error checking reaction permissions for user %s in room %s: %v", 
			client.UserID.Hex(), client.RoomID.Hex(), err)
		return
	}

	// ถ้าไม่มี canSendReaction ก่็สามารถส่งได้
	if !canSendReaction {
		log.Printf("[WS] User %s cannot send reactions in read-only room %s", 
			client.UserID.Hex(), client.RoomID.Hex())
		
		// Send error message to user
		errorEvent := model.Event{
			Type: "error",
			Payload: model.ChatNoticePayload{
				Room: model.RoomInfo{ID: client.RoomID.Hex()},
				Message: "Reactions are not allowed in read-only rooms",
				Timestamp: time.Now(),
			},
			Timestamp: time.Now(),
		}
		
		if eventData, err := json.Marshal(errorEvent); err == nil {
			client.Conn.WriteMessage(websocket.TextMessage, eventData)
		}
		return
	}

	// ตรวจสอบสิทธิ์การส่งข้อความก่อน
	if h.restrictionService.IsUserBanned(context.Background(), client.UserID, client.RoomID) {
		log.Printf("[WS] Banned user %s tried to react in room %s", client.UserID.Hex(), client.RoomID.Hex())
		return
	}

	if h.restrictionService.IsUserMuted(context.Background(), client.UserID, client.RoomID) {
		log.Printf("[WS] Muted user %s tried to react in room %s", client.UserID.Hex(), client.RoomID.Hex())
		return
	}

	// Create reaction
	reactionObj := &model.MessageReaction{
		UserID:    client.UserID,
		Reaction:  reaction,
		Timestamp: time.Now(),
	}

	// Convert messageID to ObjectID
	if messageObjID, err := primitive.ObjectIDFromHex(messageID); err == nil {
		reactionObj.MessageID = messageObjID
		
		// Handle reaction
		if err := h.reactionService.HandleReaction(context.Background(), reactionObj); err != nil {
			log.Printf("[WS] Failed to handle reaction: %v", err)
		}
	} else {
		log.Printf("[WS] Invalid message ID for reaction: %s", messageID)
	}
}

// handleUnsendMessage จะต้องมีการตรวจสอบสิทธิ์การส่งข้อความก่อน
func (h *WebSocketHandler) handleUnsendMessage(messageText string, client model.ClientObject) {

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
	if h.restrictionService.IsUserBanned(context.Background(), client.UserID, client.RoomID) {
		log.Printf("[WS] Banned user %s tried to unsend message in room %s", client.UserID.Hex(), client.RoomID.Hex())
		return
	}

	// ตรวจสอบสิทธิ์การส่งข้อความก่อน
	if h.restrictionService.IsUserMuted(context.Background(), client.UserID, client.RoomID) {
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
	if err := h.chatService.UnsendMessage(context.Background(), messageObjID, client.UserID); err != nil {
		log.Printf("[WS] Failed to unsend message %s by user %s: %v", messageID, client.UserID.Hex(), err)
		
		// ส่ง error message ไปยัง user
		errorEvent := model.Event{
			Type: "error",
			Payload: model.ChatNoticePayload{
				Room: model.RoomInfo{ID: client.RoomID.Hex()},
				Message: fmt.Sprintf("Failed to unsend message: %s", err.Error()),
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