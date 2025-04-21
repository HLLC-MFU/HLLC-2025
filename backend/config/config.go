package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

/**
 * Config struct
 *
 * @author Dev. Bengi (Backend Team)
 */

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
		ApiDuration     int64
	}
	User struct {
		GRPCAddr string
	}
	Auth struct {
		GRPCAddr string
	}
	School struct {
		GRPCAddr string
	}
	Major struct {
		GRPCAddr string
	}
	Activity struct {
		GRPCAddr string
	}
	Checkin struct {
		GRPCAddr string
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

	// Service gRPC addresses - only load what's needed based on service
	switch cfg.App.Name {
	case "user":
		cfg.User.GRPCAddr = getEnvOrFatal("GRPC_USER_URL")
		// User service needs auth service for validation
		cfg.Auth.GRPCAddr = getEnvOrFatal("GRPC_AUTH_URL")
		// User service needs major service for user-major relationship
		cfg.Major.GRPCAddr = getEnvOrFatal("GRPC_MAJOR_URL")
	case "auth":
		cfg.Auth.GRPCAddr = getEnvOrFatal("GRPC_AUTH_URL")
		// Auth service needs user service for user management
		cfg.User.GRPCAddr = getEnvOrFatal("GRPC_USER_URL")
	case "school":
		cfg.School.GRPCAddr = getEnvOrFatal("GRPC_SCHOOL_URL")
		// School service might need auth for validation
		cfg.Auth.GRPCAddr = getEnvOrFatal("GRPC_AUTH_URL")
	case "major":
		cfg.Major.GRPCAddr = getEnvOrFatal("GRPC_MAJOR_URL")
		// Major service needs school service for school validation
		cfg.School.GRPCAddr = getEnvOrFatal("GRPC_SCHOOL_URL")
		// Major service might need auth for validation
		cfg.Auth.GRPCAddr = getEnvOrFatal("GRPC_AUTH_URL")
	case "activity":
		cfg.Activity.GRPCAddr = getEnvOrFatal("GRPC_ACTIVITY_URL")
		// Activity service might need auth for validation
		cfg.Auth.GRPCAddr = getEnvOrFatal("GRPC_AUTH_URL")
		// Activity service might need user service for activity-user relationship
		cfg.User.GRPCAddr = getEnvOrFatal("GRPC_USER_URL")
	case "checkin":
		cfg.Checkin.GRPCAddr = getEnvOrFatal("GRPC_CHECKIN_URL")
		// Checkin service needs activity service
		cfg.Activity.GRPCAddr = getEnvOrFatal("GRPC_ACTIVITY_URL")
		// Checkin service needs user service
		cfg.User.GRPCAddr = getEnvOrFatal("GRPC_USER_URL")
		// Checkin service might need auth for validation
		cfg.Auth.GRPCAddr = getEnvOrFatal("GRPC_AUTH_URL")
	default:
		log.Fatalf("Unknown service name: %s", cfg.App.Name)
	}

	// Database configuration
	cfg.Db.Url = getEnvOrFatal("DB_URL")
	cfg.Db.Database = getEnvOrDefault("DB_NAME", "hllc")

	// Redis configuration
	cfg.Redis.Host = getEnvOrFatal("REDIS_HOST")
	cfg.Redis.Port = getEnvOrFatal("REDIS_PORT")
	cfg.Redis.Password = getEnvOrDefault("REDIS_PASSWORD", "")
	cfg.Redis.DB = getEnvAsIntOrDefault("REDIS_DB", 0)

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
