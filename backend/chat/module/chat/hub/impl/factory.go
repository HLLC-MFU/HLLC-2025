package impl

import (
	"fmt"

	"chat/module/chat/hub"

	"github.com/redis/go-redis/v9"
)

// EventBusType represents the type of event bus to use
type EventBusType string

const (
	// RedisEventBusType uses Redis pub/sub for event distribution
	RedisEventBusType EventBusType = "redis"

	// KafkaEventBusType uses Kafka for event distribution
	KafkaEventBusType EventBusType = "kafka"
)

// EventBusConfig holds configuration for event bus creation
type EventBusConfig struct {
	Type    EventBusType
	Brokers []string // Kafka brokers
	Redis   *redis.Client
}

// NewEventBus creates a new event bus based on configuration
func NewEventBus(cfg EventBusConfig) (hub.EventBus, error) {
	switch cfg.Type {
	case RedisEventBusType:
		if cfg.Redis == nil {
			return nil, fmt.Errorf("redis client is required for Redis event bus")
		}
		return NewRedisEventBus(cfg.Redis)

	case KafkaEventBusType:
		if len(cfg.Brokers) == 0 {
			return nil, fmt.Errorf("kafka brokers are required for Kafka event bus")
		}
		return NewKafkaEventBus(cfg.Brokers)

	default:
		return nil, fmt.Errorf("unsupported event bus type: %s", cfg.Type)
	}
} 