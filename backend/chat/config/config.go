package config

import (
	"log"
	"os"
	"strconv"

	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

type Config struct {
	App struct {
		Name string
		Url  string
	}
	Jwt struct {
		AccessSecretKey  string
		RefreshSecretKey string
		ApiSecretKey     string
		AccessDuration   int64
		RefreshDuration  int64
		ApiDuration      int64
	}
	Db struct {
		Url      string
		Database string
	}
	Redis struct {
		Host     string
		Port     string
		Password string
		DB       int
	}
	CORS struct {
		AllowOrigins     string
		AllowHeaders     string
		AllowMethods     string
		AllowCredentials bool
	}
}

func LoadConfig(path string) *Config {
	if err := godotenv.Load(path); err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	cfg := &Config{}

	// App configuration
	cfg.App.Name = getEnvOrFatal("APP_NAME")
	cfg.App.Url = getEnvOrFatal("APP_URL")

	// JWT configuration
	cfg.Jwt.AccessSecretKey = getEnvOrFatal("JWT_ACCESS_SECRET_KEY")
	cfg.Jwt.RefreshSecretKey = getEnvOrFatal("JWT_REFRESH_SECRET_KEY")
	cfg.Jwt.ApiSecretKey = getEnvOrFatal("JWT_API_SECRET_KEY")
	cfg.Jwt.AccessDuration = getEnvAsInt64OrDefault("JWT_ACCESS_DURATION", 86400)
	cfg.Jwt.RefreshDuration = getEnvAsInt64OrDefault("JWT_REFRESH_DURATION", 604800)
	cfg.Jwt.ApiDuration = getEnvAsInt64OrDefault("JWT_API_DURATION", 31536000)

	// Database configuration
	cfg.Db.Url = getEnvOrFatal("DB_URL")
	cfg.Db.Database = getEnvOrDefault("DB_NAME", "hllc")

	// Redis configuration
	cfg.Redis.Host = getEnvOrFatal("REDIS_HOST")
	cfg.Redis.Port = getEnvOrFatal("REDIS_PORT")
	cfg.Redis.Password = getEnvOrDefault("REDIS_PASSWORD", "")
	cfg.Redis.DB = getEnvAsIntOrDefault("REDIS_DB", 0)

	// CORS configuration
	cfg.CORS.AllowOrigins = getEnvOrDefault("CORS_ALLOW_ORIGINS", "http://localhost:3000")
	cfg.CORS.AllowHeaders = getEnvOrDefault("CORS_ALLOW_HEADERS", "Origin, Content-Type, Accept, Authorization")
	cfg.CORS.AllowMethods = getEnvOrDefault("CORS_ALLOW_METHODS", "GET, POST, PUT, DELETE")
	cfg.CORS.AllowCredentials = getEnvOrDefault("CORS_ALLOW_CREDENTIALS", "true") == "true"

	return cfg
}

func getEnvOrFatal(key string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	log.Fatalf("Environment variable %s is required", key)
	return ""
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt64OrDefault(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
		log.Printf("Warning: Invalid value for %s, using default: %d", key, defaultValue)
	}
	return defaultValue
}

func getEnvAsIntOrDefault(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
		log.Printf("Warning: Invalid value for %s, using default: %d", key, defaultValue)
	}
	return defaultValue
}

func (cfg *Config) FiberCORSConfig() cors.Config {
	return cors.Config{
		AllowCredentials: cfg.CORS.AllowCredentials,
		AllowOrigins:     cfg.CORS.AllowOrigins,
		AllowHeaders:     cfg.CORS.AllowHeaders,
		AllowMethods:     cfg.CORS.AllowMethods,
	}
}
