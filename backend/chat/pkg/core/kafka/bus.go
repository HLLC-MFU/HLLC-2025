package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/segmentio/kafka-go"
)

type (
	// ข้อมูลของ message
	Message struct {
		Key       []byte
		Value     []byte
		Topic     string
		Partition int
		Offset    int64
		Timestamp time.Time
	}

	// ฟังก์ชันสำหรับจัดการ message
	HandlerFunc func(ctx context.Context, msg *Message) error

	// ข้อมูลของ bus
	Bus struct {
		brokers   []string // รายชื่อ brokers
		groupID   string // รหัส group
		handlers  map[string][]HandlerFunc // จับคู่ topic กับ handler
		readers   map[string]*kafka.Reader // ใช้ดึง message จาก Kafka
		writer    *kafka.Writer 
		ctx       context.Context
		cancel    context.CancelFunc
		wg        sync.WaitGroup
		mu        sync.RWMutex
	}
)

// สร้าง bus
func New(brokers []string, groupID string) *Bus {
	ctx, cancel := context.WithCancel(context.Background())
	return &Bus{
		brokers:  brokers,
		groupID:  groupID,
		handlers: map[string][]HandlerFunc{},
		readers:  map[string]*kafka.Reader{},
		writer: kafka.NewWriter(kafka.WriterConfig{
			Brokers:      brokers, 
			Balancer:     &kafka.LeastBytes{}, // จัดส่ง message ไปยัง partition ที่มีค่าน้อยที่สุด
			RequiredAcks: int(kafka.RequireOne), // ต้องรับการยืนยันจากทุก partition
			Async:        false, // ส่ง message อย่างน้อย 1 ครั้ง
			MaxAttempts:  3, // ส่ง message อย่างน้อย 3 ครั้ง
			BatchTimeout: 100 * time.Millisecond, // รอจนกว่าจะมีการส่ง message 100 มิลลิวินาที
			BatchSize:    100, // ส่ง message 100 ครั้ง
			BatchBytes:   1024 * 1024, // ส่ง message 1024 * 1024 บิต
			ReadTimeout:  2 * time.Second, // รอจนกว่าจะมีการส่ง message 2 วินาที
			WriteTimeout: 2 * time.Second, // รอจนกว่าจะมีการส่ง message 2 วินาที
		}),
		ctx:      ctx,
		cancel:   cancel,
	}
}

// สร้าง topic
func (b *Bus) CreateTopics(topics []string) error {
 
	// สร้าง connection ไปยัง broker
	conn, err := kafka.Dial("tcp", b.brokers[0])
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
	controllerConn, err := kafka.Dial("tcp", controller.Host)
	if err != nil {
		return err
	}
	defer controllerConn.Close()

	// สร้าง topic
	topicConfigs := make([]kafka.TopicConfig, len(topics))
	for i, topic := range topics {

		// สร้าง topic
		topicConfigs[i] = kafka.TopicConfig{
			Topic:             topic,
			NumPartitions:     1,
			ReplicationFactor: 1,
		}
	}

	// สร้าง topic
	err = controllerConn.CreateTopics(topicConfigs...)
	if err != nil {
		return err
	}

	return nil
}

// จับคู่ topic กับ handler
func (b *Bus) On(topic string, handler HandlerFunc) {

	// ล็อกการเข้าถึง handlers
	b.mu.Lock()
	defer b.mu.Unlock()

	// เพิ่ม handler เข้าไปใน handlers
	b.handlers[topic] = append(b.handlers[topic], handler)
}

// ส่ง message ไปยัง topic
func (b *Bus) Emit(ctx context.Context, topic, key string, payload any) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	// บันทึกการส่ง message
	log.Printf("[Kafka] Emitting message to topic=%s key=%s", topic, key)

	// สร้าง message
	msg := kafka.Message{
		Topic: topic,
		Key:   []byte(key),
		Value: data,
	}

	// ส่ง message ไปยัง topic
	err = b.writer.WriteMessages(ctx, msg)
	if err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	// บันทึกการส่ง message
	log.Printf("[Kafka] Successfully emitted message to topic=%s key=%s", topic, key)
	return nil
}

// เริ่มต้นการทำงาน
func (b *Bus) Start() error {
	
	b.mu.RLock()
	defer b.mu.RUnlock()

	// สร้าง reader สำหรับดึง message จาก topic
	for topic := range b.handlers {

		// สร้าง reader
		reader := kafka.NewReader(kafka.ReaderConfig{
			Brokers:        b.brokers,
			Topic:          topic,
			GroupID:        b.groupID,
			MinBytes:       10e3,
			MaxBytes:       10e6,
			CommitInterval: time.Second,
		})

		// เพิ่ม reader เข้าไปใน readers
		b.readers[topic] = reader

		// เพิ่มการทำงานเข้าไปใน wg
		b.wg.Add(1)

		// เริ่มการทำงาน
		go b.consume(topic, reader)
	}
	return nil
}

// หยุดการทำงาน
func (b *Bus) Stop() {
	b.cancel()
	b.wg.Wait()

	// ปิด reader
	for _, r := range b.readers {
		_ = r.Close()
	}

	// ปิด writer
	_ = b.writer.Close()
}

// ดึง message จาก topic
func (b *Bus) consume(topic string, reader *kafka.Reader) {
	defer b.wg.Done()

	// ดึง message จาก topic
	for {

		// ตรวจสอบว่ามีการยกเลิกการทำงาน
		select {
		case <-b.ctx.Done():
			return
		default:

			// ดึง message จาก topic
			msg, err := reader.ReadMessage(b.ctx)
			if err != nil {
				log.Printf("[Kafka] Error reading %s: %v", topic, err)
				time.Sleep(time.Second)
				continue
			}

			// สร้าง message
			wrapped := &Message{
				Key:       msg.Key,
				Value:     msg.Value,
				Topic:     msg.Topic,
				Partition: msg.Partition,
				Offset:    msg.Offset,
				Timestamp: msg.Time,
			}

			// จับคู่ topic กับ handler
			for _, h := range b.handlers[topic] {
				go h(context.Background(), wrapped)
			}
		}
	}
}
