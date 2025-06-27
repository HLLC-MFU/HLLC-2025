package kafka

// import (
// 	"log"

// 	"github.com/segmentio/kafka-go"
// )

// type KafkaConfig struct {
// 	Brokers []string
// 	GroupID string
// }

// // CreateTopics ensures that all required topics exist
// func CreateTopics(brokers []string) error {
// 	conn, err := kafka.Dial("tcp", brokers[0])
// 	if err != nil {
// 		return err
// 	}
// 	defer conn.Close()

// 	controller, err := conn.Controller()
// 	if err != nil {
// 		return err
// 	}

// 	controllerConn, err := kafka.Dial("tcp", controller.Host)
// 	if err != nil {
// 		return err
// 	}
// 	defer controllerConn.Close()

// 	topicConfigs := []kafka.TopicConfig{
// 		{
// 			Topic:             "room-events",
// 			NumPartitions:     1,
// 			ReplicationFactor: 1,
// 		},
// 		{
// 			Topic:             "chat-events",
// 			NumPartitions:     1,
// 			ReplicationFactor: 1,
// 		},
// 	}

// 	for _, topic := range topicConfigs {
// 		err = controllerConn.CreateTopics(topic)
// 		if err != nil {
// 			log.Printf("Error creating topic %s: %v", topic.Topic, err)
// 			// Continue even if topic exists
// 			continue
// 		}
// 		log.Printf("Created Kafka topic: %s", topic.Topic)
// 	}

// 	return nil
// }