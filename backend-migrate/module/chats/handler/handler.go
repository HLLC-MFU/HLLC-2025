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

	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/chats/kafka"
	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/chats/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Handler struct {
	service   service.Service
	publisher kafka.Publisher
}

func NewHandler(service service.Service, publisher kafka.Publisher) *Handler {
	return &Handler{
		service:   service,
		publisher: publisher,
	}
}

type ChatEvent struct {
	EventType string      `json:"eventType"`
	Payload   interface{} `json:"payload"`
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	router.Get("/with-members", h.ListRoomMembers)
	router.Post("/", h.CreateRoom)
	router.Get("/:id", h.GetRoom)
	router.Get("/", h.ListRooms)
	router.Patch("/:id", h.UpdateRoom)
	router.Delete("/:id", h.DeleteRoom)
	router.Post("/upload", h.UploadFile)
}

func (h *Handler) HandleWebSocket(c *websocket.Conn) {
	// Get connection parameters
	userID := c.Query("userId")
	roomID := c.Query("roomId")
	username := c.Query("username")

	if userID == "" || roomID == "" {
		log.Println("[WS] Missing roomID or userID")
		c.WriteMessage(websocket.TextMessage, []byte("Missing roomID or userID"))
		c.Close()
		return
	}

	_, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		c.WriteMessage(websocket.TextMessage, []byte("Invalid room ID"))
		c.Close()
		return
	}

	// Get chat history
	history, err := h.service.GetChatHistoryByRoom(context.Background(), roomID, 50)
	if err == nil && len(history) > 0 {
		for _, msg := range history {
			event := ChatEvent{
				EventType: "history",
				Payload:   msg,
			}
			eventJSON, _ := json.Marshal(event)
			_ = c.WriteMessage(websocket.TextMessage, eventJSON)
		}
	}

	// Register client
		_ = model.ClientObject{
		RoomID: roomID,
		UserID: userID,
		Conn:   c,
	}

	if model.Clients[roomID] == nil {
		model.Clients[roomID] = make(map[string]interface{})
	}
	model.Clients[roomID][userID] = c

	log.Printf("[WS] User %s (%s) connected to room %s", userID, username, roomID)

	defer func() {
		delete(model.Clients[roomID], userID)
		if len(model.Clients[roomID]) == 0 {
			delete(model.Clients, roomID)
		}
		log.Printf("[WS] User %s disconnected from room %s", userID, roomID)
	}()

	for {
		_, msg, err := c.ReadMessage()
		if err != nil {
			log.Println("[WS] Read error:", err)
			break
		}

		messageText := strings.TrimSpace(string(msg))

		if strings.HasPrefix(messageText, "/reply") {
			parts := strings.SplitN(messageText, " ", 3)
			if len(parts) < 3 {
				c.WriteMessage(websocket.TextMessage, []byte("Invalid reply format. Use: /reply <messageId> <message>"))
				continue
			}

			replyToIDHex := parts[1]
			messageBody := parts[2]

			replyToID, err := primitive.ObjectIDFromHex(replyToIDHex)
			if err != nil {
				c.WriteMessage(websocket.TextMessage, []byte("Invalid message ID for reply"))
				continue
			}

			replyPayload := map[string]interface{}{
				"userId":    userID,
				"message":   messageBody,
				"replyToId": replyToID.Hex(),
			}

			event := ChatEvent{
				EventType: "reply",
				Payload:   replyPayload,
			}

			eventJSON, _ := json.Marshal(event)
			h.broadcastToRoom(roomID, eventJSON)
			continue
		}

		// Save and broadcast regular message
		chatMsg := &model.ChatMessage{
			RoomID:    roomID,
			UserID:    userID,
			Message:   messageText,
			Timestamp: time.Now(),
		}

		if err := h.service.SaveChatMessage(context.Background(), chatMsg); err != nil {
			log.Printf("[ERROR] Failed to save message: %v", err)
			continue
		}

		event := ChatEvent{
			EventType: "message",
			Payload:   chatMsg,
		}

		eventJSON, _ := json.Marshal(event)
		h.broadcastToRoom(roomID, eventJSON)
	}
}

func (h *Handler) broadcastToRoom(roomID string, message []byte) {
	for userID, conn := range model.Clients[roomID] {
		if wsConn, ok := conn.(*websocket.Conn); ok {
			if err := wsConn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("[ERROR] Failed to send message to user %s: %v", userID, err)
				wsConn.Close()
				delete(model.Clients[roomID], userID)
			}
		}
	}
}

func (h *Handler) CreateRoom(c *fiber.Ctx) error {
	var room model.Room
	if err := c.BodyParser(&room); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	room.ID = primitive.NewObjectID()
	room.CreatedAt = time.Now()
	room.UpdatedAt = time.Now()

	if err := h.service.CreateRoom(c.Context(), &room); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(room)
}

func (h *Handler) GetRoom(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	room, err := h.service.GetRoom(c.Context(), id)
	if err == service.ErrRoomNotFound {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "room not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(room)
}

func (h *Handler) ListRooms(c *fiber.Ctx) error {
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

func (h *Handler) UpdateRoom(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	var room model.Room
	if err := c.BodyParser(&room); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	room.ID = id
	room.UpdatedAt = time.Now()

	if err := h.service.UpdateRoom(c.Context(), &room); err != nil {
		if err == service.ErrRoomNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "room not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(room)
}

func (h *Handler) DeleteRoom(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	if err := h.service.DeleteRoom(c.Context(), id); err != nil {
		if err == service.ErrRoomNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "room not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) UploadFile(c *fiber.Ctx) error {
	roomId := c.FormValue("roomId")
	userId := c.FormValue("userId")

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "file is required",
		})
	}

	ext := filepath.Ext(file.Filename)
	allowed := map[string]string{
		".jpg":  "image",
		".jpeg": "image",
		".png":  "image",
		".pdf":  "pdf",
	}

	fileType, ok := allowed[strings.ToLower(ext)]
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "unsupported file type",
		})
	}

	savePath := fmt.Sprintf("./uploads/%s_%s", time.Now().Format("20060102150405"), file.Filename)
	if err := c.SaveFile(file, savePath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to save file",
		})
	}

	msg := &model.ChatMessage{
		RoomID:    roomId,
		UserID:    userId,
		FileURL:   savePath,
		FileName:  file.Filename,
		FileType:  fileType,
		Timestamp: time.Now(),
	}

	if err := h.service.SaveChatMessage(c.Context(), msg); err != nil {
		os.Remove(savePath)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to save message",
		})
	}

	event := ChatEvent{
		EventType: "file",
		Payload:   msg,
	}

	eventJSON, _ := json.Marshal(event)
	h.broadcastToRoom(roomId, eventJSON)

	return c.Status(fiber.StatusOK).JSON(msg)
}

func (h *Handler) ListRoomMembers(c *fiber.Ctx) error {
	rooms, _, err := h.service.ListRooms(c.Context(), 1, 100)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	roomsWithMembers := make([]map[string]interface{}, 0)
	for _, room := range rooms {
		members := model.Clients[room.ID.Hex()]
		roomData := map[string]interface{}{
			"room":    room,
			"members": len(members),
		}
		roomsWithMembers = append(roomsWithMembers, roomData)
	}

	return c.JSON(fiber.Map{
		"rooms": roomsWithMembers,
	})
}