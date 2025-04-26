package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/routes"
	authService "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/service/http"
	userRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	userService "github.com/HLLC-MFU/HLLC-2025/backend/module/user/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

// InitAuthService initializes the auth service and its dependencies
func InitAuthService(app *fiber.App, cfg *config.Config, db *mongo.Client) error {
	log.Println("Initializing auth service...")

	// Initialize repositories
	userRepository := userRepo.NewUserRepository(db)
	roleRepository := userRepo.NewRoleRepository(db)
	permRepository := userRepo.NewPermissionRepository(db)
	authRepo := repository.NewAuthRepository(db)

	// Initialize user service for auth
	userSvc := userService.NewUserService(userRepository, roleRepository, permRepository)

	// Initialize service
	authSvc := authService.NewAuthService(cfg, userRepository, authRepo, userSvc)
	
	// Initialize HTTP handler
	httpHandler := handler.NewAuthHTTPHandler(cfg, authSvc)

	// Initialize controller
	authRoutes := routes.NewAuthController(cfg, authSvc, httpHandler)

	// Initialize HTTP server routes
	api := app.Group("/api/v1")

	// Public routes (no auth required) 
	public := api.Group("/auth")
	authRoutes.RegisterPublicRoutes(public)

	// JWT secret key from config
	secretKey := cfg.Jwt.AccessSecretKey

	// Protected routes (auth required)
	protected := api.Group("/protected/auth")
	protected.Use(middleware.AuthMiddleware(secretKey))
	authRoutes.RegisterProtectedRoutes(protected)

	// Admin routes (admin role required)
	admin := api.Group("/admin/auth")
	admin.Use(middleware.AuthMiddleware(secretKey))
	admin.Use(middleware.RoleMiddleware([]string{"ADMIN"}))
	authRoutes.RegisterAdminRoutes(admin)

	log.Printf("Auth service initialized successfully")
	return nil
}

