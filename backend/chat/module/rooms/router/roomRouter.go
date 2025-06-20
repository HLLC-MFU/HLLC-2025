package router

import (
	ChatHTTPHandler "github.com/HLLC-MFU/HLLC-2025/backend/module/chats/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/handler"
	StickerHTTPHandler "github.com/HLLC-MFU/HLLC-2025/backend/module/stickers/handler"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoomRoutes(router fiber.Router, h *handler.RoomHTTPHandler, s *StickerHTTPHandler.StickerHTTPHandler, c *ChatHTTPHandler.ChatHTTPHandler) {
	router.Get("/with-members", h.ListRoomMembers)
	router.Post("/", h.CreateRoom)
	router.Get("/:id", h.GetRoom)
	router.Get("/", h.ListRooms)
	router.Patch("/:id", h.UpdateRoom)
	router.Delete("/:id", h.DeleteRoom)
	router.Post("/upload", c.UploadFile)
	router.Post("/:roomId/stickers", c.SendSticker)
	// Member Management
	router.Get("/:roomId/members", h.GetRoomMembers)
	router.Get("/:userId/members", h.ListMemberRooms)
	router.Post("/:roomId/:userId/join", c.JoinRoom)
	router.Post("/:roomId/school/:schoolId/join", h.JoinRoomByGroup)
	router.Post("/:roomId/major/:majorId/join", h.JoinRoomByGroup)
	router.Post("/:roomId/:userId/leave", c.LeaveRoom)

	// Cache Management
	router.Delete("/:roomId/cache", c.ClearRoomCache)
}
