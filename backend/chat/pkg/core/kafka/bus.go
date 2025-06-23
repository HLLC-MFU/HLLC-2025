package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/segmentio/kafka-go"
)

type Message struct {
	Key       []byte
	Value     []byte
	Topic     string
	Partition int
	Offset    int64
	Timestamp time.Time
}

type HandlerFunc func(ctx context.Context, msg *Message) error

type Bus struct {
	brokers   []string
	groupID   string
	handlers  map[string][]HandlerFunc
	readers   map[string]*kafka.Reader
	writer    *kafka.Writer
	ctx       context.Context
	cancel    context.CancelFunc
	wg        sync.WaitGroup
	mu        sync.RWMutex
}

func New(brokers []string, groupID string) *Bus {
	ctx, cancel := context.WithCancel(context.Background())
	return &Bus{
		brokers:  brokers,
		groupID:  groupID,
		handlers: map[string][]HandlerFunc{},
		readers:  map[string]*kafka.Reader{},
		writer: kafka.NewWriter(kafka.WriterConfig{
			Brokers:      brokers,
			Balancer:     &kafka.LeastBytes{},
			RequiredAcks: int(kafka.RequireOne),
			Async:        false,
			MaxAttempts:  3,
			BatchTimeout: 100 * time.Millisecond,
			BatchSize:    100,
			BatchBytes:   1024 * 1024,
			ReadTimeout:  2 * time.Second,
			WriteTimeout: 2 * time.Second,
		}),
		ctx:      ctx,
		cancel:   cancel,
	}
}

func (b *Bus) CreateTopics(topics []string) error {
	conn, err := kafka.Dial("tcp", b.brokers[0])
	if err != nil {
		return err
	}
	defer conn.Close()

	controller, err := conn.Controller()
	if err != nil {
		return err
	}
	controllerConn, err := kafka.Dial("tcp", controller.Host)
	if err != nil {
		return err
	}
	defer controllerConn.Close()

	topicConfigs := make([]kafka.TopicConfig, len(topics))
	for i, topic := range topics {
		topicConfigs[i] = kafka.TopicConfig{
			Topic:             topic,
			NumPartitions:     1,
			ReplicationFactor: 1,
		}
	}

	err = controllerConn.CreateTopics(topicConfigs...)
	if err != nil {
		return err
	}

	return nil
}

func (b *Bus) On(topic string, handler HandlerFunc) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.handlers[topic] = append(b.handlers[topic], handler)
}

func (b *Bus) Emit(ctx context.Context, topic, key string, payload any) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	// Log before sending
	log.Printf("[Kafka] Emitting message to topic=%s key=%s", topic, key)

	msg := kafka.Message{
		Topic: topic,
		Key:   []byte(key),
		Value: data,
	}

	err = b.writer.WriteMessages(ctx, msg)
	if err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	// Log after successful send
	log.Printf("[Kafka] Successfully emitted message to topic=%s key=%s", topic, key)
	return nil
}

func (b *Bus) Start() error {
	b.mu.RLock()
	defer b.mu.RUnlock()
	for topic := range b.handlers {
		reader := kafka.NewReader(kafka.ReaderConfig{
			Brokers:        b.brokers,
			Topic:          topic,
			GroupID:        b.groupID,
			MinBytes:       10e3,
			MaxBytes:       10e6,
			CommitInterval: time.Second,
		})
		b.readers[topic] = reader
		b.wg.Add(1)
		go b.consume(topic, reader)
	}
	return nil
}

func (b *Bus) Stop() {
	b.cancel()
	b.wg.Wait()
	for _, r := range b.readers {
		_ = r.Close()
	}
	_ = b.writer.Close()
}

func (b *Bus) consume(topic string, reader *kafka.Reader) {
	defer b.wg.Done()
	for {
		select {
		case <-b.ctx.Done():
			return
		default:
			msg, err := reader.ReadMessage(b.ctx)
			if err != nil {
				log.Printf("[Kafka] Error reading %s: %v", topic, err)
				time.Sleep(time.Second)
				continue
			}
			wrapped := &Message{
				Key:       msg.Key,
				Value:     msg.Value,
				Topic:     msg.Topic,
				Partition: msg.Partition,
				Offset:    msg.Offset,
				Timestamp: msg.Time,
			}
			for _, h := range b.handlers[topic] {
				go h(context.Background(), wrapped)
			}
		}
	}
}
