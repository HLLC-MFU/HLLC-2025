package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"chat/module/chat/hub"

	"github.com/redis/go-redis/v9"
)

type RedisEventBus struct {
	client   *redis.Client
	pubsub   *redis.PubSub
	handlers map[string][]hub.EventHandler
	mu       sync.RWMutex
}

type RedisConfig struct {
	Addr     string
	Password string
	DB       int
}

func NewRedisEventBus(config RedisConfig) (*RedisEventBus, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     config.Addr,
		Password: config.Password,
		DB:       config.DB,
	})

	// Test connection
	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RedisEventBus{
		client:   client,
		handlers: make(map[string][]hub.EventHandler),
	}, nil
}

func (r *RedisEventBus) Publish(ctx context.Context, topic string, event hub.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	channel := fmt.Sprintf("chat-%s", topic)
	if err := r.client.Publish(ctx, channel, data).Err(); err != nil {
		return fmt.Errorf("failed to publish event: %w", err)
	}

	// Also notify local handlers
	r.notifyHandlers(topic, event)

	return nil
}

func (r *RedisEventBus) PublishDirect(ctx context.Context, userID string, event hub.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Store notification in Redis list
	key := fmt.Sprintf("notifications:%s", userID)
	if err := r.client.LPush(ctx, key, data).Err(); err != nil {
		return fmt.Errorf("failed to store notification: %w", err)
	}

	// Publish to user's channel
	channel := fmt.Sprintf("user-%s", userID)
	if err := r.client.Publish(ctx, channel, data).Err(); err != nil {
		return fmt.Errorf("failed to publish direct event: %w", err)
	}

	return nil
}

func (r *RedisEventBus) Subscribe(topic string, handler hub.EventHandler) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.handlers[topic] = append(r.handlers[topic], handler)

	// Subscribe to Redis channel if this is the first handler
	if len(r.handlers[topic]) == 1 {
		go r.startSubscriber(topic)
	}

	return nil
}

func (r *RedisEventBus) Unsubscribe(topic string, handler hub.EventHandler) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	handlers := r.handlers[topic]
	for i, h := range handlers {
		if h == handler {
			r.handlers[topic] = append(handlers[:i], handlers[i+1:]...)
			break
		}
	}

	// If no more handlers, unsubscribe from Redis channel
	if len(r.handlers[topic]) == 0 {
		channel := fmt.Sprintf("chat-%s", topic)
		if r.pubsub != nil {
			if err := r.pubsub.Unsubscribe(context.Background(), channel); err != nil {
				return fmt.Errorf("failed to unsubscribe: %w", err)
			}
		}
	}

	return nil
}

func (r *RedisEventBus) Close() error {
	if r.pubsub != nil {
		if err := r.pubsub.Close(); err != nil {
			return fmt.Errorf("failed to close pubsub: %w", err)
		}
	}
	return r.client.Close()
}

func (r *RedisEventBus) notifyHandlers(topic string, event hub.Event) {
	r.mu.RLock()
	handlers := r.handlers[topic]
	r.mu.RUnlock()

	ctx := context.Background()
	for _, handler := range handlers {
		go func(h hub.EventHandler) {
			if err := h.HandleEvent(ctx, event); err != nil {
				log.Printf("Error handling event: %v", err)
			}
		}(handler)
	}
}

func (r *RedisEventBus) startSubscriber(topic string) {
	channel := fmt.Sprintf("chat-%s", topic)
	pubsub := r.client.Subscribe(context.Background(), channel)
	r.pubsub = pubsub

	ch := pubsub.Channel()
	for msg := range ch {
		var event hub.Event
		if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
			log.Printf("Error unmarshaling event: %v", err)
			continue
		}

		r.notifyHandlers(topic, event)
	}
} 