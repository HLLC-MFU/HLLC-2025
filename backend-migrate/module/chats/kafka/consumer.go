package kafka

import (
	"context"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend-migrate/module/chats/service"
	"github.com/segmentio/kafka-go"
)

type Consumer struct {
	brokers     []string
	groupID     string
	chatService service.Service
}

func NewConsumer(brokers []string, groupID string, chatService service.Service) *Consumer {
	return &Consumer{
		brokers:     brokers,
		groupID:     groupID,
		chatService: chatService,
	}
}

func (c *Consumer) StartConsumers(topics []string) {
	for _, topic := range topics {
		go c.consumeTopic(topic)
	}
}

func (c *Consumer) consumeTopic(topic string) {
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  c.brokers,
		GroupID:  c.groupID,
		Topic:    topic,
		MinBytes: 1e3,
		MaxBytes: 10e6,
	})
	defer r.Close()

	for {
		m, err := r.ReadMessage(context.Background())
		if err != nil {
			log.Printf("[Kafka Consumer] Read error on topic %s: %v", topic, err)
			continue
		}

		userID := string(m.Key)
		messageText := string(m.Value)
		roomID := topic[len("chat-room-"):] // Remove "chat-room-" prefix

		// Save message to database
		msg := &model.ChatMessage{
			RoomID:  roomID,
			UserID:  userID,
			Message: messageText,
		}
		if err := c.chatService.SaveChatMessage(context.Background(), msg); err != nil {
			log.Printf("[Kafka Consumer] Failed to save message: %v", err)
			continue
		}

		// Broadcast to WebSocket clients
		model.BroadcastMessage(model.BroadcastObject{
			MSG: messageText,
			FROM: model.ClientObject{
				RoomID: roomID,
				UserID: userID,
				Conn:   nil,
			},
		})
	}
} 