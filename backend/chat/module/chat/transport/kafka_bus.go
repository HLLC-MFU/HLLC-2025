// transport/kafka_bus.go
package transport

import (
	"context"
	"encoding/json"

	"github.com/segmentio/kafka-go"
)

type KafkaBus struct {
	producer *kafka.Writer
}

func NewKafkaBus(broker string) *KafkaBus {
	return &KafkaBus{
		producer: kafka.NewWriter(kafka.WriterConfig{
			Brokers: []string{broker},
			Balancer: &kafka.LeastBytes{},
		}),
	}
}

func (k *KafkaBus) Broadcast(ctx context.Context, topic string, payload interface{}) error {
	data, _ := json.Marshal(payload)
	return k.producer.WriteMessages(ctx, kafka.Message{
		Key:   []byte("broadcast"),
		Value: data,
		Topic: "chat-room-" + topic,
	})
}

func (k *KafkaBus) Direct(ctx context.Context, userID string, payload interface{}) error {
	data, _ := json.Marshal(payload)
	return k.producer.WriteMessages(ctx, kafka.Message{
		Key:   []byte(userID),
		Value: data,
		Topic: "chat-notifications",
	})
}
