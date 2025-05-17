package handler

import (
	"context"
	"encoding/json"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/kafka"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/redis"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/utils"
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

	roomIdStr := conn.Params("roomId")
	if roomIdStr == "" || userID == "" {
		log.Println("[WS] Missing roomId or userId")
		conn.WriteMessage(websocket.TextMessage, []byte("Missing roomId or userId"))
		conn.Close()
		return
	}

	ctx := context.Background()
	roomObjID, err := primitive.ObjectIDFromHex(roomIdStr)
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
		log.Printf("[WS] User %s is not a member of room %s", userID, roomIdStr)
		conn.WriteMessage(websocket.TextMessage, []byte("You are not a member of this room"))
		conn.Close()
		return
	}

	client := model.ClientObject{
		RoomID: roomIdStr,
		UserID: userID,
		Conn:   conn,
	}

	history, err := h.service.GetChatHistoryByRoom(ctx, roomIdStr, 50)
	if err == nil && len(history) > 0 {
		for _, msg := range history {
			_ = conn.WriteMessage(websocket.TextMessage, []byte(msg.UserID+": "+msg.Message))
		}
	}

	model.RegisterClient(client)
	log.Printf("[WS] User %s (%s) connected to room %s", userID, username, roomIdStr)

	defer func() {
		model.UnregisterClient(client)
		log.Printf("[WS] User %s disconnected from room %s", userID, roomIdStr)
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

		// Reply Message Handler
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

			model.BroadcastMessage(model.BroadcastObject{
				MSG:  filteredMessage,
				FROM: client,
			})

			_ = h.service.SaveChatMessage(ctx, &model.ChatMessage{
				RoomID:    roomIdStr,
				UserID:    userID,
				Message:   filteredMessage,
				Mentions:  mentions,
				ReplyToID: &replyToID,
				Timestamp: time.Now(),
			})

			// Optional: You can also broadcast a `reply` event
			continue
		}

		// Typing Event
		if strings.HasPrefix(messageText, "/typing") {
			if time.Since(typingTimers[userID]) > typingTimeout {
				typingEvent := TypingEvent{UserID: userID, RoomID: roomIdStr, Typing: true}
				h.broadcastTypingEvent(roomIdStr, typingEvent)
				typingTimers[userID] = time.Now()

				go func(userID, roomIdStr string) {
					time.Sleep(typingTimeout)
					h.broadcastTypingEvent(roomIdStr, TypingEvent{UserID: userID, RoomID: roomIdStr, Typing: false})
				}(userID, roomIdStr)
			}
			continue
		}

		// Read receipt
		if strings.HasPrefix(messageText, "/read") {
			parts := strings.Split(messageText, " ")
			if len(parts) == 2 {
				messageID := parts[1]
				h.SendReadReceipt(roomIdStr, userID, messageID)
				continue
			}
		}

		// Reactions
		if strings.HasPrefix(messageText, "/react") {
			parts := strings.Split(messageText, " ")
			if len(parts) == 3 {
				messageID := parts[1]
				reaction := parts[2]
				h.SendMessageReaction(roomIdStr, userID, messageID, reaction)
				continue
			}
		}

		// Leave command
		if messageText == "/leave" {
			if err := h.memberService.RemoveUserFromRoom(ctx, roomObjID, userID); err != nil {
				log.Printf("[ERROR] Failed to remove user %s from room %s: %v", userID, roomIdStr, err)
			}
			model.UnregisterClient(client)
			conn.WriteMessage(websocket.TextMessage, []byte("You have left the room"))
			conn.Close()
			return
		}

		// Normal message
		filteredMessage := utils.FilterProfanity(messageText)
		mentions := extractMentions(filteredMessage)

		model.BroadcastMessage(model.BroadcastObject{
			MSG:  filteredMessage,
			FROM: client,
		})

		for _, mention := range mentions {
			h.broadcastEvent(roomIdStr, "mention", MentionPayload{
				Mentioned: mention,
				From:      userID,
				Message:   filteredMessage,
			})
		}

		// Save normal message
		_ = h.service.SaveChatMessage(ctx, &model.ChatMessage{
			RoomID:    roomIdStr,
			UserID:    userID,
			Message:   filteredMessage,
			Mentions:  mentions,
			Timestamp: time.Now(),
		})
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

	// Extract the userId from the data if available
	var userID string
	switch v := data.(type) {
	case MentionPayload:
		userID = v.From
	case map[string]string:
		userID = v["from"]
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

	model.BroadcastMessage(model.BroadcastObject{
		MSG: string(eventJSON),
		FROM: model.ClientObject{
			RoomID: roomID,
			UserID: userID,
		},
	})

	log.Printf("[BROADCAST] Message from %s in room %s: %s", userID, roomID, string(eventJSON))
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

type HTTPHandler struct {
	service       service.Service
	memberService service.MemberService
	publisher     kafka.Publisher
}

func NewHTTPHandler(service service.Service, memberService service.MemberService, publisher kafka.Publisher) *HTTPHandler {
	return &HTTPHandler{
		service:       service,
		memberService: memberService,
		publisher:     publisher,
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
	router.Post("/", h.CreateRoom)
	router.Get("/:id", h.GetRoom)
	router.Get("/", h.ListRooms)
	router.Put("/:id", h.UpdateRoom)
	router.Delete("/:id", h.DeleteRoom)

	// ✅ Member Management
	router.Get("/:roomId/members", h.GetRoomMembers)
	router.Post("/:roomId/:userId/join", h.JoinRoom)
	router.Post("/:roomId/:userId/leave", h.LeaveRoom)
}

// ✅ เมื่อสร้างห้อง เพิ่มผู้สร้างเป็นสมาชิกห้อง
func (h *HTTPHandler) CreateRoom(c *fiber.Ctx) error {
	var req createRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	room := &model.Room{
		ID: primitive.NewObjectID(),
		Name: coreModel.LocalizedName{
			ThName: req.Name.ThName,
			EnName: req.Name.EnName,
		},
		Capacity: req.Capacity,
	}

	if err := h.service.CreateRoom(c.Context(), room); err != nil {
		if err == service.ErrRoomAlreadyExists {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// ✅ เพิ่มผู้สร้างเป็นสมาชิกใน Redis และ MongoDB
	creatorID := c.Query("creator_id")
	if creatorID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "creator_id is required",
		})
	}

	// ✅ เพิ่มใน MongoDB
	if err := h.memberService.AddUserToRoom(c.Context(), room.ID, creatorID); err != nil {
		log.Printf("[MONGODB] Failed to add creator %s to room %s: %v", creatorID, room.ID.Hex(), err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to add creator to room",
		})
	}

	// ✅ เพิ่มใน Redis
	if err := redis.AddUserToRoom(room.ID.Hex(), creatorID); err != nil {
		log.Printf("[REDIS] Failed to add creator %s to room %s: %v", creatorID, room.ID.Hex(), err)
	}

	return c.Status(fiber.StatusCreated).JSON(room)
}

// ✅ เข้าห้อง (Join)
func (h *HTTPHandler) JoinRoom(c *fiber.Ctx) error {
	roomIdStr := c.Params("roomId")
	userID := c.Params("userId")

	roomID, err := primitive.ObjectIDFromHex(roomIdStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	// ✅ ตรวจสอบว่าห้องมีอยู่จริง
	room, err := h.service.GetRoom(c.Context(), roomID)
	if err != nil || room == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "room not found",
		})
	}

	// ✅ ตรวจสอบ Capacity ของห้อง
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

	// ✅ Add user to room
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

// ✅ ออกจากห้อง (Leave)
func (h *HTTPHandler) LeaveRoom(c *fiber.Ctx) error {
	roomIdStr := c.Params("roomId")
	userID := c.Params("userId") // ✅ ใช้ userID แทน userId

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

// ✅ ตรวจสอบสมาชิก
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
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	var req createRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	room := &model.Room{
		ID: id,
		Name: coreModel.LocalizedName{
			ThName: req.Name.ThName,
			EnName: req.Name.EnName,
		},
		Capacity: req.Capacity,
	}

	if err := h.service.UpdateRoom(c.Context(), room); err != nil {
		if err == service.ErrRoomNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		if err == service.ErrRoomAlreadyExists {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
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
