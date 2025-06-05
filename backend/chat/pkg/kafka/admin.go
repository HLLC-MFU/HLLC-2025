package kafka

import (
	"log"
    "errors"
    "time"
	"github.com/segmentio/kafka-go"
)

// CreateKafkaTopic creates a new Kafka topic if it doesn't exist
func CreateKafkaTopic(brokerAddress, topic string, partitions int) error {
	conn, err := kafka.Dial("tcp", brokerAddress)
	if err != nil {
		log.Printf("[Kafka Admin] Failed to connect to broker: %v", err)
		return err
	}
	defer conn.Close()

	// Check topic already exists
	partitionsInfo, err := conn.ReadPartitions()
	if err != nil {
		log.Printf("[Kafka Admin] Failed to read partitions: %v", err)
		return err
	}
	for _, p := range partitionsInfo {
		if p.Topic == topic {
			log.Printf("[Kafka Admin] Topic '%s' already exists", topic)
			return nil
		}
	}

	// Create topic
	topicConfigs := []kafka.TopicConfig{
		{
			Topic:             topic,
			NumPartitions:     partitions,
			ReplicationFactor: 1,
		},
	}

	err = conn.CreateTopics(topicConfigs...)
	if err != nil {
		log.Printf("[Kafka Admin] Failed to create topic '%s': %v", topic, err)
		return err
	}

	log.Printf("[Kafka Admin] Created topic '%s' successfully", topic)
	return nil
}

func WaitUntilTopicReady(brokerAddress, topicName string, timeout time.Duration) error {
    deadline := time.Now().Add(timeout)
    for time.Now().Before(deadline) {
        conn, err := kafka.Dial("tcp", brokerAddress)
        if err != nil {
            return err
        }

        partitions, err := conn.ReadPartitions()
        conn.Close()
        if err != nil {
            return err
        }

        for _, p := range partitions {
            if p.Topic == topicName {
                return nil
            }
        }

        time.Sleep(500 * time.Millisecond)
    }
    return errors.New("timeout waiting for topic to be ready")
}
