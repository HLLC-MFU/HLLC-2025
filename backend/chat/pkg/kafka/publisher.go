package kafka

import (
	"context"
	"fmt"
	"log"

	"github.com/segmentio/kafka-go"
)

type Publisher interface {
	SendMessage(roomID string, userID string, message string) error
	SendMessageToTopic(topic, userID, message string) error
}

type publisherImpl struct{}

func (p *publisherImpl) SendMessage(roomID, userID, message string) error {
	topicName := "chat-room-" + roomID

	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  []string{"localhost:9092"},
		Topic:    topicName,
		Balancer: &kafka.LeastBytes{},
	})
	defer writer.Close()

	log.Printf("[DEBUG] Sending to Kafka topic: %s, user: %s, message: %s", topicName, userID, message)

	err := writer.WriteMessages(context.Background(), kafka.Message{
		Key:   []byte(userID),
		Value: []byte(message),
	})
	if err != nil {
		log.Printf("[Kafka Producer] Failed to send message to topic %s: %v", topicName, err)
	}
	return err
}

func GetPublisher() Publisher {
	return &publisherImpl{}
}

func EnsureKafkaTopic(brokerAddress, topicName string) error {
	conn, err := kafka.Dial("tcp", brokerAddress)
	if err != nil {
		return fmt.Errorf("failed to connect to kafka broker: %w", err)
	}
	defer conn.Close()

	controller, err := conn.Controller()
	if err != nil {
		return fmt.Errorf("failed to get kafka controller: %w", err)
	}

	controllerConn, err := kafka.Dial("tcp", fmt.Sprintf("%s:%d", controller.Host, controller.Port))
	if err != nil {
		return fmt.Errorf("failed to connect to kafka controller: %w", err)
	}
	defer controllerConn.Close()

	topicConfigs := []kafka.TopicConfig{
		{
			Topic:             topicName,
			NumPartitions:     1,
			ReplicationFactor: 1,
		},
	}

	err = controllerConn.CreateTopics(topicConfigs...)
	if err != nil {
		return fmt.Errorf("failed to create kafka topic: %w", err)
	}

	return nil
}

func ForceCreateTopic(brokerAddress, topicName string) error {

	err := EnsureKafkaTopic(brokerAddress, topicName)
	if err != nil {
		return err
	}


	conn, err := kafka.DialLeader(context.Background(), "tcp", brokerAddress, topicName, 0)
	if err == nil {
		conn.Close()
		log.Printf("[Kafka Admin] Topic '%s' already has partition, skipping force-write", topicName)
		return nil
	}

	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  []string{brokerAddress},
		Topic:    topicName,
		Balancer: &kafka.LeastBytes{},
	})
	defer writer.Close()

	err = writer.WriteMessages(context.Background(), kafka.Message{
		Key:   []byte("system"),
		Value: []byte("initialize-topic"),
	})

	if err != nil {
		log.Printf("[Kafka Admin] Force write message to topic '%s' failed: %v", topicName, err)
		return err
	}

	log.Printf("[Kafka Admin] Force write message to topic '%s' success", topicName)
	return nil
}

func (p *publisherImpl) SendMessageToTopic(topic, userID, message string) error {

	err := EnsureKafkaTopic("localhost:9092", topic)
	if err != nil {
		log.Printf("[Kafka] Failed to ensure topic %s: %v", topic, err)
	}

	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:  []string{"localhost:9092"},
		Topic:    topic,
		Balancer: &kafka.LeastBytes{},
	})
	defer writer.Close()

	log.Printf("[Kafka] Sending to topic: %s (user: %s)", topic, userID)

	return writer.WriteMessages(context.Background(), kafka.Message{
		Key:   []byte(userID),
		Value: []byte(message),
	})
}
