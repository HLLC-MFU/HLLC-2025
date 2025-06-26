package kafka

import (
	"fmt"
	"time"

	"github.com/segmentio/kafka-go"
)

// สร้าง topic หากไม่มี
func EnsureTopic(broker, topic string, partitions int) error {

	// ตรวจสอบว่ามี topic นั้นอยู่ใน broker หรือไม่
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
	cConn, err := kafka.Dial("tcp", fmt.Sprintf("%s:%d", controller.Host, controller.Port))
	if err != nil {
		return err
	}
	defer cConn.Close()

	// สร้าง topic
	return cConn.CreateTopics(kafka.TopicConfig{
		Topic:             topic,
		NumPartitions:     partitions,
		ReplicationFactor: 1,
	})
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
