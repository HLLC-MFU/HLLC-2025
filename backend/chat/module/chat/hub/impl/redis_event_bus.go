package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"chat/module/chat/hub"

	"github.com/redis/go-redis/v9"
)

// RedisEventBus implements the EventBus interface using Redis pub/sub
type RedisEventBus struct {
	client     *redis.Client
	pubsub     *redis.PubSub
	handlers   map[string][]hub.EventHandler
	mu         sync.RWMutex
	ctx        context.Context
	cancel     context.CancelFunc
	userTopics map[string]string // Maps userID to their personal channel
}

// NewRedisEventBus creates a new Redis-based event bus
func NewRedisEventBus(redisClient *redis.Client) (*RedisEventBus, error) {
	ctx, cancel := context.WithCancel(context.Background())

	bus := &RedisEventBus{
		client:     redisClient,
		pubsub:     redisClient.Subscribe(ctx),
		handlers:   make(map[string][]hub.EventHandler),
		ctx:        ctx,
		cancel:     cancel,
		userTopics: make(map[string]string),
	}

	// Start consuming messages
	go bus.consume()

	return bus, nil
}

// Publish sends an event to all subscribers of a topic
func (r *RedisEventBus) Publish(ctx context.Context, topic string, event hub.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	err = r.client.Publish(ctx, topic, data).Err()
	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	return nil
}

// Subscribe registers a handler for events on a topic
func (r *RedisEventBus) Subscribe(topic string, handler hub.EventHandler) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Subscribe to Redis channel if first handler for this topic
	if len(r.handlers[topic]) == 0 {
		if err := r.pubsub.Subscribe(r.ctx, topic); err != nil {
			return fmt.Errorf("failed to subscribe to topic: %w", err)
		}
	}

	r.handlers[topic] = append(r.handlers[topic], handler)
	return nil
}

// Unsubscribe removes a handler from a topic
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

	// Unsubscribe from Redis channel if no more handlers
	if len(r.handlers[topic]) == 0 {
		if err := r.pubsub.Unsubscribe(r.ctx, topic); err != nil {
			return fmt.Errorf("failed to unsubscribe from topic: %w", err)
		}
		delete(r.handlers, topic)
	}

	return nil
}

// PublishDirect sends an event directly to a specific user
func (r *RedisEventBus) PublishDirect(ctx context.Context, userID string, event hub.Event) error {
	// Get or create user's personal channel
	channel := r.getUserChannel(userID)

	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	err = r.client.Publish(ctx, channel, data).Err()
	if err != nil {
		return fmt.Errorf("failed to publish direct message: %w", err)
	}

	return nil
}

// Close cleans up resources used by the event bus
func (r *RedisEventBus) Close() error {
	r.cancel()
	return r.pubsub.Close()
}

// consume processes incoming Redis messages
func (r *RedisEventBus) consume() {
	ch := r.pubsub.Channel()

	for {
		select {
		case <-r.ctx.Done():
			return
		case msg := <-ch:
			var event hub.Event
			if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
				log.Printf("Error unmarshaling event: %v", err)
				continue
			}

			// Get channel handlers
			r.mu.RLock()
			handlers := r.handlers[msg.Channel]
			r.mu.RUnlock()

			// Process event with all registered handlers
			for _, handler := range handlers {
				if err := handler.HandleEvent(r.ctx, event); err != nil {
					log.Printf("Error handling event: %v", err)
				}
			}
		}
	}
}

// getUserChannel returns or creates a personal channel for a user
func (r *RedisEventBus) getUserChannel(userID string) string {
	r.mu.Lock()
	defer r.mu.Unlock()

	if channel, exists := r.userTopics[userID]; exists {
		return channel
	}

	channel := fmt.Sprintf("user:%s", userID)
	r.userTopics[userID] = channel
	return channel
} 