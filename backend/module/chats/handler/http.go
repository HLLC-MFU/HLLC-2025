package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/kafka"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/redis"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/utils"
	stickerService "github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/service"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TypingEvent struct {
	UserID string `json:"userId"`
	RoomID string `json:"roomId"`
	Typing bool   `json:"typing"`
}

type MentionPayload struct {
	Mentioned string `json:"mentioned"`
	From      string `json:"from"`
	Message   string `json:"message"`
}

func (h *HTTPHandler) HandleWebSocket(conn *websocket.Conn, userID, username, roomID string) {
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

	isMember, err := h.memberService.IsUserInRoom(ctx, roomObjID, userID)
	if err != nil {
		log.Printf("[ERROR] Failed to check if user is in room: %v", err)
		conn.WriteMessage(websocket.TextMessage, []byte("Internal server error"))
		conn.Close()
		return
	}

	if !isMember {
		log.Printf("[WS] User %s is not a member of room %s", userID, roomID)
		conn.WriteMessage(websocket.TextMessage, []byte("You are not a member of this room"))
		conn.Close()
		return
	}

	client := model.ClientObject{
		RoomID: roomID,
		UserID: userID,
		Conn:   conn,
	}

	history, err := h.service.GetChatHistoryByRoom(ctx, roomID, 50)
	if err == nil && len(history) > 0 {
		for _, msg := range history {
			event := ChatEvent{
				EventType: "history",
				Payload:   msg,
			}
			eventJSON, _ := json.Marshal(event)
			_ = conn.WriteMessage(websocket.TextMessage, eventJSON)
		}
	}

	model.RegisterClient(client)
	log.Printf("[WS] User %s (%s) connected to room %s", userID, username, roomID)

	defer func() {
		model.UnregisterClient(client)
		log.Printf("[WS] User %s disconnected from room %s", userID, roomID)
	}()

	typingTimers := make(map[string]time.Time)
	const typingTimeout = 5 * time.Second

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

		if strings.HasPrefix(messageText, "/typing") {
			if time.Since(typingTimers[userID]) > typingTimeout {
				typingEvent := TypingEvent{UserID: userID, RoomID: roomID, Typing: true}
				h.broadcastTypingEvent(roomID, typingEvent)
				typingTimers[userID] = time.Now()

				go func(userID, roomID string) {
					time.Sleep(typingTimeout)
					h.broadcastTypingEvent(roomID, TypingEvent{UserID: userID, RoomID: roomID, Typing: false})
				}(userID, roomID)
			}
			continue
		}

		if strings.HasPrefix(messageText, "/read") {
			parts := strings.Split(messageText, " ")
			if len(parts) == 2 {
				messageID := parts[1]
				msgID, _ := primitive.ObjectIDFromHex(messageID)
				_ = h.service.SaveReadReceipt(ctx, &model.MessageReadReceipt{
					MessageID: msgID,
					UserID:    userID,
					Timestamp: time.Now(),
				})
				h.SendReadReceipt(roomID, userID, messageID)
				continue
			}
		}

		if strings.HasPrefix(messageText, "/react") {
			parts := strings.Split(messageText, " ")
			if len(parts) == 3 {
				messageID := parts[1]
				reaction := parts[2]
				msgID, _ := primitive.ObjectIDFromHex(messageID)
				_ = h.service.SaveReaction(ctx, &model.MessageReaction{
					MessageID: msgID,
					UserID:    userID,
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

func (h *HTTPHandler) broadcastTypingEvent(roomID string, event TypingEvent) {
	h.broadcastEvent(roomID, "typing", event)
}

type ChatEvent struct {
	EventType string      `json:"eventType"`
	Payload   interface{} `json:"payload"`
}

func (h *HTTPHandler) broadcastEvent(roomID, eventType string, data interface{}) {
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
	case TypingEvent:
		userID = v.UserID
	case model.BroadcastObject:
		if v.FROM.UserID != "" {
			userID = v.FROM.UserID
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
			"typing":           true,
			"read_receipt":     true,
			"message_reaction": true,
			"text":             true, // custom if needed
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

func (h *HTTPHandler) SendReadReceipt(roomID, userID, messageID string) {
	readReceipt := map[string]string{
		"userId":    userID,
		"roomId":    roomID,
		"messageId": messageID,
		"status":    "read",
	}

	h.broadcastEvent(roomID, "read_receipt", readReceipt)
}

// Send Message Reaction
func (h *HTTPHandler) SendMessageReaction(roomID, userID, messageID, reaction string) {
	messageReaction := map[string]string{
		"userId":    userID,
		"roomId":    roomID,
		"messageId": messageID,
		"reaction":  reaction,
	}

	h.broadcastEvent(roomID, "message_reaction", messageReaction)
}

func (h *HTTPHandler) UploadFile(c *fiber.Ctx) error {
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
	savePath := fmt.Sprintf("./uploads/%s_%s", time.Now().Format("20060102150405"), file.Filename)
	if err := c.SaveFile(file, savePath); err != nil {
		log.Printf("[UPLOAD ERROR] Failed to save file: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "upload failed"})
	}

	// Save message with file reference
	msg := &model.ChatMessage{
		RoomID:    roomId,
		UserID:    userId,
		FileURL:   savePath,
		FileName:  file.Filename,
		FileType:  fileType,
		Timestamp: time.Now(),
	}

	if err := h.service.SaveChatMessage(c.Context(), msg); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save message"})
	}

	// Broadcast to all clients in the room
	model.BroadcastMessage(model.BroadcastObject{
		MSG: fmt.Sprintf("[file] %s", msg.FileName),
		FROM: model.ClientObject{
			RoomID: msg.RoomID,
			UserID: msg.UserID,
		},
	})

	// Optional: send rich event payload
	h.broadcastEvent(roomId, "file", map[string]string{
		"userId":   userId,
		"fileName": msg.FileName,
		"fileURL":  msg.FileURL,
		"fileType": msg.FileType,
	})

	return c.Status(fiber.StatusOK).JSON(msg)
}

type HTTPHandler struct {
	service        service.Service
	memberService  service.MemberService
	publisher      kafka.Publisher
	stickerService stickerService.StickerService
}

func NewHTTPHandler(service service.Service, memberService service.MemberService, publisher kafka.Publisher, stickerService stickerService.StickerService) *HTTPHandler {
	return &HTTPHandler{
		service:        service,
		memberService:  memberService,
		publisher:      publisher,
		stickerService: stickerService,
	}
}

type createRoomRequest struct {
	Name struct {
		ThName string `json:"thName"`
		EnName string `json:"enName"`
	} `json:"name"`
	Capacity int `json:"capacity"`
}

func (h *HTTPHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/with-members", h.ListRoomMembers)
	router.Post("/", h.CreateRoom)
	router.Get("/:id", h.GetRoom)
	router.Get("/", h.ListRooms)
	router.Patch("/:id", h.UpdateRoom)
	router.Delete("/:id", h.DeleteRoom)
	router.Post("/upload", h.UploadFile)
	router.Post("/:roomId/stickers", h.SendSticker)

	// Member Management
	router.Get("/:roomId/members", h.GetRoomMembers)
	router.Post("/:roomId/:userId/join", h.JoinRoom)
	router.Post("/:roomId/:userId/leave", h.LeaveRoom)
}

func (h *HTTPHandler) SendSticker(c *fiber.Ctx) error {
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
	msg := &model.ChatMessage{
		RoomID:    roomIdStr,
		UserID:    userID,
		StickerID: &sticker.ID,
		Image:     sticker.Image,
		Timestamp: time.Now(),
	}
	if err := h.service.SaveChatMessage(c.Context(), msg); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save sticker message"})
	}

	// Only broadcast once using structured event
	h.broadcastEvent(roomIdStr, "sticker", map[string]string{
		"userId":    userID,
		"sticker":   sticker.Image,
		"stickerId": sticker.ID.Hex(),
	})

	return c.JSON(msg)
}

// when create add creator to member first
func (h *HTTPHandler) CreateRoom(c *fiber.Ctx) error {
	th := c.FormValue("name[th]")
	en := c.FormValue("name[en]")
	capacityStr := c.FormValue("capacity")
	creatorID := c.FormValue("creator_id")

	if creatorID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "creator_id is required"})
	}

	creatorObjID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid creator_id"})
	}

	capacity, _ := strconv.Atoi(capacityStr)
	roomID := primitive.NewObjectID()
	imagePath := ""

	//Handle file upload
	file, err := c.FormFile("image")
	if err == nil && file != nil {
		_ = os.MkdirAll("./uploads/rooms", os.ModePerm)
		fileName := fmt.Sprintf("%s_%s", roomID.Hex(), file.Filename)
		savePath := fmt.Sprintf("./uploads/rooms/%s", fileName)
		if err := c.SaveFile(file, savePath); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to save image",
			})
		}
		imagePath = fmt.Sprintf("%s/uploads/rooms/%s", c.BaseURL(), fileName)
	}

	room := &model.Room{
		ID: roomID,
		Name: coreModel.LocalizedName{
			Th: th,
			En: en,
		},
		Capacity: capacity,
		Image:    imagePath,
		Creator:  creatorObjID,
	}

	if err := h.service.CreateRoom(c.Context(), room); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	_ = h.memberService.AddUserToRoom(c.Context(), room.ID, creatorID)
	_ = redis.AddUserToRoom(room.ID.Hex(), creatorID)

	return c.Status(fiber.StatusCreated).JSON(room)
}

// Join Room
func (h *HTTPHandler) JoinRoom(c *fiber.Ctx) error {
	roomIdStr := c.Params("roomId")
	userID := c.Params("userId")

	roomID, err := primitive.ObjectIDFromHex(roomIdStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	// handle Room avaliable
	room, err := h.service.GetRoom(c.Context(), roomID)
	if err != nil || room == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "room not found",
		})
	}

	// handle Capacity of room
	memberCount, err := h.memberService.GetRoomMembers(context.Background(), roomID)
	if err != nil {
		log.Printf("[ERROR] Failed to get member count for room %s: %v", roomID.Hex(), err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to check room capacity",
		})
	}

	if len(memberCount) >= room.Capacity {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "room is full",
		})
	}

	// Add User to Room
	if err := h.memberService.AddUserToRoom(context.Background(), roomID, userID); err != nil {
		log.Printf("[ERROR] Failed to add user %s to room %s: %v", userID, roomID.Hex(), err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to join room",
		})
	}

	log.Printf("[JOIN] User %s joined room %s", userID, roomID.Hex())
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "joined room",
	})
}

// Leave Room
func (h *HTTPHandler) LeaveRoom(c *fiber.Ctx) error {
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

// handle Member
func (h *HTTPHandler) GetRoomMembers(c *fiber.Ctx) error {
	roomIdStr := c.Params("roomId")

	roomID, err := primitive.ObjectIDFromHex(roomIdStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	members, err := h.memberService.GetRoomMembers(context.Background(), roomID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get room members",
		})
	}

	return c.JSON(fiber.Map{
		"members": members,
	})
}

func (h *HTTPHandler) GetRoom(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	room, err := h.service.GetRoom(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	if room == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "room not found ",
		})
	}
	return c.JSON(room)
}

func (h *HTTPHandler) ListRooms(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)

	rooms, total, err := h.service.ListRooms(c.Context(), page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"rooms": rooms,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *HTTPHandler) UpdateRoom(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid room ID"})
	}

	room, err := h.service.GetRoom(c.Context(), id)
	if err != nil || room == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "room not found"})
	}

	thName := c.FormValue("name[thName]")
	enName := c.FormValue("name[enName]")
	capacityStr := c.FormValue("capacity")
	capacity, _ := strconv.Atoi(capacityStr)

	imagePath := room.Image
	file, err := c.FormFile("image")
	if err == nil && file != nil {
		_ = os.MkdirAll("./uploads/rooms", os.ModePerm)
		fileName := fmt.Sprintf("%s_%s", id.Hex(), file.Filename)
		savePath := fmt.Sprintf("./uploads/rooms/%s", fileName)
		if err := c.SaveFile(file, savePath); err == nil {
			imagePath = fmt.Sprintf("%s/uploads/rooms/%s", c.BaseURL(), fileName)
		} else {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save image"})
		}
	}

	room.Name.Th = thName
	room.Name.En = enName
	room.Capacity = capacity
	room.Image = imagePath
	room.UpdatedAt = time.Now()

	if err := h.service.UpdateRoom(c.Context(), room); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(room)
}

func (h *HTTPHandler) DeleteRoom(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	if err := h.service.DeleteRoom(c.Context(), id); err != nil {
		if err == service.ErrRoomNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *HTTPHandler) ListRoomMembers(c *fiber.Ctx) error {
	roomMembers, err := h.service.ListRoomsWithMembers(c.Context(), h.memberService)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"rooms": roomMembers,
	})
}
