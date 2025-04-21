package server

import (
	"fmt"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/controller"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/service"
	userRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
	"google.golang.org/grpc"
)

// AuthService is a global variable to be accessed by other modules directly
var (
	AuthSvc service.AuthService
)

// InitAuthService initializes the auth service and its dependencies
func InitAuthService(app *fiber.App, cfg *config.Config, db *mongo.Client) error {
	log.Println("Initializing auth service...")

	// Initialize repositories
	userRepo := userRepo.NewUserRepository(db)
	authRepo := repository.NewAuthRepository(db)

	// Initialize service
	AuthSvc = service.NewAuthService(cfg, userRepo, authRepo, UserSvc)

	// Initialize controller
	authController := controller.NewAuthController(cfg, AuthSvc)

	// Register gRPC service
	log.Println("Registering auth gRPC service...")
	grpcHandler := handler.NewGRPCHandler(cfg, AuthSvc)
	if err := core.RegisterGRPCService("auth", func(server *grpc.Server) {
		generated.RegisterAuthServiceServer(server, grpcHandler)
	}); err != nil {
		return fmt.Errorf("failed to register auth gRPC service: %v", err)
	}
	log.Printf("Successfully registered auth gRPC service")

	// Initialize HTTP server
	api := app.Group("/api/v1")

	// Public routes (no auth required)
	public := api.Group("/public/auth")
	authController.RegisterPublicRoutes(public)

	// Protected routes (auth required)
	protected := api.Group("/auth")
	authController.RegisterProtectedRoutes(protected)

	log.Printf("Auth service initialized in monolithic mode")
	return nil
}

