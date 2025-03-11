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
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/migration"
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
func (s *server) shutdown(quit chan os.Signal) {
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
		app: fiber.New(fiber.Config{
			DisableStartupMessage: true,
			AppName:              cfg.App.Name,
			EnablePrintRoutes:    true,
		}),
		db: db,
		cfg: cfg,
		redis: core.RedisConnect(ctx, cfg),
	}

	// Run migrations
	migrationService := migration.NewMigrationService(db)
	migrations := []migration.Migration{
		migration.NewInitialSetupMigration(db),
	}
	if err := migrationService.Run(ctx, migrations); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Route service based on App Name
	switch s.cfg.App.Name {
	case "user":
		s.userService()
	case "auth":
		s.authService()
	}
	// Add more here .... =>

	// Set up graceful shutdown
	quit := make(chan os.Signal, 1)
	go s.shutdown(quit)

	//Start HTTP server
	s.httpListening()
}