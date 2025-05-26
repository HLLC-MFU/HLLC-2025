package kafka

import (
	"context"
	"log"


	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	"github.com/segmentio/kafka-go"
)

func StartKafkaConsumer(brokerAddress string, topics []string, groupID string, chatService service.ChatService) {
    for _, topic := range topics {
        go consumeTopic(brokerAddress, topic, groupID, chatService)
    }
}

func consumeTopic(brokerAddress, topic, groupID string, chatService service.ChatService) {
    r := kafka.NewReader(kafka.ReaderConfig{
        Brokers: []string{brokerAddress},
        GroupID: groupID,
        Topic:   topic,
        MinBytes: 1e3,
        MaxBytes: 10e6,
    })

    for {
        m, err := r.ReadMessage(context.Background())
        if err != nil {
            log.Printf("[Kafka Consumer] Read error on topic %s: %v", topic, err)
            continue
        }

        userID := string(m.Key)
        messageText := string(m.Value)

        roomID := topic[len("chat-room-"):] // ตัด "chat-room-" ออกให้เหลือ roomID

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
