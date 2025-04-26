package server

import (
	"context"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/service"
	schoolPb "github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

// MajorService is a global variable to be accessed by other modules directly
var (
	MajorSvc service.Service
)

// InitMajorService initializes the major service and its dependencies
func InitMajorService(app *fiber.App, cfg *config.Config, db *mongo.Client) error {
	log.Println("Initializing major service...")

	// Initialize repository
	majorRepo := repository.NewRepository(db)

	// Get school client for adapter mode
	schoolClient, err := core.GetGRPCConnection(context.Background(), "school")
	if err != nil {
		log.Printf("Warning: Could not connect to school service: %v", err)
	}
	var schoolSvc schoolPb.SchoolServiceClient
	if schoolClient != nil {
		schoolSvc = schoolPb.NewSchoolServiceClient(schoolClient)
	}

	// Initialize service
	MajorSvc = service.NewService(majorRepo, schoolSvc)

	// Initialize HTTP handler
	httpHandler := handler.NewHTTPHandler(MajorSvc)

	// // Register gRPC service
	// log.Println("Registering major gRPC service...")
	// grpcHandler := handler.NewGrpcHandler(MajorSvc)
	// if err := core.RegisterGRPCService("major", func(server *grpc.Server) {
	// 	generated.RegisterMajorServiceServer(server, grpcHandler)
	// }); err != nil {
	// 	return fmt.Errorf("failed to register major gRPC service: %v", err)
	// }
	// log.Printf("Successfully registered major gRPC service")

	// Initialize HTTP server
	api := app.Group("/api/v1")

	// Register all routes
	httpHandler.RegisterRoutes(api.Group("/majors"))

	log.Printf("Major service initialized in monolithic mode")
	return nil
} 