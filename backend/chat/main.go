package main

import (
	"context"
	"fmt"
	"log"
	"os"

	roomController "chat/module/room/controller"
	roomService "chat/module/room/service"
	"chat/module/user/controller"
	"chat/module/user/service"
	"chat/pkg/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// Print current working directory for debugging
	pwd, err := os.Getwd()
	if err != nil {
		log.Printf("Warning: Could not get working directory: %v", err)
	} else {
		log.Printf("Current working directory: %s", pwd)
	}

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Printf("Error details: %v", err)
		log.Fatalf("Failed to load config: %v", err)
	}

	// Print loaded configuration for debugging
	log.Printf("Loaded configuration: App Port=%s, MongoDB URI=%s", 
		cfg.App.Port, 
		cfg.Mongo.URI,
	)

	// Create Fiber app
	app := fiber.New()

	// Setup MongoDB
	mongo, err := setupMongo(cfg)
	if err != nil {
		log.Fatalf("Failed to setup MongoDB: %v", err)
	}

	// Setup middleware
	setupMiddleware(app)

	// Setup controllers
	setupControllers(app, mongo)

	// Start server
	port := fmt.Sprintf(":%s", cfg.App.Port)
	log.Printf("Server starting on port %s", port)
	if err := app.Listen(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func setupMongo(cfg *config.Config) (*mongo.Database, error) {
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(cfg.Mongo.URI))
	if err != nil {
		return nil, err
	}

	if err := client.Ping(context.Background(), nil); err != nil {
		return nil, err
	}

	return client.Database(cfg.Mongo.Database), nil
}

func setupMiddleware(app *fiber.App) {
	// Recovery middleware
	app.Use(recover.New())

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	// Logger middleware
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path}\n",
	}))
}

func setupControllers(app *fiber.App, mongo *mongo.Database) {
	// Initialize services
	schoolService := service.NewSchoolService(mongo)
	majorService := service.NewMajorService(mongo)
	roleService := service.NewRoleService(mongo)
	userService := service.NewUserService(mongo)
	roomService := roomService.NewRoomService(mongo)

	// Initialize controllers
	controller.NewSchoolController(app, schoolService)
	controller.NewMajorController(app, majorService)
	controller.NewRoleController(app, roleService)
	controller.NewUserController(app, userService)
	roomController.NewRoomController(app, roomService)
}