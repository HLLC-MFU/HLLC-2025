package service

import (
	"chat/module/chat/utils"
	"chat/pkg/core/kafka"
	"context"
	"fmt"
	"log"
)

func (s *ChatService) SubscribeToRoom(ctx context.Context, roomID string) error {
	topic := utils.RoomTopicPrefix + roomID

	if err := kafka.EnsureTopic("localhost:9092", topic, 1); err != nil {
		return fmt.Errorf("failed to create topic: %w", err)
	}

	s.kafkaBus.On(topic, func(ctx context.Context, msg *kafka.Message) error {
		log.Printf("[Kafka] Received message from topic %s", topic)
		
		if err := s.hub.HandleKafkaMessage(topic, msg.Value); err != nil {
			log.Printf("[ERROR] Failed to handle Kafka message: %v", err)
			return err
		}
		
		return nil
	})

	return nil
}

func (s *ChatService) UnsubscribeFromRoom(ctx context.Context, roomID string) error {
	topic := utils.RoomTopicPrefix + roomID
	
	log.Printf("[INFO] Unsubscribed from topic: %s", topic)
	
	return nil
} 