package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/routes"
	serviceHttp "github.com/HLLC-MFU/HLLC-2025/backend/module/user/service/http"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

// InitUserService initializes the user service and its dependencies
func InitUserService(app *fiber.App, cfg *config.Config, db *mongo.Client) error {
	log.Println("Initializing user service...")

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	roleRepo := repository.NewRoleRepository(db)
	permRepo := repository.NewPermissionRepository(db)

	// Initialize HTTP services
	userService := serviceHttp.NewUserService(userRepo, roleRepo, permRepo)
	roleService := serviceHttp.NewRoleService(roleRepo, permRepo)
	permService := serviceHttp.NewPermissionService(permRepo)

	// Initialize HTTP handler
	httpHandler := handler.NewHTTPHandler(userService, roleService, permService)

	// Initialize controller
	userRoutes := routes.NewUserController(cfg, httpHandler)

	// gRPC registration commented out to focus on HTTP implementation
	/*
	// Register gRPC service
	log.Println("Registering user gRPC service...")
	grpcHandler := handler.NewGRPCHandler(cfg, UserSvc, RoleSvc, PermSvc)
	if err := core.RegisterGRPCService("user", func(server *grpc.Server) {
		generated.RegisterUserServiceServer(server, grpcHandler)
	}); err != nil {
		return fmt.Errorf("failed to register user gRPC service: %v", err)
	}
	log.Printf("Successfully registered user gRPC service")
	*/

	// Initialize HTTP server
	api := app.Group("/api/v1")

	// Public routes (no auth required)
	public := api.Group("/public/users")
	userRoutes.RegisterPublicRoutes(public)

	// Protected routes (auth required)
	protected := api.Group("/users")
	userRoutes.RegisterProtectedRoutes(protected)

	// Admin routes (auth + admin role required)
	admin := api.Group("/admin/users")
	userRoutes.RegisterAdminRoutes(admin)

	log.Printf("User service initialized with HTTP implementation")
	return nil
}