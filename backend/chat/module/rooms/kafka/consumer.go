package kafka

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/redis"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	"github.com/segmentio/kafka-go"
)

func StartKafkaConsumer(brokerAddress string, topics []string, groupID string, chatService service.ChatService) {
	for _, topic := range topics {
		go consumeTopic(brokerAddress, topic, groupID, chatService)
	}
}

func consumeTopic(brokerAddress, topic, groupID string, chatService service.ChatService) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[Kafka Consumer] Panic recovered in topic %s: %v", topic, r)
		}
	}()

	log.Printf("[Kafka Consumer] Starting consumer on topic: %s", topic)

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{brokerAddress},
		GroupID:        groupID,
		Topic:          topic,
		MinBytes:       1e3,
		MaxBytes:       10e6,
		CommitInterval: time.Second,
		StartOffset:    kafka.LastOffset,
	})

	for {
		m, err := r.ReadMessage(context.Background())
		if err != nil {
			log.Printf("[Kafka Consumer] Read error on topic %s: %v", topic, err)
			continue
		}

		log.Printf("[Kafka Consumer] Received from topic %s: %s", topic, string(m.Value))

		var msg model.ChatMessage
		if err := json.Unmarshal(m.Value, &msg); err != nil {
			log.Printf("[Kafka Consumer] Failed to unmarshal message: %v", err)
			continue
		}

		// Save to Mongo
		if err := chatService.SaveChatMessage(context.Background(), &msg); err != nil {
			log.Printf("[Kafka Consumer] Failed to save message to MongoDB: %v", err)
			continue
		}
		log.Printf("[Kafka Consumer] Saved to MongoDB: %+v", msg)

		// Save to Redis
		if err := redis.SaveChatMessageToRoom(msg.RoomID, &msg); err != nil {
			log.Printf("[Kafka Consumer] Failed to save to Redis: %v", err)
		} else {
			log.Printf("[Kafka Consumer] Saved to Redis: room %s", msg.RoomID)
		}

		// Send to clients
		model.BroadcastMessage(model.BroadcastObject{
			MSG: msg.Message,
			FROM: model.ClientObject{
				RoomID: msg.RoomID,
				UserID: msg.UserID,
				Conn:   nil,
			},
		})
	}
}
