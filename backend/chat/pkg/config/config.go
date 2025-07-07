package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	App    AppConfig
	Mongo  MongoConfig
	Redis  RedisConfig
	Kafka  KafkaConfig
	Upload UploadConfig
	AsyncFlow            AsyncFlowConfig       `env:",prefix=ASYNC_"`
	ReliabilityThresholds ReliabilityThresholds `env:",prefix=RELIABILITY_"`
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

// **NEW: Async-first Flow Configuration**
type AsyncFlowConfig struct {
	// Database worker configuration
	DatabaseWorkers struct {
		WorkerCount  int           `env:"DB_WORKER_COUNT" envDefault:"100"`
		QueueSize    int           `env:"DB_QUEUE_SIZE" envDefault:"20000"`
		BatchSize    int           `env:"DB_BATCH_SIZE" envDefault:"200"`
		FlushTimeout time.Duration `env:"DB_FLUSH_TIMEOUT" envDefault:"2s"`
	}

	// Notification worker configuration
	NotificationWorkers struct {
		WorkerCount  int           `env:"NOTIFICATION_WORKER_COUNT" envDefault:"50"`
		QueueSize    int           `env:"NOTIFICATION_QUEUE_SIZE" envDefault:"10000"`
		BatchSize    int           `env:"NOTIFICATION_BATCH_SIZE" envDefault:"100"`
		FlushTimeout time.Duration `env:"NOTIFICATION_FLUSH_TIMEOUT" envDefault:"2s"`
	}

	// Retry configuration
	Retry struct {
		MaxRetries     int           `env:"RETRY_MAX_RETRIES" envDefault:"5"`
		InitialDelay   time.Duration `env:"RETRY_INITIAL_DELAY" envDefault:"500ms"`
		MaxDelay       time.Duration `env:"RETRY_MAX_DELAY" envDefault:"10s"`
		BackoffFactor  float64       `env:"RETRY_BACKOFF_FACTOR" envDefault:"1.5"`
		RetryQueueSize int           `env:"RETRY_QUEUE_SIZE" envDefault:"5000"`
	}

	// Phantom message detection
	PhantomDetection struct {
		Enabled         bool          `env:"PHANTOM_DETECTION_ENABLED" envDefault:"true"`
		CheckInterval   time.Duration `env:"PHANTOM_CHECK_INTERVAL" envDefault:"30s"`
		MaxAge          time.Duration `env:"PHANTOM_MAX_AGE" envDefault:"10m"`
		BatchSize       int           `env:"PHANTOM_BATCH_SIZE" envDefault:"100"`
		FixAutomatically bool         `env:"PHANTOM_AUTO_FIX" envDefault:"true"`
	}

	// Circuit breaker configuration
	CircuitBreaker struct {
		Enabled            bool          `env:"CIRCUIT_BREAKER_ENABLED" envDefault:"true"`
		FailureThreshold   int           `env:"CIRCUIT_FAILURE_THRESHOLD" envDefault:"10"`
		SuccessThreshold   int           `env:"CIRCUIT_SUCCESS_THRESHOLD" envDefault:"5"`
		Timeout            time.Duration `env:"CIRCUIT_TIMEOUT" envDefault:"30s"`
		HalfOpenMaxCalls   int           `env:"CIRCUIT_HALF_OPEN_MAX_CALLS" envDefault:"3"`
	}

	// Message status tracking
	MessageStatus struct {
		Enabled       bool          `env:"MESSAGE_STATUS_ENABLED" envDefault:"true"`
		TTL           time.Duration `env:"MESSAGE_STATUS_TTL" envDefault:"24h"`
		CleanupInterval time.Duration `env:"MESSAGE_STATUS_CLEANUP_INTERVAL" envDefault:"1h"`
	}

	// Performance monitoring
	Monitoring struct {
		MetricsEnabled    bool          `env:"METRICS_ENABLED" envDefault:"true"`
		MetricsInterval   time.Duration `env:"METRICS_INTERVAL" envDefault:"10s"`
		SlowQueryThreshold time.Duration `env:"SLOW_QUERY_THRESHOLD" envDefault:"1s"`
		AlertThreshold    float64       `env:"ALERT_THRESHOLD" envDefault:"0.95"` // 95% success rate
	}
}

// **NEW: Message reliability thresholds**
type ReliabilityThresholds struct {
	BroadcastTimeout    time.Duration `env:"BROADCAST_TIMEOUT" envDefault:"500ms"`
	DatabaseTimeout     time.Duration `env:"DATABASE_TIMEOUT" envDefault:"5s"`
	NotificationTimeout time.Duration `env:"NOTIFICATION_TIMEOUT" envDefault:"3s"`
	CacheTimeout        time.Duration `env:"CACHE_TIMEOUT" envDefault:"1s"`
}

var defaults = map[string]string{
	"APP_PORT":                "8081",
	"REDIS_HOST":             "localhost",
	"REDIS_PORT":             "6379",
	"REDIS_DB":               "0",
	"MONGO_URI":              "mongodb://localhost:27017",
	"MONGO_DATABASE":         "hllc-2025",
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

 