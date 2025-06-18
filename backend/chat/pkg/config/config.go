package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type (
	Config struct {
		App   AppConfig
		Mongo MongoConfig
		Redis RedisConfig
		Kafka KafkaConfig
	}

	AppConfig struct {
		Port string
		Env  string
	}

	MongoConfig struct {
		URI      string
		Database string
	}

	RedisConfig struct {
		Host     string
		Port     string
		Password string
		DB       int
	}

	KafkaConfig struct {
		Brokers []string
	}
)

func LoadConfig() (*Config, error) {
	// Load .env file if it exists
	godotenv.Load()

	config := &Config{
		App: AppConfig{
			Port: getEnv("APP_PORT", "3000"),
			Env:  getEnv("APP_ENV", "development"),
		},
		Mongo: MongoConfig{
			URI:      getEnv("MONGO_URI", "mongodb://localhost:27017"),
			Database: getEnv("MONGO_DATABASE", "chat_db"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		Kafka: KafkaConfig{
			Brokers: []string{getEnv("KAFKA_BROKER", "localhost:9092")},
		},
	}

	return config, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
} 