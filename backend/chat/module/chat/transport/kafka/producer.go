package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"chat/module/chat/hub"

	"github.com/segmentio/kafka-go"
)

type KafkaEventBus struct {
	producer *kafka.Writer
	handlers map[string][]hub.EventHandler
	mu       sync.RWMutex
	brokers  []string
}

type KafkaConfig struct {
	Brokers []string
	// Add more config options as needed
}

func NewKafkaEventBus(config KafkaConfig) (*KafkaEventBus, error) {
	if len(config.Brokers) == 0 {
		return nil, fmt.Errorf("no Kafka brokers provided")
	}

	producer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  config.Brokers,
		Balancer: &kafka.LeastBytes{},
	})

	return &KafkaEventBus{
		producer: producer,
		handlers: make(map[string][]hub.EventHandler),
		brokers:  config.Brokers,
	}, nil
}

func (k *KafkaEventBus) Publish(ctx context.Context, topic string, event hub.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	err = k.producer.WriteMessages(ctx, kafka.Message{
		Topic: fmt.Sprintf("chat-%s", topic),
		Key:   []byte(event.RoomID),
		Value: data,
	})

	if err != nil {
		return fmt.Errorf("failed to publish event: %w", err)
	}

	// Also notify local handlers
	k.notifyHandlers(topic, event)

	return nil
}

func (k *KafkaEventBus) PublishDirect(ctx context.Context, userID string, event hub.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	err = k.producer.WriteMessages(ctx, kafka.Message{
		Topic: "chat-notifications",
		Key:   []byte(userID),
		Value: data,
	})

	if err != nil {
		return fmt.Errorf("failed to publish direct event: %w", err)
	}

	return nil
}

func (k *KafkaEventBus) Subscribe(topic string, handler hub.EventHandler) error {
	k.mu.Lock()
	defer k.mu.Unlock()

	k.handlers[topic] = append(k.handlers[topic], handler)

	// Start a Kafka consumer for this topic if not already started
	go k.startConsumer(topic)

	return nil
}

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

func (k *KafkaEventBus) Close() error {
	return k.producer.Close()
}

func (k *KafkaEventBus) notifyHandlers(topic string, event hub.Event) {
	k.mu.RLock()
	handlers := k.handlers[topic]
	k.mu.RUnlock()

	ctx := context.Background()
	for _, handler := range handlers {
		go func(h hub.EventHandler) {
			if err := h.HandleEvent(ctx, event); err != nil {
				log.Printf("Error handling event: %v", err)
			}
		}(handler)
	}
}

func (k *KafkaEventBus) startConsumer(topic string) {
	// Create a unique consumer group for this service instance
	groupID := fmt.Sprintf("chat-service-%s", topic)

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  k.brokers,
		Topic:    fmt.Sprintf("chat-%s", topic),
		GroupID:  groupID,
		MinBytes: 10e3,
		MaxBytes: 10e6,
	})

	defer reader.Close()

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("Error reading message: %v", err)
			continue
		}

		var event hub.Event
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("Error unmarshaling event: %v", err)
			continue
		}

		k.notifyHandlers(topic, event)
	}
} 