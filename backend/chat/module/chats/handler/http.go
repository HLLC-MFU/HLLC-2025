package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"path/filepath"
	"strings"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/redis"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/utils"
	MemberService "github.com/HLLC-MFU/HLLC-2025/backend/module/members/service"
	roomRedis "github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/redis"
	RoomService "github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/service"
	stickerService "github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/service"
	kafkaPublisher "github.com/HLLC-MFU/HLLC-2025/backend/pkg/kafka"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ChatHTTPHandler struct {
	service        service.ChatService
	roomService    RoomService.RoomService
	memberService  MemberService.MemberService
	publisher      kafkaPublisher.Publisher
	stickerService stickerService.StickerService
}

func NewHTTPHandler(service service.ChatService, memberService MemberService.MemberService, publisher kafkaPublisher.Publisher, stickerService stickerService.StickerService, roomService RoomService.RoomService) *ChatHTTPHandler {
	return &ChatHTTPHandler{
		service:        service,
		memberService:  memberService,
		publisher:      publisher,
		stickerService: stickerService,
		roomService:    roomService,
	}
}

type MentionPayload struct {
	Mentioned string `json:"mentioned"`
	From      string `json:"from"`
	Message   string `json:"message"`
}

func (h *ChatHTTPHandler) HandleWebSocket(conn *websocket.Conn, userID, username, roomID string) {
	log.Println("[WS Handler] Entered WebSocket handler")
	log.Println("userID:", userID, "username:", username, "roomID:", roomID)

	if userID == "" || roomID == "" {
		log.Println("[WS] Missing roomID or userID")
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

	// Check MongoDB membership
	isMember, err := h.memberService.IsUserInRoom(ctx, roomObjID, userID)
	if err != nil {
		log.Printf("[ERROR] Failed to check MongoDB membership: %v", err)
		conn.WriteMessage(websocket.TextMessage, []byte("Internal server error"))
		conn.Close()
		return
	}

	// Check Redis membership
	isInRedis, err := roomRedis.IsUserInRoom(roomID, userID)
	if err != nil {
		log.Printf("[ERROR] Failed to check Redis membership: %v", err)
	}

	log.Printf("[WS] Membership check - MongoDB: %v, Redis: %v", isMember, isInRedis)

	if !isMember {
		log.Printf("[WS] User %s is not a member of room %s in MongoDB", userID, roomID)
		conn.WriteMessage(websocket.TextMessage, []byte("You are not a member of this room"))
		conn.Close()
		return
	}

	// If user is in MongoDB but not in Redis, add them to Redis
	if isMember && !isInRedis {
		log.Printf("[WS] User %s is in MongoDB but not in Redis, adding to Redis", userID)
		if err := roomRedis.AddUserToRoom(roomID, userID); err != nil {
			log.Printf("[ERROR] Failed to add user to Redis: %v", err)
		}
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Invalid user ID"))
		conn.Close()
		return
	}

	client := model.ClientObject{
		RoomID: roomID,
		UserID: userObjID,
		Conn:   conn,
	}
	// 1. Try Redis first
	redisHistory, err := redis.GetRecentMessages(roomID, 50)
	if err == nil && len(redisHistory) > 0 {
		for _, msg := range redisHistory {
			event := ChatEvent{
				EventType: "history",
				Payload:   msg,
			}
			eventJSON, _ := json.Marshal(event)
			_ = conn.WriteMessage(websocket.TextMessage, eventJSON)
		}
	} else {
		// 2. Fallback to Mongo if Redis fails
		log.Println("[REDIS] History not available, fallback to MongoDB")
		mongoHistory, err := h.service.GetChatHistoryByRoom(ctx, roomID, 50)
		if err == nil && len(mongoHistory) > 0 {
			for _, msg := range mongoHistory {
				event := ChatEvent{
					EventType: "history",
					Payload:   msg,
				}
				eventJSON, _ := json.Marshal(event)
				_ = conn.WriteMessage(websocket.TextMessage, eventJSON)
			}
		}
	}

	model.RegisterClient(client)
	log.Printf("[WS] User %s (%s) connected to room %s", userID, username, roomID)

	defer func() {
		model.UnregisterClient(client)
		log.Printf("[WS] User %s disconnected from room %s", userID, roomID)
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("[WS] Read error:", err)
			break
		}

		messageText := strings.TrimSpace(string(msg))

		if strings.HasPrefix(messageText, "/reply") {
			parts := strings.SplitN(messageText, " ", 3)
			if len(parts) < 3 {
				conn.WriteMessage(websocket.TextMessage, []byte("Invalid reply format. Use: /reply <messageId> <message>"))
				continue
			}

			replyToIDHex := parts[1]
			messageBody := parts[2]

			replyToID, err := primitive.ObjectIDFromHex(replyToIDHex)
			if err != nil {
				conn.WriteMessage(websocket.TextMessage, []byte("Invalid message ID for reply"))
				continue
			}

			filteredMessage := utils.FilterProfanity(messageBody)
			mentions := extractMentions(filteredMessage)

			replyPayload := map[string]interface{}{
				"userId":    userID,
				"message":   filteredMessage,
				"replyToId": replyToID.Hex(),
				"mentions":  mentions,
			}

			event := ChatEvent{
				EventType: "reply",
				Payload:   replyPayload,
			}

			eventJSON, _ := json.Marshal(event)
			model.BroadcastMessage(model.BroadcastObject{
				MSG:  string(eventJSON),
				FROM: client,
			})
			continue
		}

		if strings.HasPrefix(messageText, "/react") {
			parts := strings.Split(messageText, " ")
			if len(parts) == 3 {
				messageID := parts[1]
				reaction := parts[2]
				msgID, _ := primitive.ObjectIDFromHex(messageID)
				_ = h.service.SaveReaction(ctx, &model.MessageReaction{
					MessageID: msgID,
					UserID:    userObjID,
					Reaction:  reaction,
					Timestamp: time.Now(),
				})
				h.SendMessageReaction(roomID, userID, messageID, reaction)
				continue
			}
		}

		if messageText == "/leave" {
			if err := h.memberService.RemoveUserFromRoom(ctx, roomObjID, userID); err != nil {
				log.Printf("[ERROR] Failed to remove user %s from room %s: %v", userID, roomID, err)
			}
			model.UnregisterClient(client)
			conn.WriteMessage(websocket.TextMessage, []byte("You have left the room"))
			conn.Close()
			return
		}

		filteredMessage := utils.FilterProfanity(messageText)
		mentions := extractMentions(filteredMessage)

		// Only broadcast to model.BroadcastMessage for text messages
		model.BroadcastMessage(model.BroadcastObject{
			MSG:  filteredMessage,
			FROM: client,
		})

		for _, mention := range mentions {
			h.broadcastEvent(roomID, "mention", MentionPayload{
				Mentioned: mention,
				From:      userID,
				Message:   filteredMessage,
			})
		}

	}
}

func extractMentions(message string) []string {
	words := strings.Fields(message)
	var mentions []string
	for _, word := range words {
		if strings.HasPrefix(word, "@") && len(word) > 1 {
			mentions = append(mentions, strings.TrimPrefix(word, "@"))
		}
	}
	return mentions
}

type ChatEvent struct {
	EventType string      `json:"eventType"`
	Payload   interface{} `json:"payload"`
}

func (h *ChatHTTPHandler) broadcastEvent(roomID, eventType string, data interface{}) {
	event := ChatEvent{
		EventType: eventType,
		Payload:   data,
	}

	var userID string
	switch v := data.(type) {
	case MentionPayload:
		userID = v.From
	case map[string]string:
		if uid, ok := v["userId"]; ok {
			userID = uid
		} else if from, ok := v["from"]; ok {
			userID = from
		}
	case model.BroadcastObject:
		if v.FROM.UserID != primitive.NilObjectID {
			userID = v.FROM.UserID.Hex()
		}
	case ChatEvent:
		if payload, ok := v.Payload.(map[string]interface{}); ok {
			if uid, ok := payload["userId"].(string); ok {
				userID = uid
			}
		}
	}

	eventJSON, err := json.Marshal(event)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal %s event: %v", eventType, err)
		return
	}

	// Send to all clients with optional sender inclusion
	for uid, conn := range model.Clients[roomID] {
		if conn == nil {
			continue
		}

		// Logic to skip self for typing/read/text, but allow for sticker/file
		skipSelf := map[string]bool{
			"read_receipt":     true,
			"message_reaction": true,
			"message":          true,
		}

		if uid == userID && skipSelf[eventType] {
			continue
		}

		err := conn.WriteMessage(websocket.TextMessage, eventJSON)
		if err != nil {
			log.Printf("[WS ERROR] Failed to send %s to user %s: %v", eventType, uid, err)
			conn.Close()
			delete(model.Clients[roomID], uid)
		}
	}

	log.Printf("[BROADCAST] Event %s from %s in room %s", eventType, userID, roomID)
}

// Send Message Reaction
func (h *ChatHTTPHandler) SendMessageReaction(roomID, userID, messageID, reaction string) {
	messageReaction := map[string]string{
		"userId":    userID,
		"roomId":    roomID,
		"messageId": messageID,
		"reaction":  reaction,
	}

	h.broadcastEvent(roomID, "message_reaction", messageReaction)
}

func (h *ChatHTTPHandler) SendSticker(c *fiber.Ctx) error {
	roomIdStr := c.Params("roomId")
	userID := c.Query("userId")

	stickerID := c.Query("stickerId")
	if stickerID == "" || userID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "stickerId and userId are required"})
	}

	stickerObjID, err := primitive.ObjectIDFromHex(stickerID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid sticker ID"})
	}

	sticker, err := h.stickerService.GetSticker(c.Context(), stickerObjID)
	if err != nil || sticker == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sticker not found"})
	}

	// Save to chat DB
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid user ID"})
	}
	msg := &model.ChatMessage{
		RoomID:    roomIdStr,
		UserID:    userObjID,
		StickerID: &sticker.ID,
		Image:     sticker.Image,
		Timestamp: time.Now(),
	}

	// Convert to KafkaMessage format and send to chat-message-{roomID} topic
	kafkaMsg := msg.ToKafkaMessage()
	jsonData, err := json.Marshal(kafkaMsg)
	if err == nil {
		if err := h.publisher.SendMessage(msg.RoomID, userID, string(jsonData)); err != nil {
			log.Printf("[Kafka] Failed to send sticker message to chat-message-%s: %v", msg.RoomID, err)
		}
	} else {
		log.Printf("[Kafka] Failed to marshal sticker payload: %v", err)
	}

	// Broadcast to online users
	h.broadcastEvent(roomIdStr, "sticker", map[string]string{
		"userId":    userID,
		"sticker":   sticker.Image,
		"stickerId": sticker.ID.Hex(),
	})

	// After broadcasting sticker, notify offline users
	stickerRoomObjID, err := primitive.ObjectIDFromHex(roomIdStr)
	if err == nil {
		members, err := h.memberService.GetRoomMembers(c.Context(), stickerRoomObjID)
		if err == nil {
			for _, member := range members {
				memberID := member.Hex()
				if memberID == userID {
					continue // Don't notify sender
				}
				isOnline := false
				if conns, exists := model.Clients[roomIdStr]; exists {
					if conn, exists := conns[memberID]; exists && conn != nil {
						isOnline = true
					}
				}
				if !isOnline {
					h.service.NotifyOfflineUser(memberID, roomIdStr, userID, "sent a sticker", "sticker")
				}
			}
		}
	}

	return c.JSON(msg)
}

// Join Room
func (h *ChatHTTPHandler) JoinRoom(c *fiber.Ctx) error {
	roomIdStr := c.Params("roomId")
	userID := c.Params("userId")

	log.Printf("[JOIN] Attempting to join room %s with user %s", roomIdStr, userID)

	roomID, err := primitive.ObjectIDFromHex(roomIdStr)
	if err != nil {
		log.Printf("[JOIN] Invalid room ID format: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	// Check if room exists
	room, err := h.roomService.GetRoom(c.Context(), roomID)
	if err != nil {
		log.Printf("[JOIN] Error checking room existence: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to check room existence",
		})
	}
	if room == nil {
		log.Printf("[JOIN] Room %s not found", roomIdStr)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "room not found",
		})
	}
	log.Printf("[JOIN] Room %s exists with capacity %d", roomIdStr, room.Capacity)

	// Check if user is already a member
	isMember, err := h.memberService.IsUserInRoom(c.Context(), roomID, userID)
	if err != nil {
		log.Printf("[JOIN] Error checking if user is already a member: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to check membership status",
		})
	}
	if isMember {
		log.Printf("[JOIN] User %s is already a member of room %s", userID, roomIdStr)
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "already a member of the room",
		})
	}

	// Check room capacity
	memberCount, err := h.memberService.GetRoomMembers(context.Background(), roomID)
	if err != nil {
		log.Printf("[JOIN] Error getting member count for room %s: %v", roomIdStr, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to check room capacity",
		})
	}
	log.Printf("[JOIN] Room %s has %d members (capacity: %d)", roomIdStr, len(memberCount), room.Capacity)

	if len(memberCount) >= room.Capacity {
		log.Printf("[JOIN] Room %s is full (%d/%d members)", roomIdStr, len(memberCount), room.Capacity)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "room is full",
		})
	}

	// Add User to Room
	if err := h.memberService.AddUserToRoom(context.Background(), roomID, userID); err != nil {
		log.Printf("[JOIN] Failed to add user %s to room %s: %v", userID, roomIdStr, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to join room",
		})
	}

	log.Printf("[JOIN] Successfully added user %s to room %s", userID, roomIdStr)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "joined room",
	})
}

// Leave Room
func (h *ChatHTTPHandler) LeaveRoom(c *fiber.Ctx) error {
	roomIdStr := c.Params("roomId")
	userID := c.Params("userId")

	roomID, err := primitive.ObjectIDFromHex(roomIdStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	if err := h.memberService.RemoveUserFromRoom(context.Background(), roomID, userID); err != nil {
		log.Printf("[ERROR] Failed to remove user %s from room %s: %v", userID, roomID.Hex(), err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to leave room",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "left room",
	})
}

func (h *ChatHTTPHandler) UploadFile(c *fiber.Ctx) error {
	roomId := c.FormValue("roomId")
	userId := c.FormValue("userId")

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "file is required"})
	}

	// Validate allowed types (image/pdf/etc.)
	ext := filepath.Ext(file.Filename)
	allowed := map[string]string{
		".jpg":  "image",
		".jpeg": "image",
		".png":  "image",
		".pdf":  "pdf",
	}
	fileType, ok := allowed[strings.ToLower(ext)]
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "unsupported file type"})
	}

	// Save file
	filename := fmt.Sprintf("%s_%s", time.Now().Format("20060102150405"), file.Filename)
	savePath := fmt.Sprintf("./uploads/%s", filename)
	publicURL := fmt.Sprintf("http://localhost:1334/uploads/%s", filename)
	if err := c.SaveFile(file, savePath); err != nil {
		log.Printf("[UPLOAD ERROR] Failed to save file: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "upload failed"})
	}

	// Save message with file reference
	userObjID, err := primitive.ObjectIDFromHex(userId)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid user ID"})
	}
	msg := &model.ChatMessage{
		RoomID:    roomId,
		UserID:    userObjID,
		FileURL:   publicURL,
		FileName:  file.Filename,
		FileType:  fileType,
		Timestamp: time.Now(),
	}

	// Convert to KafkaMessage format and send to chat-message-{roomID} topic
	kafkaMsg := msg.ToKafkaMessage()
	jsonData, err := json.Marshal(kafkaMsg)
	if err == nil {
		if err := h.publisher.SendMessage(msg.RoomID, userId, string(jsonData)); err != nil {
			log.Printf("[Kafka] Failed to send file message to chat-message-%s: %v", msg.RoomID, err)
		}
	} else {
		log.Printf("[Kafka] Failed to marshal file payload: %v", err)
	}

	// Broadcast to online users
	h.broadcastEvent(roomId, "file", map[string]string{
		"userId":   userId,
		"fileName": msg.FileName,
		"fileURL":  msg.FileURL,
		"fileType": msg.FileType,
	})

	// After broadcasting file, notify offline users
	fileRoomObjID, err := primitive.ObjectIDFromHex(roomId)
	if err == nil {
		members, err := h.memberService.GetRoomMembers(c.Context(), fileRoomObjID)
		if err == nil {
			for _, member := range members {
				memberID := member.Hex()
				if memberID == userId {
					continue // Don't notify sender
				}
				isOnline := false
				if conns, exists := model.Clients[roomId]; exists {
					if conn, exists := conns[memberID]; exists && conn != nil {
						isOnline = true
					}
				}
				if !isOnline {
					h.service.NotifyOfflineUser(memberID, roomId, userId, fmt.Sprintf("sent a file: %s", msg.FileName), "file")
				}
			}
		}
	}

	return c.Status(fiber.StatusOK).JSON(msg)
}

// ClearRoomCache clears all cached messages for a room from Redis
func (h *ChatHTTPHandler) ClearRoomCache(c *fiber.Ctx) error {
	roomIdStr := c.Params("roomId")

	log.Printf("[CACHE] Attempting to clear cache for room %s", roomIdStr)

	if err := redis.ClearRoomCache(roomIdStr); err != nil {
		log.Printf("[CACHE] Failed to clear cache for room %s: %v", roomIdStr, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to clear room cache",
		})
	}

	log.Printf("[CACHE] Successfully cleared cache for room %s", roomIdStr)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "room cache cleared successfully",
	})
}
