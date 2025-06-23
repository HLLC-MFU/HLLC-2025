package service

import (
	"chat/module/chat/utils"
	"chat/pkg/core/kafka"
	"context"
	"fmt"
	"log"
)

// SubscribeToRoom subscribes to room events
func (s *ChatService) SubscribeToRoom(ctx context.Context, roomID string) error {
	topic := utils.RoomTopicPrefix + roomID

	// Ensure topic exists
	if err := kafka.EnsureTopic("localhost:9092", topic, 1); err != nil {
		return fmt.Errorf("failed to create topic: %w", err)
	}

	// Subscribe to room topic using kafkaBus
	s.kafkaBus.On(topic, func(ctx context.Context, msg *kafka.Message) error {
		// Log received message
		log.Printf("[Kafka] Received message from topic %s", topic)
		
		// Handle message
		if err := s.hub.HandleKafkaMessage(topic, msg.Value); err != nil {
			log.Printf("[ERROR] Failed to handle Kafka message: %v", err)
			return err
		}
		
		return nil
	})

	return nil
}

// UnsubscribeFromRoom unsubscribes from room events
func (s *ChatService) UnsubscribeFromRoom(ctx context.Context, roomID string) error {
	topic := utils.RoomTopicPrefix + roomID
	
	// Stop consuming messages (implementation depends on your Kafka setup)
	// This is a placeholder - implement based on your needs
	log.Printf("[INFO] Unsubscribed from topic: %s", topic)
	
	return nil
} 