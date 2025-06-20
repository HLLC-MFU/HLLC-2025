// Package: controller/chat_controller.go
package controller

import (
	"chat/module/chat/model"
	chatService "chat/module/chat/service"
	roomModel "chat/module/room/model"
	stickerModel "chat/module/sticker/model"
	"chat/pkg/decorators"
	controllerHelper "chat/pkg/helpers/controller"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Service interfaces
type (
	MemberService interface {
		IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
		AddUserToRoom(ctx context.Context, roomID, userID string) error
		RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error
	}

	StickerService interface {
		GetStickerById(ctx context.Context, stickerID string) (*stickerModel.Sticker, error)
	}

	RoomService interface {
		GetRoomById(ctx context.Context, roomID primitive.ObjectID) (*roomModel.Room, error)
	}
)

type ChatController struct {
	*decorators.BaseController
	chatService    *chatService.ChatService
	memberService  MemberService
	stickerService StickerService
	roomService    RoomService
}

func NewChatController(
	app *fiber.App,
	chatService *chatService.ChatService,
	memberService MemberService,
	stickerService StickerService,
	roomService RoomService,
) *ChatController {
	controller := &ChatController{
		BaseController: decorators.NewBaseController(app, "/chat"),
		chatService:    chatService,
		memberService:  memberService,
		stickerService: stickerService,
		roomService:    roomService,
	}

	controller.setupRoutes()
	return controller
}

func (c *ChatController) setupRoutes() {
	// WebSocket routes
	c.Get("/ws/:roomId/:userId", c.handleWebSocketUpgrade)
	
	// File routes
	c.Post("/upload", c.handleFileUpload)
	
	// Room routes
	c.Post("/rooms/:roomId/join", c.handleJoinRoom)
	c.Post("/rooms/:roomId/leave", c.handleLeaveRoom)
	c.Post("/rooms/:roomId/sticker", c.handleSendSticker)
	c.Delete("/rooms/:roomId/cache", c.handleClearCache)

	c.SetupRoutes()
}

func (c *ChatController) handleWebSocketUpgrade(ctx *fiber.Ctx) error {
	if websocket.IsWebSocketUpgrade(ctx) {
		ctx.Locals("allowed", true)
		return ctx.Next()
	}
	return fiber.ErrUpgradeRequired
}

func (c *ChatController) handleWebSocket(conn *websocket.Conn) {
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

	// Check membership
	isMember, err := c.memberService.IsUserInRoom(ctx, roomObjID, userID)
	if err != nil || !isMember {
		conn.WriteMessage(websocket.TextMessage, []byte("Not a member of this room"))
		conn.Close()
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Invalid user ID"))
		conn.Close()
		return
	}

	client := model.ClientObject{
		RoomID: roomObjID,
		UserID: userObjID,
		Conn:   conn,
	}

	// Send chat history
	messages, err := c.chatService.GetChatHistoryByRoom(ctx, roomID, 50)
	if err == nil {
		for _, msg := range messages {
			event := model.ChatEvent{
				EventType: "history",
				Payload:   msg,
			}
			if data, err := json.Marshal(event); err == nil {
				conn.WriteMessage(websocket.TextMessage, data)
			}
		}
	}

	model.RegisterClient(client)
	defer model.UnregisterClient(client)

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}

		messageText := strings.TrimSpace(string(msg))

		// Handle different message types
		switch {
		case strings.HasPrefix(messageText, "/reply"):
			c.handleReplyMessage(messageText, client)
		case strings.HasPrefix(messageText, "/react"):
			c.handleReactionMessage(messageText, client)
		case messageText == "/leave":
			c.handleLeaveMessage(ctx, messageText, client)
			return
		default:
			c.handleTextMessage(messageText, client)
		}
	}
}

type FileUploadPayload struct {
	RoomID string `form:"roomId"`
	UserID string `form:"userId"`
}

func (c *ChatController) handleFileUpload(ctx *fiber.Ctx) error {
	var payload FileUploadPayload
	return controllerHelper.Handle(ctx, &payload, func() (any, error) {
		file, err := ctx.FormFile("file")
		if err != nil {
			return nil, fmt.Errorf("file is required")
		}

		// Validate file type
		ext := strings.ToLower(filepath.Ext(file.Filename))
		fileType := c.getFileType(ext)
		if fileType == "" {
			return nil, fmt.Errorf("unsupported file type")
		}

		// Save file
		filename := fmt.Sprintf("%s_%s", time.Now().Format("20060102150405"), file.Filename)
		savePath := fmt.Sprintf("./uploads/%s", filename)
		if err := ctx.SaveFile(file, savePath); err != nil {
			return nil, err
		}

		// Create message
		roomID, err := primitive.ObjectIDFromHex(payload.RoomID)
		if err != nil {
			return nil, fmt.Errorf("invalid room ID")
		}

		userID, err := primitive.ObjectIDFromHex(payload.UserID)
		if err != nil {
			return nil, fmt.Errorf("invalid user ID")
		}

		msg := &model.ChatMessage{
			RoomID:    roomID,
			UserID:    userID,
			FileURL:   filename,
			FileName:  file.Filename,
			FileType:  fileType,
			Timestamp: time.Now(),
		}

		if err := c.chatService.SaveMessage(ctx.Context(), msg); err != nil {
			return nil, err
		}

		return msg, nil
	})
}

func (c *ChatController) handleJoinRoom(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	userID := controllerHelper.GetUserID(ctx)

	if err := c.memberService.AddUserToRoom(ctx.Context(), roomID, userID.Hex()); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to join room",
		})
	}

	return ctx.JSON(fiber.Map{
		"message": "joined room successfully",
	})
}

func (c *ChatController) handleLeaveRoom(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	userID := controllerHelper.GetUserID(ctx)

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid room ID",
		})
	}

	if err := c.memberService.RemoveUserFromRoom(ctx.Context(), roomObjID, userID.Hex()); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to leave room",
		})
	}

	return ctx.JSON(fiber.Map{
		"message": "left room successfully",
	})
}

type StickerPayload struct {
	StickerID string `query:"stickerId"`
}

func (c *ChatController) handleSendSticker(ctx *fiber.Ctx) error {
	var payload StickerPayload
	return controllerHelper.Handle(ctx, &payload, func() (any, error) {
		roomID := ctx.Params("roomId")
		userID := controllerHelper.GetUserID(ctx)

		sticker, err := c.stickerService.GetStickerById(ctx.Context(), payload.StickerID)
		if err != nil {
			return nil, fmt.Errorf("sticker not found")
		}

		roomObjID, err := primitive.ObjectIDFromHex(roomID)
		if err != nil {
			return nil, fmt.Errorf("invalid room ID")
		}

		msg := &model.ChatMessage{
			RoomID:    roomObjID,
			UserID:    userID,
			StickerID: &sticker.ID,
			Image:     sticker.Image,
			Timestamp: time.Now(),
		}

		if err := c.chatService.SaveMessage(ctx.Context(), msg); err != nil {
			return nil, err
		}

		return msg, nil
	})
}

func (c *ChatController) handleClearCache(ctx *fiber.Ctx) error {
	roomID := ctx.Params("roomId")
	if err := c.chatService.DeleteRoomMessages(ctx.Context(), roomID); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to clear cache",
		})
	}
	return ctx.JSON(fiber.Map{
		"message": "cache cleared successfully",
	})
}

// Helper methods for WebSocket message handling
func (c *ChatController) handleReplyMessage(messageText string, client model.ClientObject) {
	parts := strings.SplitN(messageText, " ", 3)
	if len(parts) < 3 {
		return
	}

	replyToID, err := primitive.ObjectIDFromHex(parts[1])
	if err != nil {
		return
	}

	msg := &model.ChatMessage{
		RoomID:    client.RoomID,
		UserID:    client.UserID,
		Message:   parts[2],
		ReplyToID: &replyToID,
		Timestamp: time.Now(),
	}

	model.BroadcastMessage(model.BroadcastObject{
		MSG:  msg,
		FROM: client,
	})
}

func (c *ChatController) handleReactionMessage(messageText string, client model.ClientObject) {
	parts := strings.Split(messageText, " ")
	if len(parts) != 3 {
		return
	}

	messageID, err := primitive.ObjectIDFromHex(parts[1])
	if err != nil {
		return
	}

	reaction := &model.MessageReaction{
		MessageID: messageID,
		UserID:    client.UserID,
		Reaction:  parts[2],
		Timestamp: time.Now(),
	}

	if err := c.chatService.HandleReaction(context.Background(), reaction); err != nil {
		log.Printf("[ERROR] Failed to handle reaction: %v", err)
	}
}

func (c *ChatController) handleLeaveMessage(ctx context.Context, messageText string, client model.ClientObject) {
	if err := c.memberService.RemoveUserFromRoom(ctx, client.RoomID, client.UserID.Hex()); err != nil {
		log.Printf("[ERROR] Failed to remove user from room: %v", err)
	}
}

func (c *ChatController) handleTextMessage(messageText string, client model.ClientObject) {
	msg := &model.ChatMessage{
		RoomID:    client.RoomID,
		UserID:    client.UserID,
		Message:   messageText,
		Timestamp: time.Now(),
	}

	model.BroadcastMessage(model.BroadcastObject{
		MSG:  msg,
		FROM: client,
	})
}

func (c *ChatController) getFileType(ext string) string {
	switch ext {
	case ".jpg", ".jpeg", ".png":
		return "image"
	case ".pdf":
		return "pdf"
	default:
		return ""
	}
}
