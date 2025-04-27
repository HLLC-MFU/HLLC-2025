package server

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/routes"
	serviceHttp "github.com/HLLC-MFU/HLLC-2025/backend/module/school/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

// InitSchoolService initializes the school service and its dependencies
func InitSchoolService(app *fiber.App, cfg *config.Config, db *mongo.Client) error {
	logger := logging.DefaultLogger.WithContext(context.Background())
	logger.Info("Initializing school service...",
		logging.FieldModule, "school",
		logging.FieldOperation, "init",
	)

	// Initialize repository
	schoolRepo := repository.NewRepository(db)

	//Initial Service
	schoolService := serviceHttp.NewSchoolService(schoolRepo)

	httpHandler := handler.NewHTTPHandler(schoolService)

	// Initialize controller
	schoolRoutes := routes.NewSchoolController(cfg, httpHandler)

	// Register gRPC service
	// log.Println("Registering school gRPC service...")
	// grpcHandler := handler.NewGrpcHandler(SchoolSvc)
	// if err := core.RegisterGRPCService("school", func(server *grpc.Server) {
	// 	generated.RegisterSchoolServiceServer(server, grpcHandler)
	// }); err != nil {
	// 	return fmt.Errorf("failed to register school gRPC service: %v", err)
	// }
	// log.Printf("Successfully registered school gRPC service")

	// Initialize HTTP server
	api := app.Group("/api/v1")

	// JWT secret key from config
	secretKey := cfg.Jwt.AccessSecretKey

	// Public routes (no auth required)
	public := api.Group("/public/schools")
	schoolRoutes.RegisterPublicRoutes(public)

	// Protected routes (auth required)
	protected := api.Group("/schools")
	protected.Use(middleware.AuthMiddleware(secretKey))
	protected.Use(middleware.PermissionLoadingMiddleware(db))
	schoolRoutes.RegisterProtectedRoutes(protected)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/schools")
	admin.Use(middleware.AuthMiddleware(secretKey))
	admin.Use(middleware.PermissionLoadingMiddleware(db))
	admin.Use(middleware.RoleMiddleware([]string{"ADMIN"}))
	schoolRoutes.RegisterAdminRoutes(admin)

	logger.Info("School service initialized in monolithic mode",
		logging.FieldModule, "school",
		logging.FieldOperation, "init",
	)
	return nil
} 