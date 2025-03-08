package server

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
)

/**
 * Server struct
 *
 * @author Dev. Bengi (Backend Team)
 */

type (

	server struct {
		app *fiber.App
		db *mongo.Client
		cfg *config.Config
		redis *core.RedisCache
	}
)

// Start HTTP server
func (s *server) httpListening() {
	log.Printf("Starting HTTP server on %s", s.cfg.App.Url)
	err := s.app.Listen(s.cfg.App.Url)
	if err != nil && err != http.ErrServerClosed {
		log.Fatalf("HTTP server error: %v", err)
	}
}

// Shutdown HTTP server
func (s *server) shutdown(ctx context.Context, quit chan os.Signal) {
    signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
    <-quit

    log.Println("Shutting down HTTP server...")
    if err := s.app.Shutdown(); err != nil {
        log.Fatalf("HTTP server shutdown error: %v", err)
    }
}

// Start server
func Start(ctx context.Context, cfg *config.Config, db *mongo.Client, redis *redis.Client) {

	s := &server{
		app: fiber.New(),
		db: db,
		cfg: cfg,
		redis: core.RedisConnect(ctx, cfg),
	}

	// Route service based on App Name
	switch s.cfg.App.Name {
	case "user":
		s.userService()
	}
	// Add more here .... =>

	//Start HTTP server
	s.httpListening()

}