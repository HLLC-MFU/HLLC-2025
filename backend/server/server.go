package server

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/migration"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/mongo"
)

/**
 * Server struct
 *
 * @author Dev. Bengi (Backend Team)
 */

type Server struct {
	app    *fiber.App
	config *config.Config
	db     *mongo.Client
	redis  *core.RedisCache
}

func NewServer(config *config.Config, db *mongo.Client) *Server {
	app := fiber.New(fiber.Config{
		ReadTimeout:          10 * time.Second,
		WriteTimeout:         10 * time.Second,
		AppName:              "HLLC-2025 Backend Service",
		EnablePrintRoutes:    true,
		DisableStartupMessage: false,
	})

	redis := core.RedisConnect(context.Background(), config)

	// Add global middlewares
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000,http://localhost:5173",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))
	
	// Add request ID middleware
	app.Use(func(c *fiber.Ctx) error {
		requestID := c.Get("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
			c.Set("X-Request-ID", requestID)
		}
		return c.Next()
	})

	// Add health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": config.App.Name,
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	return &Server{
		app:    app,
		config: config,
		db:     db,
		redis:  redis,
	}
}

// Unused gRPC services
// func (s *server) verifyGRPCServices() {
// 	// Wait a bit for services to fully start
// 	time.Sleep(2 * time.Second)

// 	// Get all registered gRPC services
// 	ports := core.GetGRPCPorts()
// 	if len(ports) == 0 {
// 		log.Println("Warning: No gRPC services registered!")
// 		return
// 	}

// 	log.Println("\n=== gRPC Services Status ===")
// 	for service, port := range ports {
// 		// Try to establish a connection to verify the service is running
// 		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
// 		defer cancel()

// 		conn, err := core.GetGRPCConnection(ctx, service)
// 		if err != nil {
// 			log.Printf("❌ %s service (port %d): Not responding - %v", service, port, err)
// 			continue
// 		}
// 		defer conn.Close()

// 		log.Printf("✅ %s service running on port %d", service, port)
// 	}
// 	log.Println("===========================\n")
// }

func (s *Server) initializeMonolith() error {
	log.Printf("Initializing monolithic server with all services...")

	// Initialize all services
	if err := InitAuthService(s.app, s.config, s.db); err != nil {
		return fmt.Errorf("failed to initialize auth service: %v", err)
	}

	if err := InitUserService(s.app, s.config, s.db); err != nil {
		return fmt.Errorf("failed to initialize user service: %v", err)
	}

	if err := InitMajorService(s.app, s.config, s.db); err != nil {
		return fmt.Errorf("failed to initialize major service: %v", err)
	}

	if err := InitSchoolService(s.app, s.config, s.db); err != nil {
		return fmt.Errorf("failed to initialize school service: %v", err)
	}

	if err := InitActivityService(s.app, s.config, s.db); err != nil {
		return fmt.Errorf("failed to initialize activity service: %v", err)
	}

	if err := InitCheckinService(s.app, s.config, s.db); err != nil {
		return fmt.Errorf("failed to initialize checkin service: %v", err)
	}

	return nil
}

func (s *Server) Start() error {
	// Run database migrations
	log.Println("Running database migrations...")
	if err := s.RunMigrations(); err != nil {
		return fmt.Errorf("failed to run migrations: %v", err)
	}
	log.Println("Database migrations completed successfully")

	// Default to monolithic mode
	if err := s.initializeMonolith(); err != nil {
		return err
	}

	// Print all routes for clarity
	log.Printf("Registered routes:")
	
	// Group routes by module
	routesByModule := make(map[string][]fiber.Route)
	
	for _, route := range s.app.GetRoutes() {
		// Simple module categorization based on path
		moduleName := "core"
		path := route.Path
		
		if strings.Contains(path, "/auth") {
			moduleName = "auth"
		} else if strings.Contains(path, "/users") {
			moduleName = "user"
		} else if strings.Contains(path, "/major") {
			moduleName = "major"
		} else if strings.Contains(path, "/school") {
			moduleName = "school"
		} else if strings.Contains(path, "/activity") {
			moduleName = "activity"
		} else if strings.Contains(path, "/checkin") {
			moduleName = "checkin"
		}
		
		routesByModule[moduleName] = append(routesByModule[moduleName], route)
	}
	
	// Print routes grouped by module
	for module, routes := range routesByModule {
		log.Printf("  Module: %s", module)
		for _, route := range routes {
			log.Printf("    %s %s", route.Method, route.Path)
		}
	}

	// Start HTTP server on port 3000
	log.Printf("Starting monolithic server on port 3000...")
	return s.app.Listen(":3000")
}



// RunMigrations runs all database migrations
func (s *Server) RunMigrations() error {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	
	// Create migration service
	migrationService := migration.NewMigrationService(s.db)
	
	// Register all migrations in order
	migrations := []migration.Migration{
		migration.NewInitialSetupMigration(s.db),
		// Add future migrations here in order
	}
	
	// Run migrations
	return migrationService.Run(ctx, migrations)
}