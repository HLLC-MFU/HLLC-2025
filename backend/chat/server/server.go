package server

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

type server struct {
	app    *fiber.App
	config *config.Config
	db     *mongo.Client
	redis  *core.RedisCache
	api    fiber.Router
}

func NewServer(cfg *config.Config, db *mongo.Client) *server {
	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
		AppName:               cfg.App.Name,
		EnablePrintRoutes:     true,
	})

	redis := core.RedisConnect(context.Background(), cfg)

	api := app.Group("/api")

	return &server{
		app:    app,
		config: cfg,
		db:     db,
		redis:  redis,
		api:    api,
	}
}

func (s *server) Start() error {
	// Serve static files for uploads globally
	s.app.Static("/uploads", "./uploads")

	// Route service based on App Name
	s.chatService()
	s.roomService()
	s.stickerService()

	// Start HTTP server
	go func() {
		log.Printf("Starting HTTP server on %s", s.config.App.Url)
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
