package kafka

import (
	"context"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/segmentio/kafka-go"
)

type Publisher interface {
	SendMessage(topic, userID, message string) error
}

type publisherImpl struct {
	config *config.Config
}

func (p *publisherImpl) SendMessage(topic, userID, message string) error {
	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  []string{p.config.KafkaAddress()},
		Topic:    "chat-room-" + topic,
		Balancer: &kafka.LeastBytes{},
	})
	defer writer.Close()

	err := writer.WriteMessages(context.Background(),
		kafka.Message{
			Key:   []byte(userID),
			Value: []byte(message),
		},
	)
	if err != nil {
		log.Printf("[Kafka Producer] Failed to send message to topic %s: %v", topic, err)
	}
	return err
}

func GetPublisher() Publisher {
	return &publisherImpl{}
}
