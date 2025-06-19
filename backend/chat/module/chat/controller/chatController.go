package controller

// import (
// 	"chat/module/chat/model"
// 	"chat/module/chat/service"
// 	"chat/pkg/decorators"

// 	"github.com/gofiber/fiber/v2"
// 	"go.mongodb.org/mongo-driver/bson/primitive"
// )

// type ChatController struct {
// 	*decorators.BaseController
// 	service *service.ChatService
// }

// func NewChatController(app *fiber.App, service *service.ChatService) *ChatController {
// 	controller := &ChatController{
// 		BaseController: decorators.NewBaseController(app, "/api/chat"),
// 		service:       service,
// 	}

// 	// Message endpoints
// 	controller.Post("/messages", controller.sendMessage)
// 	controller.Get("/messages/:roomId", controller.getMessages)
// 	controller.Put("/messages/:messageId", controller.editMessage)
// 	controller.Delete("/messages/:messageId", controller.deleteMessage)

// 	// Reaction endpoints
// 	controller.Post("/messages/:messageId/reactions", controller.addReaction)
// 	controller.Delete("/messages/:messageId/reactions", controller.removeReaction)

// 	// Setup all registered routes
// 	controller.SetupRoutes()

// 	return controller
// }

// func (c *ChatController) sendMessage(ctx *fiber.Ctx) error {
// 	var msg model.ChatMessage
// 	if err := ctx.BodyParser(&msg); err != nil {
// 		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "Invalid request body",
// 		})
// 	}

// 	// Validate required fields
// 	if msg.RoomID == "" || msg.SenderID == "" || msg.Content == "" {
// 		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "Missing required fields",
// 		})
// 	}

// 	if err := c.service.SendMessage(ctx.Context(), &msg); err != nil {
// 		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"error": err.Error(),
// 		})
// 	}

// 	return ctx.Status(fiber.StatusCreated).JSON(msg)
// }

// func (c *ChatController) getMessages(ctx *fiber.Ctx) error {
// 	roomID := ctx.Params("roomId")
// 	page := ctx.QueryInt("page", 1)
// 	limit := ctx.QueryInt("limit", 50)

// 	messages, err := c.service.GetMessages(ctx.Context(), roomID, int64(page), int64(limit))
// 	if err != nil {
// 		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"error": err.Error(),
// 		})
// 	}

// 	return ctx.JSON(messages)
// }

// func (c *ChatController) editMessage(ctx *fiber.Ctx) error {
// 	messageID, err := primitive.ObjectIDFromHex(ctx.Params("messageId"))
// 	if err != nil {
// 		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "Invalid message ID",
// 		})
// 	}

// 	var req struct {
// 		Content string `json:"content"`
// 	}
// 	if err := ctx.BodyParser(&req); err != nil {
// 		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "Invalid request body",
// 		})
// 	}

// 	if err := c.service.EditMessage(ctx.Context(), messageID, req.Content); err != nil {
// 		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"error": err.Error(),
// 		})
// 	}

// 	return ctx.SendStatus(fiber.StatusOK)
// }

// func (c *ChatController) deleteMessage(ctx *fiber.Ctx) error {
// 	messageID, err := primitive.ObjectIDFromHex(ctx.Params("messageId"))
// 	if err != nil {
// 		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "Invalid message ID",
// 		})
// 	}

// 	if err := c.service.DeleteMessage(ctx.Context(), messageID); err != nil {
// 		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"error": err.Error(),
// 		})
// 	}

// 	return ctx.SendStatus(fiber.StatusOK)
// }

// type ReactionRequest struct {
// 	Reaction string `json:"reaction"`
// }

// func (c *ChatController) addReaction(ctx *fiber.Ctx) error {
// 	messageID, err := primitive.ObjectIDFromHex(ctx.Params("messageId"))
// 	if err != nil {
// 		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "Invalid message ID",
// 		})
// 	}

// 	var req ReactionRequest
// 	if err := ctx.BodyParser(&req); err != nil {
// 		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "Invalid request body",
// 		})
// 	}

// 	userID := ctx.Get("X-User-ID") // Assuming user ID is set by auth middleware
// 	if userID == "" {
// 		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
// 			"error": "User not authenticated",
// 		})
// 	}

// 	if err := c.service.AddReaction(ctx.Context(), messageID, userID, req.Reaction); err != nil {
// 		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"error": err.Error(),
// 		})
// 	}

// 	return ctx.SendStatus(fiber.StatusOK)
// }

// func (c *ChatController) removeReaction(ctx *fiber.Ctx) error {
// 	messageID, err := primitive.ObjectIDFromHex(ctx.Params("messageId"))
// 	if err != nil {
// 		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "Invalid message ID",
// 		})
// 	}

// 	var req ReactionRequest
// 	if err := ctx.BodyParser(&req); err != nil {
// 		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "Invalid request body",
// 		})
// 	}

// 	userID := ctx.Get("X-User-ID") // Assuming user ID is set by auth middleware
// 	if userID == "" {
// 		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
// 			"error": "User not authenticated",
// 		})
// 	}

// 	if err := c.service.RemoveReaction(ctx.Context(), messageID, userID, req.Reaction); err != nil {
// 		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"error": err.Error(),
// 		})
// 	}

// 	return ctx.SendStatus(fiber.StatusOK)
// }