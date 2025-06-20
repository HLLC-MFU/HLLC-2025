package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"chat/module/chat/hub"

	"github.com/segmentio/kafka-go"
)

// KafkaEventBus implements the EventBus interface using Kafka
type KafkaEventBus struct {
	writer     *kafka.Writer
	reader     *kafka.Reader
	handlers   map[string][]hub.EventHandler
	mu         sync.RWMutex
	ctx        context.Context
	cancel     context.CancelFunc
	userTopics map[string]string // Maps userID to their personal topic
}

// NewKafkaEventBus creates a new Kafka-based event bus
func NewKafkaEventBus(brokers []string) (*KafkaEventBus, error) {
	ctx, cancel := context.WithCancel(context.Background())

	// Configure Kafka writer
	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  brokers,
		Topic:    "chat-events",
		Balancer: &kafka.LeastBytes{},
	})

	// Configure Kafka reader
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		Topic:    "chat-events",
		GroupID:  "chat-service",
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})

	bus := &KafkaEventBus{
		writer:     writer,
		reader:     reader,
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
func (k *KafkaEventBus) Publish(ctx context.Context, topic string, event hub.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	err = k.writer.WriteMessages(ctx, kafka.Message{
		Topic: topic,
		Value: data,
		Headers: []kafka.Header{
			{Key: "eventType", Value: []byte(event.Type)},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	return nil
}

// Subscribe registers a handler for events on a topic
func (k *KafkaEventBus) Subscribe(topic string, handler hub.EventHandler) error {
	k.mu.Lock()
	defer k.mu.Unlock()

	k.handlers[topic] = append(k.handlers[topic], handler)
	return nil
}

// Unsubscribe removes a handler from a topic
func (k *KafkaEventBus) Unsubscribe(topic string, handler hub.EventHandler) error {
	k.mu.Lock()
	defer k.mu.Unlock()

	handlers := k.handlers[topic]
	for i, h := range handlers {
		if h == handler {
			k.handlers[topic] = append(handlers[:i], handlers[i+1:]...)
			break
		}
	}
	return nil
}

// PublishDirect sends an event directly to a specific user
func (k *KafkaEventBus) PublishDirect(ctx context.Context, userID string, event hub.Event) error {
	// Get or create user's personal topic
	topic := k.getUserTopic(userID)

	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	err = k.writer.WriteMessages(ctx, kafka.Message{
		Topic: topic,
		Key:   []byte(userID),
		Value: data,
		Headers: []kafka.Header{
			{Key: "eventType", Value: []byte(event.Type)},
			{Key: "userID", Value: []byte(userID)},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to write direct message: %w", err)
	}

	return nil
}

// Close cleans up resources used by the event bus
func (k *KafkaEventBus) Close() error {
	k.cancel()
	if err := k.writer.Close(); err != nil {
		return fmt.Errorf("failed to close writer: %w", err)
	}
	if err := k.reader.Close(); err != nil {
		return fmt.Errorf("failed to close reader: %w", err)
	}
	return nil
}

// consume processes incoming Kafka messages
func (k *KafkaEventBus) consume() {
	for {
		select {
		case <-k.ctx.Done():
			return
		default:
			msg, err := k.reader.ReadMessage(k.ctx)
			if err != nil {
				log.Printf("Error reading message: %v", err)
				continue
			}

			var event hub.Event
			if err := json.Unmarshal(msg.Value, &event); err != nil {
				log.Printf("Error unmarshaling event: %v", err)
				continue
			}

			// Get topic handlers
			k.mu.RLock()
			handlers := k.handlers[msg.Topic]
			k.mu.RUnlock()

			// Process event with all registered handlers
			for _, handler := range handlers {
				if err := handler.HandleEvent(k.ctx, event); err != nil {
					log.Printf("Error handling event: %v", err)
				}
			}
		}
	}
}

// getUserTopic returns or creates a personal topic for a user
func (k *KafkaEventBus) getUserTopic(userID string) string {
	k.mu.Lock()
	defer k.mu.Unlock()

	if topic, exists := k.userTopics[userID]; exists {
		return topic
	}

	topic := fmt.Sprintf("user-%s", userID)
	k.userTopics[userID] = topic
	return topic
}