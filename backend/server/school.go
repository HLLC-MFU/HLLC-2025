package server

import (
	"fmt"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/controller"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
	"google.golang.org/grpc"
)

// SchoolService is a global variable to be accessed by other modules directly
var (
	SchoolSvc service.Service
)

// InitSchoolService initializes the school service and its dependencies
func InitSchoolService(app *fiber.App, cfg *config.Config, db *mongo.Client) error {
	log.Println("Initializing school service...")

	// Initialize repository
	schoolRepo := repository.NewRepository(db)

	// Initialize service
	SchoolSvc = service.NewService(schoolRepo)

	// Initialize controller
	schoolController := controller.NewController(cfg, SchoolSvc)

	// Register gRPC service
	log.Println("Registering school gRPC service...")
	grpcHandler := handler.NewGrpcHandler(SchoolSvc)
	if err := core.RegisterGRPCService("school", func(server *grpc.Server) {
		generated.RegisterSchoolServiceServer(server, grpcHandler)
	}); err != nil {
		return fmt.Errorf("failed to register school gRPC service: %v", err)
	}
	log.Printf("Successfully registered school gRPC service")

	// Initialize HTTP server
	api := app.Group("/api/v1")

	// Public routes (no auth required)
	public := api.Group("/public/schools")
	schoolController.RegisterPublicRoutes(public)

	// Protected routes (auth required)
	protected := api.Group("/schools")
	schoolController.RegisterProtectedRoutes(protected)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/schools")
	schoolController.RegisterAdminRoutes(admin)

	log.Printf("School service initialized in monolithic mode")
	return nil
} 