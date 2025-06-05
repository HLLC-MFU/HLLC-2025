package handler

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	MemberService "github.com/HLLC-MFU/HLLC-2025/backend/module/members/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/kafka"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/redis"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/service"
	stickerService "github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/service"
	userService "github.com/HLLC-MFU/HLLC-2025/backend/module/users/service"

	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RoomHTTPHandler struct {
	service        service.RoomService
	memberService  MemberService.MemberService
	publisher      kafka.Publisher
	stickerService stickerService.StickerService
	userService    userService.UserService
}

func NewHTTPHandler(service service.RoomService,
	memberService MemberService.MemberService,
	publisher kafka.Publisher,
	stickerService stickerService.StickerService,
	userService userService.UserService) *RoomHTTPHandler {
	return &RoomHTTPHandler{
		service:        service,
		memberService:  memberService,
		publisher:      publisher,
		stickerService: stickerService,
		userService:    userService,
	}
}

type createRoomRequest struct {
	Name struct {
		ThName string `json:"thName"`
		EnName string `json:"enName"`
	} `json:"name"`
	Capacity int `json:"capacity"`
}

// when create add creator to member first
func (h *RoomHTTPHandler) CreateRoom(c *fiber.Ctx) error {
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
		imagePath = fileName
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

// handle Member
func (h *RoomHTTPHandler) GetRoomMembers(c *fiber.Ctx) error {
	roomId := c.Params("roomId")

	roomID, err := primitive.ObjectIDFromHex(roomId)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	// ดึง RoomMember document
	userIDs, err := h.memberService.GetRoomMembers(context.Background(), roomID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get room members",
		})
	}

	var users []fiber.Map

	for _, userID := range userIDs {
		user, err := h.userService.GetById(c.Context(), userID)
		if err != nil || user == nil {
			continue
		}

		users = append(users, fiber.Map{
			"user_id": userID.Hex(),
			"user":    user,
		})
	}

	return c.JSON(fiber.Map{
		"room_id": roomID.Hex(),
		"members": users,
	})

}

func (h *RoomHTTPHandler) GetRoom(c *fiber.Ctx) error {
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

	creator, err := h.userService.GetById(c.Context(), room.Creator)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get creator",
		})
	}

	return c.JSON(fiber.Map{
		"created_at": room.CreatedAt,
		"updated_at": room.UpdatedAt,
		"id":         room.ID.Hex(),
		"name":       room.Name,
		"capacity":   room.Capacity,
		"image":      room.Image,
		"creator_id": room.Creator.Hex(),
		"creator":    creator,
	})
}

func (h *RoomHTTPHandler) ListRooms(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)

	rooms, total, err := h.service.ListRooms(c.Context(), page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Populate creator object
	var result []map[string]interface{}
	for _, room := range rooms {
		creator, err := h.userService.GetById(c.Context(), room.Creator)
		if err != nil {
			creator = nil
		}
		result = append(result, map[string]interface{}{
			"created_at": room.CreatedAt,
			"updated_at": room.UpdatedAt,
			"id":         room.ID.Hex(),
			"name":       room.Name,
			"capacity":   room.Capacity,
			"image":      room.Image,
			"creator_id": room.Creator.Hex(),
			"creator":    creator,
		})
	}

	return c.JSON(fiber.Map{
		"rooms": result,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *RoomHTTPHandler) UpdateRoom(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid room ID"})
	}

	room, err := h.service.GetRoom(c.Context(), id)
	if err != nil || room == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "room not found"})
	}

	thName := c.FormValue("name[th]")
	enName := c.FormValue("name[en]")
	capacityStr := c.FormValue("capacity")
	capacity, _ := strconv.Atoi(capacityStr)

	imagePath := room.Image
	file, err := c.FormFile("image")
	if err == nil && file != nil {
		_ = os.MkdirAll("./uploads/rooms", os.ModePerm)
		fileName := fmt.Sprintf("%s_%s", id.Hex(), file.Filename)
		savePath := fmt.Sprintf("./uploads/rooms/%s", fileName)
		if err := c.SaveFile(file, savePath); err == nil {
			imagePath = fileName
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

func (h *RoomHTTPHandler) DeleteRoom(c *fiber.Ctx) error {
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

func (h *RoomHTTPHandler) ListRoomMembers(c *fiber.Ctx) error {
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
