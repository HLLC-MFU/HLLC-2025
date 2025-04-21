package server

import (
	"fmt"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/controller"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
	"google.golang.org/grpc"
)

// InitUserService initializes the user service and its dependencies
func InitUserService(app *fiber.App, cfg *config.Config, db *mongo.Client) error {
	log.Println("Initializing user service...")

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	roleRepo := repository.NewRoleRepository(db)
	permRepo := repository.NewPermissionRepository(db)

	// Initialize services
	UserSvc = service.NewUserService(cfg, userRepo, roleRepo, permRepo, nil) // nil for majorService since we're in monolithic mode
	RoleSvc = service.NewRoleService(cfg, roleRepo, permRepo)
	PermSvc = service.NewPermissionService(cfg, permRepo)

	// Initialize controller
	userController := controller.NewUserController(cfg, UserSvc, RoleSvc, PermSvc)

	// Register gRPC service
	log.Println("Registering user gRPC service...")
	grpcHandler := handler.NewGRPCHandler(cfg, UserSvc, RoleSvc, PermSvc)
	if err := core.RegisterGRPCService("user", func(server *grpc.Server) {
		generated.RegisterUserServiceServer(server, grpcHandler)
	}); err != nil {
		return fmt.Errorf("failed to register user gRPC service: %v", err)
	}
	log.Printf("Successfully registered user gRPC service")

	// Initialize HTTP server
	api := app.Group("/api/v1")

	// Public routes (no auth required)
	public := api.Group("/public/users")
	userController.RegisterPublicRoutes(public)

	// Protected routes (auth required)
	protected := api.Group("/users")
	userController.RegisterProtectedRoutes(protected)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/users")
	userController.RegisterAdminRoutes(admin)

	log.Printf("User service initialized in monolithic mode")
	return nil
}