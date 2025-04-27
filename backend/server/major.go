package server

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/routes"
	service "github.com/HLLC-MFU/HLLC-2025/backend/module/major/service/http"
	schoolPb "github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

// MajorService initializes the major service
func InitMajorService(app *fiber.App, cfg *config.Config, db *mongo.Client) error {
	logger := logging.DefaultLogger.WithContext(context.Background())
	logger.Info("Initializing major service...",
		logging.FieldModule, "major",
		logging.FieldOperation, "init",
	)

	// Initialize repository
	majorRepo := repository.NewRepository(db)

	// Get school client for adapter mode
	schoolClient, err := core.GetGRPCConnection(context.Background(), "school")
	if err != nil {
		logger.Warn("Could not connect to school service",
			logging.FieldModule, "major",
			logging.FieldOperation, "init",
			"error", err.Error(),
		)
	}
	var schoolSvc schoolPb.SchoolServiceClient
	if schoolClient != nil {
		schoolSvc = schoolPb.NewSchoolServiceClient(schoolClient)
	}

	// Initialize service
	majorSvc := service.NewMajorService(majorRepo, schoolSvc)

	// Initialize HTTP handler
	httpHandler := handler.NewHTTPHandler(majorSvc)

	// Register routes
	majorController := routes.NewMajorController(cfg, httpHandler)

	// Register routes based on different access levels
	api := app.Group("/api/v1")
	
	// JWT secret key from config
	secretKey := cfg.Jwt.AccessSecretKey
	
	// Public routes
	publicRouter := api.Group("/public")
	majorController.RegisterPublicRoutes(publicRouter)
	
	// Protected routes
	protected := api.Group("/majors")
	protected.Use(middleware.AuthMiddleware(secretKey))
	protected.Use(middleware.PermissionLoadingMiddleware(db))
	majorController.RegisterProtectedRoutes(protected)
	
	// Admin routes
	admin := api.Group("/admin/majors")
	admin.Use(middleware.AuthMiddleware(secretKey))
	admin.Use(middleware.PermissionLoadingMiddleware(db))
	admin.Use(middleware.RoleMiddleware([]string{"ADMIN"}))
	majorController.RegisterAdminRoutes(admin)

	// Optional: Register gRPC service if needed
	// if s.grpcServer != nil {
	// 	logger.Info("Registering major gRPC service...",
	// 		logging.FieldModule, "major",
	// 		logging.FieldOperation, "register_grpc",
	// 	)
		
	// 	// Initialize gRPC handler
	// 	grpcHandler := handler.NewGrpcHandler(majorSvc)
	// 	majorPb.RegisterMajorServiceServer(s.grpcServer, grpcHandler)
		
	// 	logger.Info("Successfully registered major gRPC service",
	// 		logging.FieldModule, "major",
	// 		logging.FieldOperation, "register_grpc",
	// 	)
	// }

	logger.Info("Major service initialized successfully",
		logging.FieldModule, "major",
		logging.FieldOperation, "init",
	)
	return nil
} 