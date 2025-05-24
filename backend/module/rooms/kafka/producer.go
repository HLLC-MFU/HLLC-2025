package kafka

import (
	"context"
	"log"

	"github.com/segmentio/kafka-go"
)

type Publisher interface {
	SendMessage(topic, userID, message string) error
}

type publisherImpl struct{}

func (p *publisherImpl) SendMessage(topic, userID, message string) error {
	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  []string{"localhost:9092"}, // แก้ให้ config ได้นะ
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
