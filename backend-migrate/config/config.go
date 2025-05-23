package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type (
	Config struct {
		MongoURI     string
		RedisAddr    string
		Port         string
		HTTPTimeout  time.Duration
		DBTimeout    time.Duration
		RedisTimeout time.Duration
	}
)

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	httpTimeout, _ := time.ParseDuration(os.Getenv("HTTP_TIMEOUT"))
	if httpTimeout == 0 {
		httpTimeout = 30 * time.Second
	}

	dbTimeout, _ := time.ParseDuration(os.Getenv("DB_TIMEOUT"))
	if dbTimeout == 0 {
		dbTimeout = 10 * time.Second
	}

	return &Config{
		MongoURI:  os.Getenv("MONGO_URI"),
		RedisAddr: os.Getenv("REDIS_ADDR"),
		Port:      os.Getenv("PORT"),
	}
}
