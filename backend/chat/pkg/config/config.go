package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	App    AppConfig
	Mongo  MongoConfig
	Redis  RedisConfig
	Kafka  KafkaConfig
	Upload UploadConfig
}

type AppConfig struct {
	Port       string
	BaseURL    string
	APIBaseURL string
}

type MongoConfig struct {
	URI      string
	Database string
}

type RedisConfig struct {
	Host     string
	Port     string
	Addr     string
	Password string
	DB       int
}

type KafkaConfig struct {
	Brokers []string
	Topics  struct {
		RoomEvents string
		ChatEvents string
	}
}

type UploadConfig struct {
	BaseURL string
	Path    string
}

var defaults = map[string]string{
	"APP_PORT":                "8081",
	"REDIS_HOST":             "localhost",
	"REDIS_PORT":             "6379",
	"REDIS_DB":               "0",
	"MONGO_URI":              "mongodb://localhost:27017",
	"MONGO_DATABASE":         "hllc_chat",
	"KAFKA_BROKERS":          "localhost:9092",
	"UPLOAD_PATH":            "uploads",
}

func getEnv(key string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaults[key]
}

func LoadConfig() (*Config, error) {
	_ = godotenv.Load() // Ignore error if .env doesn't exist

	appPort := getEnv("APP_PORT")
	if err := validatePort(appPort); err != nil {
		return nil, fmt.Errorf("invalid APP_PORT: %v", err)
	}

	redisPort := getEnv("REDIS_PORT")
	if err := validatePort(redisPort); err != nil {
		return nil, fmt.Errorf("invalid REDIS_PORT: %v", err)
	}

	kafkaBrokers := getEnv("KAFKA_BROKERS")
	if err := validateKafkaBrokers(kafkaBrokers); err != nil {
		return nil, fmt.Errorf("invalid KAFKA_BROKERS: %v", err)
	}

	redisDB, err := strconv.Atoi(getEnv("REDIS_DB"))
	if err != nil || redisDB < 0 {
		return nil, fmt.Errorf("invalid REDIS_DB: must be a non-negative number")
	}

	baseURL := getEnv("APP_BASE_URL")
	if baseURL == "" {
		baseURL = fmt.Sprintf("http://localhost:%s", appPort)
	}

	cfg := &Config{
		App: AppConfig{
			Port:       appPort,
			BaseURL:    baseURL,
			APIBaseURL: getEnv("API_BASE_URL"),
		},
		Mongo: MongoConfig{
			URI:      getEnv("MONGO_URI"),
			Database: getEnv("MONGO_DATABASE"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST"),
			Port:     redisPort,
			Addr:     fmt.Sprintf("%s:%s", getEnv("REDIS_HOST"), redisPort),
			Password: os.Getenv("REDIS_PASSWORD"), // No default for security
			DB:       redisDB,
		},
		Kafka: KafkaConfig{
			Brokers: strings.Split(kafkaBrokers, ","),
			Topics: struct {
				RoomEvents string
				ChatEvents string
			}{
				RoomEvents: getEnv("KAFKA_TOPICS_ROOM_EVENTS"),
				ChatEvents: getEnv("KAFKA_TOPICS_CHAT_EVENTS"),
			},
		},
		Upload: UploadConfig{
			BaseURL: fmt.Sprintf("%s/uploads", baseURL),
			Path:    getEnv("UPLOAD_PATH"),
		},
	}

	return cfg, nil
}

func validateKafkaBrokers(brokers string) error {
	for _, broker := range strings.Split(brokers, ",") {
		parts := strings.Split(broker, ":")
		if len(parts) != 2 {
			return fmt.Errorf("invalid broker format: %s", broker)
		}
		if err := validatePort(parts[1]); err != nil {
			return err
		}
	}
	return nil
}

func validatePort(port string) error {
	num, err := strconv.Atoi(port)
	if err != nil || num < 1 || num > 65535 {
		return fmt.Errorf("must be between 1 and 65535")
	}
	return nil
}

 