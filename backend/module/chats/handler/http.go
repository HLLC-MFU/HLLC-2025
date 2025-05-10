package handler

import (
	"context"
	"log"
	"strconv"
	"strings"

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

// ก่อน: เป็น function ธรรมดา
// func HandleWebSocket(chatService service.Service) func(c *websocket.Conn) {

// handler/http.go
// handler/http.go

// func (h *HTTPHandler) HandleWebSocket() func(c *websocket.Conn) {
// 	return func(c *websocket.Conn) {
// 		roomIdStr := c.Params("roomId")
// 		userId := c.Params("userId")

// 		if roomIdStr == "" || userId == "" {
// 			log.Println("[WS] Missing roomId or userId")
// 			c.WriteMessage(websocket.TextMessage, []byte("Missing roomId or userId"))
// 			c.Close()
// 			return
// 		}

// 		// เช็คว่าผู้ใช้อยู่ใน Redis ไหม
// 		isMember, err := redis.IsUserInRoom(roomIdStr, userId)
// 		if err != nil {
// 			log.Printf("[REDIS] Failed to check if user is in room: %v", err)
// 			c.WriteMessage(websocket.TextMessage, []byte("Internal server error"))
// 			c.Close()
// 			return
// 		}

// 		if !isMember {
// 			log.Printf("[WS] User %s is not a member of room %s", userId, roomIdStr)
// 			c.WriteMessage(websocket.TextMessage, []byte("You are not a member of this room"))
// 			c.Close()
// 			return
// 		}

// 		client := model.ClientObject{
// 			RoomID: roomIdStr,
// 			UserID: userId,
// 			Conn:   c,
// 		}

// 		// Register client in memory
// 		model.RegisterClient(client)
// 		log.Printf("[WS] User %s connected to room %s", userId, roomIdStr)

// 		defer func() {
// 			// ✅ ไม่ลบออกจาก Redis อัตโนมัติ
// 			model.UnregisterClient(client)
// 			log.Printf("[WS] User %s disconnected from room %s", userId, roomIdStr)
// 		}()

// 		for {
// 			_, msg, err := c.ReadMessage()
// 			if err != nil {
// 				log.Println("[WS] Read error:", err)
// 				break
// 			}

// 			// Handle leave command
// 			if string(msg) == "/leave" {
// 				// ✅ ออกห้องอย่างเป็นทางการ
// 				redis.RemoveUserFromRoom(roomIdStr, userId)
// 				model.UnregisterClient(client)
// 				c.WriteMessage(websocket.TextMessage, []byte("You have left the room"))
// 				c.Close()
// 				return
// 			}

// 			model.BroadcastMessage(model.BroadcastObject{
// 				MSG:  string(msg),
// 				FROM: client,
// 			})
// 		}
// 	}
// }

func (h *HTTPHandler) HandleWebSocket() func(c *websocket.Conn) {
	return func(c *websocket.Conn) {
		roomIdStr := c.Params("roomId")
		userID := c.Params("userId") // ✅ ใช้ userID แทน userId

		if roomIdStr == "" || userID == "" {
			log.Println("[WS] Missing roomId or userId")
			c.WriteMessage(websocket.TextMessage, []byte("Missing roomId or userId"))
			c.Close()
			return
		}

		// ✅ Create a new background context for MongoDB query
		ctx := context.Background()

		// ✅ Use MemberService instead of direct Redis call
		roomID, err := primitive.ObjectIDFromHex(roomIdStr)
		if err != nil {
			c.WriteMessage(websocket.TextMessage, []byte("Invalid room ID"))
			c.Close()
			return
		}

		isMember, err := h.memberService.IsUserInRoom(ctx, roomID, userID)
		if err != nil {
			log.Printf("[ERROR] Failed to check if user is in room: %v", err)
			c.WriteMessage(websocket.TextMessage, []byte("Internal server error"))
			c.Close()
			return
		}

		if !isMember {
			log.Printf("[WS] User %s is not a member of room %s", userID, roomIdStr)
			c.WriteMessage(websocket.TextMessage, []byte("You are not a member of this room"))
			c.Close()
			return
		}

		client := model.ClientObject{
			RoomID: roomIdStr,
			UserID: userID,
			Conn:   c,
		}

		// ✅ ส่ง Chat History กลับไปเมื่อผู้ใช้เชื่อมต่อ
		history, err := h.service.GetChatHistoryByRoom(ctx, roomIdStr, 50)
		if err == nil && len(history) > 0 {
			for _, msg := range history {
				_ = c.WriteMessage(websocket.TextMessage, []byte(msg.UserID+": "+msg.Message))
			}
		}

		// Register client in memory
		model.RegisterClient(client)
		log.Printf("[WS] User %s connected to room %s", userID, roomIdStr)

		defer func() {
			model.UnregisterClient(client)
			log.Printf("[WS] User %s disconnected from room %s", userID, roomIdStr)
		}()

		for {
			_, msg, err := c.ReadMessage()
			if err != nil {
				log.Println("[WS] Read error:", err)
				break
			}

			messageText := strings.TrimSpace(string(msg))

			// Handle leave command
			if messageText == "/leave" {
				if err := h.memberService.RemoveUserFromRoom(ctx, roomID, userID); err != nil {
					log.Printf("[ERROR] Failed to remove user %s from room %s: %v", userID, roomIdStr, err)
				}
				model.UnregisterClient(client)
				c.WriteMessage(websocket.TextMessage, []byte("You have left the room"))
				c.Close()
				return
			}

			// ✅ Apply Profanity Filter
			filteredMessage := utils.FilterProfanity(messageText)

			// Broadcast the filtered message
			model.BroadcastMessage(model.BroadcastObject{
				MSG:  filteredMessage,
				FROM: client,
			})
		}
	}
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
