package config

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

type Config struct {
	MongoDB MongoDBConfig
	Server  ServerConfig
}

type MongoDBConfig struct {
	URI      string
	Database string
}

type ServerConfig struct {
	Port         string
	AllowOrigins string
	AllowHeaders string
}

func NewConfig() *Config {
	return &Config{
		MongoDB: MongoDBConfig{
			URI:      getEnv("MONGODB_URI", "mongodb://localhost:27017"),
			Database: getEnv("MONGODB_DATABASE", "hllc-2025"),
		},
		Server: ServerConfig{
			Port:         getEnv("PORT", ":8080"),
			AllowOrigins: getEnv("ALLOW_ORIGINS", "*"),
			AllowHeaders: getEnv("ALLOW_HEADERS", "Origin, Content-Type, Accept"),
		},
	}
}

func (c *Config) CorsConfig() cors.Config {
	return cors.Config{
		AllowOrigins: c.Server.AllowOrigins,
		AllowHeaders: c.Server.AllowHeaders,
	}
}

func (c *Config) FiberConfig() fiber.Config {
	return fiber.Config{
		AppName: "HLLC-2025 Backend",
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
