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

type (
	Config struct {
		App App
		Db Db
		Grpc Grpc
		Jwt Jwt
		Redis Redis
	}

	App struct {
		Name string
		Url string
		Stage string
	}

	Db struct {
		Url string
		Database string
	}

	Jwt struct {
		AccessSecretKey string
		RefreshSecretKey string
		ApiSecretKey string
		AccessDuration int64
		RefreshDuration int64
		ApiDuration int64
	}

	Grpc struct {
		UserUrl string
		AuthUrl string
	}

	Redis struct {
		Host string
		Port string
		Password string
		DB int
	}
)

func LoadConfig(path string) Config {
	if err := godotenv.Load(path); err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	return Config {
		App: App {
			Name: os.Getenv("APP_NAME"),
			Url: os.Getenv("APP_URL"),
			Stage: os.Getenv("APP_STAGE"),
		},
		Db: Db {
			Url: os.Getenv("DB_URL"),
		},
		Grpc: Grpc {
			UserUrl: os.Getenv("GRPC_USER_URL"),
			AuthUrl: os.Getenv("GRPC_AUTH_URL"),
		},
		Redis: Redis {
			Host: os.Getenv("REDIS_HOST"),
			Port: os.Getenv("REDIS_PORT"),
			Password: os.Getenv("REDIS_PASSWORD"),
			DB: func() int {
				result, err := strconv.Atoi(os.Getenv("REDIS_DB"))
				if err != nil {
					return 0
				}
				return result
			}(),
		},
		Jwt: Jwt {
			AccessSecretKey: os.Getenv("JWT_ACCESS_SECRET_KEY"),
			RefreshSecretKey: os.Getenv("JWT_REFRESH_SECRET_KEY"),
			ApiSecretKey: os.Getenv("JWT_API_SECRET_KEY"),
			AccessDuration: func() int64 {
				result, err := strconv.ParseInt(os.Getenv("JWT_ACCESS_DURATION"), 10, 64)
				if err != nil {
					log.Fatalf("Error parsing JWT_ACCESS_DURATION: %v", err)
				}
				return result
			}(),
			RefreshDuration: func() int64 {
				result, err := strconv.ParseInt(os.Getenv("JWT_REFRESH_DURATION"), 10, 64)
				if err != nil {
					log.Fatalf("Error parsing JWT_REFRESH_DURATION: %v", err)
				}
				return result
			}(),
			ApiDuration: func() int64 {
				result, err := strconv.ParseInt(os.Getenv("JWT_API_DURATION"), 10, 64)
				if err != nil {
					log.Fatalf("Error parsing JWT_API_DURATION: %v", err)
				}
				return result
			}(),
		},
	}
}
