package handler

import (
	"context"
	"log"
	"strconv"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/kafka"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ก่อน: เป็น function ธรรมดา
// func HandleWebSocket(chatService service.Service) func(c *websocket.Conn) {

func (h *HTTPHandler) HandleWebSocket() func(c *websocket.Conn) {
	return func(c *websocket.Conn) {
		roomIdStr := c.Params("roomId")
		userId := c.Params("userId")

		roomId, err := primitive.ObjectIDFromHex(roomIdStr)
		if err != nil {
			log.Println("[WS] Invalid roomId:", roomIdStr)
			_ = c.WriteMessage(websocket.TextMessage, []byte("Invalid room ID"))
			c.Close()
			return
		}

		ctx := context.Background()
		room, err := h.service.GetRoom(ctx, roomId)
		if err != nil || room == nil {
			log.Printf("[WS] Room %s not found", roomId.Hex())
			_ = c.WriteMessage(websocket.TextMessage, []byte("Room not found"))
			c.Close()
			return
		}

		roomClients := model.Clients[roomId.Hex()]
		if roomClients != nil && len(roomClients) >= room.Capacity {
			log.Printf("[WS] Room %s is full. Capacity: %d", roomId.Hex(), room.Capacity)
			_ = c.WriteMessage(websocket.TextMessage, []byte("Room is full"))
			c.Close()
			return
		}

		client := model.ClientObject{
			RoomID: roomId.Hex(),
			UserID: userId,
			Conn:   c,
		}

		history, err := h.service.GetChatHistoryByRoom(context.Background(), roomId.Hex(), 10)
		if err == nil && len(history) > 0 {
			for _, msg := range history {
				_ = c.WriteMessage(websocket.TextMessage, []byte(msg.UserID+": "+msg.Message))
			}
		}

		model.RegisterClient(client)
		defer model.UnregisterClient(client)

		for {
			_, msg, err := c.ReadMessage()
			if err != nil {
				log.Println("[WS] read error:", err)
				break
			}

			model.BroadcastMessage(model.BroadcastObject{
				MSG:  string(msg),
				FROM: client,
			})

			// ✅ ตรงนี้ใช้ h.publisher ได้แล้ว
			err = h.publisher.SendMessage(client.RoomID, client.UserID, string(msg))
			if err != nil {
				log.Printf("[Kafka] Failed to publish message: %v", err)
			}
		}
	}
}


type HTTPHandler struct {
	service   service.Service
	publisher kafka.Publisher
}

func NewHTTPHandler(service service.Service, publisher kafka.Publisher) *HTTPHandler {
	return &HTTPHandler{
		service:   service,
		publisher: publisher,
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
}

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

	return c.Status(fiber.StatusCreated).JSON(room)
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
