package controller

import (
	"chat/module/chat/service"
	"chat/pkg/decorators"
	"chat/pkg/middleware"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type (
	HealthController struct {
		*decorators.BaseController
		healthService HealthServiceInterface
		rbac          middleware.IRBACMiddleware
	}

	HealthServiceInterface interface {
		GetRedis() *redis.Client
		GetMongo() *mongo.Database
		GetWorkerPoolStatus() map[string]interface{}
		TriggerPhantomMessageFix() error
	}
)

func NewHealthController(
	app fiber.Router,
	chatService *service.ChatService,
	rbac middleware.IRBACMiddleware,
) *HealthController {
	controller := &HealthController{
		BaseController: decorators.NewBaseController(app, ""),
		healthService:  chatService,
		rbac:           rbac,
	}

	controller.setupRoutes()
	return controller
}

func (c *HealthController) setupRoutes() {
	// Public health check
	c.Get("/health", c.handleHealthCheck)
	
	// Admin-only endpoints
	c.Get("/health/worker-pools", c.handleWorkerPoolStatus, c.rbac.RequireAdministrator())
	c.Get("/health/phantom-messages", c.handlePhantomMessageStatus, c.rbac.RequireAdministrator())
	c.Post("/admin/fix-phantom-messages", c.handleFixPhantomMessages, c.rbac.RequireAdministrator())
	c.Get("/admin/message-status/:messageId", c.handleGetMessageStatus, c.rbac.RequireAdministrator())
	
	c.SetupRoutes()
}

func (c *HealthController) handleHealthCheck(ctx *fiber.Ctx) error {
	health := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now(),
		"service":   "chat-service",
		"version":   "1.0.0", // TODO: Get from config
	}

	// Check Redis connection
	if err := c.healthService.GetRedis().Ping(ctx.Context()).Err(); err != nil {
		health["redis"] = map[string]interface{}{
			"status": "unhealthy",
			"error":  err.Error(),
		}
		health["status"] = "degraded"
	} else {
		health["redis"] = map[string]interface{}{
			"status": "healthy",
		}
	}

	// Check MongoDB connection
	if err := c.healthService.GetMongo().Client().Ping(ctx.Context(), nil); err != nil {
		health["mongodb"] = map[string]interface{}{
			"status": "unhealthy",
			"error":  err.Error(),
		}
		health["status"] = "unhealthy"
	} else {
		health["mongodb"] = map[string]interface{}{
			"status": "healthy",
		}
	}

	// Return appropriate status code
	statusCode := c.getHealthStatusCode(health["status"].(string))
	return ctx.Status(statusCode).JSON(health)
}

func (c *HealthController) handleWorkerPoolStatus(ctx *fiber.Ctx) error {
	status := c.healthService.GetWorkerPoolStatus()
	status["timestamp"] = time.Now()

	return ctx.JSON(fiber.Map{
		"success": true,
		"data":    status,
	})
}

func (c *HealthController) handlePhantomMessageStatus(ctx *fiber.Ctx) error {
	// Get query parameters
	timeRange := ctx.Query("timeRange", "1h")
	limit := ctx.QueryInt("limit", 100)

	// Parse time range
	duration, err := time.ParseDuration(timeRange)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid time range format",
		})
	}

	cutoffTime := time.Now().Add(-duration)
	
	// Query phantom messages
	statusCollection := c.healthService.GetMongo().Collection("message-status")
	filter := bson.M{
		"broadcast_at": bson.M{"$gte": cutoffTime},
		"status":       bson.M{"$ne": "completed"},
		"$or": []bson.M{
			{"saved_to_db": false},
			{"saved_to_cache": false},
			{"notification_sent": false},
		},
	}
	
	cursor, err := statusCollection.Find(ctx.Context(), filter)
	if err != nil {
		return c.buildErrorResponse(ctx, fiber.StatusInternalServerError, "Failed to query phantom messages", err)
	}
	defer cursor.Close(ctx.Context())
	
	var phantomMessages []bson.M
	if err := cursor.All(ctx.Context(), &phantomMessages); err != nil {
		return c.buildErrorResponse(ctx, fiber.StatusInternalServerError, "Failed to decode phantom messages", err)
	}

	// Apply limit
	if len(phantomMessages) > limit {
		phantomMessages = phantomMessages[:limit]
	}
	
	stats, categories := c.analyzePhantomMessages(phantomMessages, cutoffTime, timeRange)
	
	return ctx.JSON(fiber.Map{
		"success": true,
		"data": map[string]interface{}{
			"statistics":       stats,
			"categories":       categories,
			"phantom_messages": phantomMessages,
		},
	})
}

func (c *HealthController) handleFixPhantomMessages(ctx *fiber.Ctx) error {
	go func() {
		log.Printf("[Admin] Manual phantom message fix triggered")
		if err := c.healthService.TriggerPhantomMessageFix(); err != nil {
			log.Printf("[ERROR] Failed to trigger phantom message fix: %v", err)
		}
	}()
	
	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Phantom message fix triggered",
		"timestamp": time.Now(),
	})
}

func (c *HealthController) handleGetMessageStatus(ctx *fiber.Ctx) error {
	messageID := ctx.Params("messageId")
	
	// Validate message ID
	msgObjID, err := c.validateObjectID(messageID, "message ID")
	if err != nil {
		return c.buildErrorResponse(ctx, fiber.StatusBadRequest, err.Error(), nil)
	}
	
	// Query message status
	statusCollection := c.healthService.GetMongo().Collection("message-status")
	filter := bson.M{"message_id": msgObjID}
	
	var messageStatus bson.M
	err = statusCollection.FindOne(ctx.Context(), filter).Decode(&messageStatus)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.buildErrorResponse(ctx, fiber.StatusNotFound, "Message status not found", nil)
		}
		return c.buildErrorResponse(ctx, fiber.StatusInternalServerError, "Failed to query message status", err)
	}
	
	return ctx.JSON(fiber.Map{
		"success": true,
		"data":    messageStatus,
	})
}

// Helper methods
func (c *HealthController) getHealthStatusCode(status string) int {
	switch status {
	case "unhealthy":
		return fiber.StatusServiceUnavailable
	case "degraded":
		return fiber.StatusPartialContent
	default:
		return fiber.StatusOK
	}
}

func (c *HealthController) validateObjectID(idStr, fieldName string) (primitive.ObjectID, error) {
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return primitive.NilObjectID, fiber.NewError(fiber.StatusBadRequest, "Invalid "+fieldName+" format")
	}
	return objID, nil
}

func (c *HealthController) buildErrorResponse(ctx *fiber.Ctx, statusCode int, message string, err error) error {
	response := fiber.Map{
		"success": false,
		"message": message,
	}
	
	if err != nil {
		response["error"] = err.Error()
	}
	
	return ctx.Status(statusCode).JSON(response)
}

func (c *HealthController) analyzePhantomMessages(phantomMessages []bson.M, cutoffTime time.Time, timeRange string) (map[string]interface{}, map[string]int) {
	stats := map[string]interface{}{
		"total_phantoms":     len(phantomMessages),
		"time_range":         timeRange,
		"cutoff_time":        cutoffTime,
		"check_timestamp":    time.Now(),
	}
	
	categories := map[string]int{
		"db_not_saved":         0,
		"cache_not_saved":      0,
		"notification_not_sent": 0,
	}
	
	for _, phantom := range phantomMessages {
		if savedToDB, ok := phantom["saved_to_db"].(bool); !ok || !savedToDB {
			categories["db_not_saved"]++
		}
		if savedToCache, ok := phantom["saved_to_cache"].(bool); !ok || !savedToCache {
			categories["cache_not_saved"]++
		}
		if notificationSent, ok := phantom["notification_sent"].(bool); !ok || !notificationSent {
			categories["notification_not_sent"]++
		}
	}
	
	return stats, categories
} 