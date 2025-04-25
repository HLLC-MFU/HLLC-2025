package server

import (
	"fmt"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	activityRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/activity/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/service"
	userRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
	"google.golang.org/grpc"
)

// CheckInService is a global variable to be accessed by other modules directly
var (
	CheckInSvc service.CheckInService
)

// InitCheckinService initializes the checkin service and its dependencies
func InitCheckinService(app *fiber.App, cfg *config.Config, db *mongo.Client) error {
	log.Println("Initializing checkin service...")

	// Initialize repositories
	userRepo := userRepo.NewUserRepository(db)
	activityRepo := activityRepo.NewActivityRepository(db)
	checkinRepo := repository.NewCheckInRepository(db)

	// Initialize service
	CheckInSvc = service.NewCheckInService(cfg, checkinRepo, userRepo, activityRepo)

	// Initialize HTTP handler
	httpHandler := handler.NewHTTPHandler(cfg, CheckInSvc)

	// Register gRPC service
	log.Println("Registering checkin gRPC service...")
	grpcHandler := handler.NewGRPCHandler(cfg, CheckInSvc)
	if err := core.RegisterGRPCService("checkin", func(server *grpc.Server) {
		generated.RegisterCheckInServiceServer(server, grpcHandler)
	}); err != nil {
		return fmt.Errorf("failed to register checkin gRPC service: %v", err)
	}
	log.Printf("Successfully registered checkin gRPC service")

	// Initialize HTTP server
	api := app.Group("/api/v1")

	// Public routes (no auth required)
	public := api.Group("/public/checkins")
	httpHandler.RegisterPublicRoutes(public)

	// Protected routes (auth required)
	protected := api.Group("/checkins")
	httpHandler.RegisterProtectedRoutes(protected)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/checkins")
	httpHandler.RegisterAdminRoutes(admin)

	log.Printf("Checkin service initialized in monolithic mode")
	return nil
}
