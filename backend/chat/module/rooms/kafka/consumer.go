package kafka

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	"github.com/segmentio/kafka-go"
)

const (
	roomConsumerGroup      = "room-service-group"
	roomEventsTopic        = "room-events"
	roomNotificationsTopic = "room-notifications"
)

// RoomEvent represents a room-related event
type RoomEvent struct {
	Type    string          `json:"type"`
	RoomID  string          `json:"roomId"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

func StartKafkaConsumer(brokerAddress string, chatService service.ChatService) {
	topics := []string{roomEventsTopic, roomNotificationsTopic}

	for _, topic := range topics {
		go consumeRoomTopic(brokerAddress, topic, roomConsumerGroup, chatService)
	}
}

func consumeRoomTopic(brokerAddress, topic, groupID string, chatService service.ChatService) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        []string{brokerAddress},
		Topic:          topic,
		GroupID:        groupID,
		MinBytes:       10e3,
		MaxBytes:       10e6,
		CommitInterval: time.Second,
		StartOffset:    kafka.LastOffset,
		ReadBackoffMin: 100 * time.Millisecond,
		ReadBackoffMax: 1 * time.Second,
	})
	defer reader.Close()

	log.Printf("[Room Kafka Consumer] Started consuming from topic: %s (group: %s)", topic, groupID)

	for {
		// Read message with timeout
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		msg, err := reader.ReadMessage(ctx)
		cancel()

		if err != nil {
			switch {
			case err == context.DeadlineExceeded:
				continue
			case err == context.Canceled:
				log.Printf("[Room Kafka Consumer] Consumer canceled for topic: %s", topic)
				return
			case err.Error() == "EOF" || err.Error() == "connection refused":
				log.Printf("[Room Kafka Consumer] Connection lost to broker, attempting to reconnect in 5s...")
				time.Sleep(5 * time.Second)
				continue
			default:
				log.Printf("[Room Kafka Consumer] Error reading message from topic %s: %v", topic, err)
				time.Sleep(time.Second)
				continue
			}
		}

		// Handle room events
		switch topic {
		case roomEventsTopic:
			var event RoomEvent
			if err := json.Unmarshal(msg.Value, &event); err != nil {
				log.Printf("[Room Kafka Consumer] Error unmarshaling room event: %v", err)
				continue
			}

			switch event.Type {
			case "room_deleted":
				log.Printf("[Room Kafka Consumer] Processing room deletion for room: %s", event.RoomID)
				// Delete all messages for this room
				if err := chatService.DeleteRoomMessages(context.Background(), event.RoomID); err != nil {
					log.Printf("[Room Kafka Consumer] Error deleting messages for room %s: %v", event.RoomID, err)
				} else {
					log.Printf("[Room Kafka Consumer] Successfully deleted all messages for room: %s", event.RoomID)
				}
			case "room_created", "room_updated":
				log.Printf("[Room Kafka Consumer] Processing room event: %s for room: %s", event.Type, event.RoomID)
			default:
				log.Printf("[Room Kafka Consumer] Unknown room event type: %s", event.Type)
			}

		case roomNotificationsTopic:
			log.Printf("[Room Kafka Consumer] Processing room notification: %s", string(msg.Value))
		}
	}
}
