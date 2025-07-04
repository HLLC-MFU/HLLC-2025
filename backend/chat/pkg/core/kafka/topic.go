package kafka

import (
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/segmentio/kafka-go"
)

var (
	// topicBrokerMap เก็บความสัมพันธ์ระหว่าง topic กับ broker
	topicBrokerMap sync.Map
	// currentBrokerIndex ใช้สำหรับ round-robin broker assignment
	currentBrokerIndex int32
)

// EnsureTopic creates a topic if it doesn't exist and assigns a dedicated broker
func EnsureTopic(brokers []string, topic string, partitions int) error {
	// ตรวจสอบว่า topic นี้มี broker แล้วหรือยัง
	if assignedBroker, exists := topicBrokerMap.Load(topic); exists {
		broker := assignedBroker.(string)
		log.Printf("[Kafka] Topic %s already exists on broker %s", topic, broker)
		return nil
	}

	// เลือก broker ใหม่สำหรับ topic นี้
	selectedBroker := assignBrokerForTopic(brokers, topic)
	
	// สร้าง connection ไปยัง broker
	conn, err := kafka.Dial("tcp", selectedBroker)
	if err != nil {
		return fmt.Errorf("failed to connect to broker %s: %v", selectedBroker, err)
	}
	defer conn.Close()

	// ดึง controller
	controller, err := conn.Controller()
	if err != nil {
		return fmt.Errorf("failed to get controller: %v", err)
	}

	// สร้าง connection ไปยัง controller
	cConn, err := kafka.Dial("tcp", fmt.Sprintf("%s:%d", controller.Host, controller.Port))
	if err != nil {
		return fmt.Errorf("failed to connect to controller: %v", err)
	}
	defer cConn.Close()

	// กำหนดค่า partition ตามประเภทของ topic
	numPartitions := 10 // ค่าเริ่มต้น
	if strings.HasPrefix(topic, "chat-room-") {
		numPartitions = 20 // สำหรับ room topic
	} else if topic == "chat-notifications" {
		numPartitions = 30 // สำหรับ notification topic
	}

	// สร้าง topic บน broker ที่เลือก
	err = cConn.CreateTopics(kafka.TopicConfig{
		Topic:             topic,
		NumPartitions:     numPartitions,
		ReplicationFactor: 1, // 1 topic ต่อ 1 broker
	})

	if err != nil {
		return fmt.Errorf("failed to create topic %s on broker %s: %v", topic, selectedBroker, err)
	}

	// บันทึกความสัมพันธ์ระหว่าง topic กับ broker
	topicBrokerMap.Store(topic, selectedBroker)
	log.Printf("[Kafka] Created topic %s on broker %s with %d partitions", topic, selectedBroker, numPartitions)

	return nil
}

// assignBrokerForTopic เลือก broker สำหรับ topic ใหม่
func assignBrokerForTopic(brokers []string, topic string) string {
	// ใช้ round-robin เพื่อกระจาย load ระหว่าง brokers
	index := (currentBrokerIndex + 1) % int32(len(brokers))
	currentBrokerIndex = index
	return brokers[index]
}

// GetTopicBroker returns the assigned broker for a topic
func GetTopicBroker(topic string) (string, bool) {
	broker, exists := topicBrokerMap.Load(topic)
	if !exists {
		return "", false
	}
	return broker.(string), true
}

// ลบ topic
func DeleteTopic(broker, topic string) error {

	// สร้าง connection ไปยัง broker
	conn, err := kafka.Dial("tcp", broker)
	if err != nil {
		return err
	}
	defer conn.Close()

	// ดึง controller จาก broker
	controller, err := conn.Controller()
	if err != nil {
		return err
	}

	// สร้าง connection ไปยัง controller
	controllerConn, err := kafka.Dial("tcp", fmt.Sprintf("%s:%d", controller.Host, controller.Port))
	if err != nil {
		return err
	}
	defer controllerConn.Close()

	// ลบ topic
	return controllerConn.DeleteTopics(topic)
}

// รอจนกว่าจะมี topic นั้นอยู่ใน broker
func WaitForTopic(broker, topic string, timeout time.Duration) error {

	// ตรวจสอบว่ามี topic นั้นอยู่ใน broker หรือไม่
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {

		// สร้าง connection ไปยัง broker
		conn, err := kafka.Dial("tcp", broker)
		if err != nil {
			continue
		}

		// ดึง partitions จาก topic
		partitions, _ := conn.ReadPartitions(topic)
		conn.Close()

		// ตรวจสอบว่ามี partitions นั้นอยู่ใน broker หรือไม่
		if len(partitions) > 0 {
			return nil
		}

		// รอ 500 มิลลิวินาที
		time.Sleep(500 * time.Millisecond)
	}
	return fmt.Errorf("topic %s not ready", topic)
}
