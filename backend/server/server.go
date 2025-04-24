package server

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/controller"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	serviceHttp "github.com/HLLC-MFU/HLLC-2025/backend/module/user/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/middleware"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/migration"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"go.mongodb.org/mongo-driver/mongo"
)

/**
 * Server struct
 *
 * @author Dev. Bengi (Backend Team)
 */

type server struct {
	app    *fiber.App
	config *config.Config
	db     *mongo.Client
	redis  *core.RedisCache
}

// UserService is a global variable to be accessed by other modules directly
var (
	UserSvc  serviceHttp.UserService
	RoleSvc  serviceHttp.RoleService
	PermSvc  serviceHttp.PermissionService
)

func NewServer(cfg *config.Config, db *mongo.Client) *server {
	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
		AppName:              cfg.App.Name,
		EnablePrintRoutes:    true,
	})

	redis := core.RedisConnect(context.Background(), cfg)

	return &server{
		app:    app,
		config: cfg,
		db:     db,
		redis:  redis,
	}
}

func (s *server) verifyGRPCServices() {
	// Wait a bit for services to fully start
	time.Sleep(2 * time.Second)

	// Get all registered gRPC services
	ports := core.GetGRPCPorts()
	if len(ports) == 0 {
		log.Println("Warning: No gRPC services registered!")
		return
	}

	log.Println("\n=== gRPC Services Status ===")
	for service, port := range ports {
		// Try to establish a connection to verify the service is running
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		conn, err := core.GetGRPCConnection(ctx, service)
		if err != nil {
			log.Printf("❌ %s service (port %d): Not responding - %v", service, port, err)
			continue
		}
		defer conn.Close()

		log.Printf("✅ %s service running on port %d", service, port)
	}
	log.Println("===========================\n")
}

func (s *server) Start() error {
	// Run migrations
	migrationService := migration.NewMigrationService(s.db)
	migrations := []migration.Migration{
		migration.NewInitialSetupMigration(s.db),
	}
	if err := migrationService.Run(context.Background(), migrations); err != nil {
		return fmt.Errorf("failed to run migrations: %v", err)
	}

	// Set up global middleware
	s.app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     "http://localhost:3000",  // Frontend development URL 
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE",
	}))
	s.app.Use(middleware.RequestIDMiddleware())
	s.app.Use(middleware.LoggingMiddleware())
	s.app.Use(middleware.RecoveryMiddleware())

	// Initialize all services
	log.Println("Starting service initialization...")
	s.initializeAllServices()
	log.Println("Service initialization completed")

	// Verify gRPC services in a separate goroutine
	go s.verifyGRPCServices()

	// Set up health check
	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	// Start HTTP server
	go func() {
		log.Printf("Starting monolithic server on %s", s.config.App.Url)
		if err := s.app.Listen(s.config.App.Url); err != nil {
			log.Fatalf("Failed to start HTTP server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	
	// Shutdown HTTP server
	if err := s.app.Shutdown(); err != nil {
		log.Printf("Error shutting down HTTP server: %v", err)
	}

	// Disconnect from Redis
	if err := s.redis.Close(); err != nil {
		log.Printf("Error disconnecting from Redis: %v", err)
	}

	// Disconnect from MongoDB
	if err := s.db.Disconnect(context.Background()); err != nil {
		log.Printf("Error disconnecting from MongoDB: %v", err)
	}

	return nil
}

// initializeAllServices initializes all services for the monolithic application
func (s *server) initializeAllServices() {
	log.Println("Initializing all services...")

	// Initialize services in order of dependencies
	if err := s.initializeUserService(); err != nil {
		log.Printf("Error initializing user service: %v", err)
	}

	if err := s.initializeAuthService(); err != nil {
		log.Printf("Error initializing auth service: %v", err)
	}

	// Add other services as needed

	log.Println("All services initialized successfully in monolithic mode")
}

// initializeUserService initializes the user service and its dependencies
func (s *server) initializeUserService() error {
	log.Println("Initializing user service...")

	// Initialize repositories
	userRepo := repository.NewUserRepository(s.db)
	roleRepo := repository.NewRoleRepository(s.db)
	permRepo := repository.NewPermissionRepository(s.db)

	// Initialize services
	UserSvc = serviceHttp.NewUserService(userRepo, roleRepo, permRepo)
	RoleSvc = serviceHttp.NewRoleService(roleRepo, permRepo)
	PermSvc = serviceHttp.NewPermissionService(permRepo)

	// Initialize controller
	userController := controller.NewUserController(s.config, UserSvc, RoleSvc, PermSvc)

	// Register routes
	apiV1 := s.app.Group("/api/v1")
	userController.RegisterPublicRoutes(apiV1.Group("/public"))
	
	// JWT secret key from config
	secretKey := s.config.Jwt.AccessSecretKey
	
	// Protected routes (require authentication)
	protected := apiV1.Group("/protected")
	protected.Use(middleware.AuthMiddleware(secretKey))
	userController.RegisterProtectedRoutes(protected)
	
	// Admin routes (require admin role)
	admin := apiV1.Group("/admin")
	admin.Use(middleware.AuthMiddleware(secretKey))
	admin.Use(middleware.RoleMiddleware([]string{"admin"}))
	userController.RegisterAdminRoutes(admin)

	log.Println("User service initialized successfully")
	return nil
}

// initializeAuthService initializes the auth service
func (s *server) initializeAuthService() error {
	// Auth service implementation goes here
	log.Println("Auth service initialized successfully")
	return nil
}