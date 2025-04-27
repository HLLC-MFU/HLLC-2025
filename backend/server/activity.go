package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/controller"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/service"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

// InitActivityService initializes the activity service and its dependencies
func InitActivityService(app *fiber.App, cfg *config.Config, db *mongo.Client) error {
	log.Println("Initializing activity service...")

	// Initialize repository
	activityRepo := repository.NewActivityRepository(db)

	// Initialize service
	activityService := service.NewActivityService(cfg, activityRepo)

	// Initialize controller
	activityController := controller.NewActivityController(activityService)

	// Initialize HTTP handler
	httpHandler := handler.NewHTTPHandler(cfg, activityController)

	// Register gRPC service
	// log.Println("Registering activity gRPC service...")
	// grpcHandler := handler.NewGRPCHandler(cfg, ActivitySvc)
	// if err := core.RegisterGRPCService("activity", func(server *grpc.Server) {
	// 	generated.RegisterActivityServiceServer(server, grpcHandler)
	// }); err != nil {
	// 	return fmt.Errorf("failed to register activity gRPC service: %v", err)
	// }
	// log.Printf("Successfully registered activity gRPC service")

	// Initialize HTTP server
	api := app.Group("/api/v1")

	// Public routes (no auth required)
	public := api.Group("/public/activities")
	httpHandler.RegisterPublicRoutes(public)

	// Protected routes (auth required)
	protected := api.Group("/activities")
	httpHandler.RegisterProtectedRoutes(protected)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/activities")
	httpHandler.RegisterAdminRoutes(admin)

	log.Printf("Activity service initialized in monolithic mode")
	return nil
}