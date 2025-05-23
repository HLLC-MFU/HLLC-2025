package kafka

import (
	"context"
	"log"

	"github.com/segmentio/kafka-go"
)

type Publisher interface {
	SendMessage(topic, userID, message string) error
}

type publisherImpl struct {
	brokers []string
}

func NewPublisher(brokers []string) Publisher {
	return &publisherImpl{
		brokers: brokers,
	}
}

func (p *publisherImpl) SendMessage(topic, userID, message string) error {
	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  p.brokers,
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