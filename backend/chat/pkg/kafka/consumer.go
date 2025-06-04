package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/segmentio/kafka-go"
)

type MessageHandler interface {
	HandleMessage(ctx context.Context, msg *model.ChatMessage) error
}

type Consumer struct {
	reader    *kafka.Reader
	handler   MessageHandler
	brokers   []string
	topic     string
	groupID   string
	ctx       context.Context
	cancel    context.CancelFunc
	wg        sync.WaitGroup
	retryWait time.Duration
}

func NewConsumer(brokers []string, topic, groupID string, handler MessageHandler) *Consumer {
	ctx, cancel := context.WithCancel(context.Background())
	return &Consumer{
		brokers:   brokers,
		topic:     topic,
		groupID:   groupID,
		handler:   handler,
		ctx:       ctx,
		cancel:    cancel,
		retryWait: 5 * time.Second,
	}
}

func (c *Consumer) Start() error {

	if err := EnsureKafkaTopic("localhost:9092", c.topic); err != nil {
		return fmt.Errorf("failed to ensure topic exists: %w", err)
	}

	if err := WaitUntilTopicReady("localhost:9092", c.topic, 30*time.Second); err != nil {
		return fmt.Errorf("topic not ready after waiting: %w", err)
	}


	c.reader = kafka.NewReader(kafka.ReaderConfig{
		Brokers:        c.brokers,
		Topic:          c.topic,
		GroupID:        c.groupID,
		MinBytes:       10e3, 
		MaxBytes:       10e6, 
		CommitInterval: time.Second,
		StartOffset:    kafka.LastOffset,
		ReadBackoffMin: 100 * time.Millisecond,
		ReadBackoffMax: 1 * time.Second,
	})

	c.wg.Add(1)
	go c.consume()

	log.Printf("[Kafka Consumer] Started consuming from topic: %s", c.topic)
	return nil
}

func (c *Consumer) Stop() {
	if c.reader != nil {
		if err := c.reader.Close(); err != nil {
			log.Printf("[Kafka Consumer] Error closing reader: %v", err)
		}
	}
	c.cancel()
	c.wg.Wait()
	log.Printf("[Kafka Consumer] Stopped consuming from topic: %s", c.topic)
}

func (c *Consumer) consume() {
	defer c.wg.Done()
	defer func() {
		if c.reader != nil {
			if err := c.reader.Close(); err != nil {
				log.Printf("[Kafka Consumer] Error closing reader in consume: %v", err)
			}
		}
	}()

	log.Printf("[Kafka Consumer] Started consuming from topic: %s (group: %s)", c.topic, c.groupID)

	for {
		select {
		case <-c.ctx.Done():
			log.Printf("[Kafka Consumer] Shutting down consumer for topic: %s", c.topic)
			return
		default:
		
			readCtx, cancel := context.WithTimeout(c.ctx, 30*time.Second)
			msg, err := c.reader.ReadMessage(readCtx)
			cancel()

			if err != nil {
				switch {
				case err == context.DeadlineExceeded:
					
					continue
				case err == context.Canceled:
					log.Printf("[Kafka Consumer] Consumer canceled for topic: %s", c.topic)
					return
				case err.Error() == "EOF" || err.Error() == "connection refused":
					log.Printf("[Kafka Consumer] Connection lost to broker, attempting to reconnect in %v...", c.retryWait)
					time.Sleep(c.retryWait)

					
					if c.reader != nil {
						c.reader.Close()
					}

					c.reader = kafka.NewReader(kafka.ReaderConfig{
						Brokers:        c.brokers,
						Topic:          c.topic,
						GroupID:        c.groupID,
						MinBytes:       10e3,
						MaxBytes:       10e6,
						CommitInterval: time.Second,
						StartOffset:    kafka.LastOffset,
						ReadBackoffMin: 100 * time.Millisecond,
						ReadBackoffMax: 1 * time.Second,
					})
					log.Printf("[Kafka Consumer] Reconnected to broker for topic: %s", c.topic)
					continue
				default:
					log.Printf("[Kafka Consumer] Unexpected error reading message from topic %s: %v", c.topic, err)
					time.Sleep(time.Second)
					continue
				}
			}

			var chatMsg model.ChatMessage
			if err := json.Unmarshal(msg.Value, &chatMsg); err != nil {
				log.Printf("[Kafka Consumer] Error unmarshaling message from topic %s: %v", c.topic, err)
				continue
			}

			if err := c.handler.HandleMessage(c.ctx, &chatMsg); err != nil {
				log.Printf("[Kafka Consumer] Error handling message from topic %s: %v", c.topic, err)
				continue
			}

			log.Printf("[Kafka Consumer] Successfully processed message from user %s in room %s (topic: %s)",
				chatMsg.UserID, chatMsg.RoomID, c.topic)
		}
	}
}
