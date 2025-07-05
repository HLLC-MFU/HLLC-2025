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
		writers   map[string]*kafka.Writer // writer สำหรับแต่ละ topic
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
		handlers: map[string][]HandlerFunc{}, // จับคู่ topic กับ handler
		readers:  map[string]*kafka.Reader{}, // ตัวอ่าน
		writers:  map[string]*kafka.Writer{}, // ทำการเขีน
		ctx:      ctx,
		cancel:   cancel,
	}
}

// สร้าง topic
func (b *Bus) CreateTopics(topics []string) error {
	log.Printf("[Kafka] Creating topics: %v", topics)
 
	// สร้าง connection ไปยัง broker
	conn, err := kafka.Dial("tcp", b.brokers[0])
	if err != nil {
		log.Printf("[Kafka] Failed to dial broker %s: %v", b.brokers[0], err)
		return err
	}
	defer conn.Close()

	// ดึง controller จาก broker
	controller, err := conn.Controller()
	if err != nil {
		log.Printf("[Kafka] Failed to get controller: %v", err)
		return err
	}

	// สร้าง connection ไปยัง controller (with proper port)
	controllerAddr := fmt.Sprintf("%s:%d", controller.Host, controller.Port)
	log.Printf("[Kafka] Connecting to controller at %s", controllerAddr)
	
	controllerConn, err := kafka.Dial("tcp", controllerAddr)
	if err != nil {
		log.Printf("[Kafka] Failed to connect to controller %s: %v", controllerAddr, err)
		return err
	}
	defer controllerConn.Close()

	// สร้าง topic
	topicConfigs := make([]kafka.TopicConfig, len(topics))
	for i, topic := range topics {
		log.Printf("[Kafka] Preparing to create topic: %s", topic)

		// สร้าง topic
		topicConfigs[i] = kafka.TopicConfig{
			Topic:             topic,
			NumPartitions:     1, // แบ่ง broker ให้ 1 ตัว ถ้าเป็น 2 ตัวก็จะแบ่งเป็น 2 ตัว
			ReplicationFactor: 1, // กำหนดจำนวนการทำงานของ broker ถ้าเป็น 2 ตัวก็จะทำงาน 2 ตัว
		}
	}

	// สร้าง topic
	err = controllerConn.CreateTopics(topicConfigs...)
	if err != nil {
		log.Printf("[Kafka] Failed to create topics: %v", err)
		return err
	}

	log.Printf("[Kafka] Successfully created %d topics", len(topics))
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

// getWriter returns a dedicated writer for the specified topic
func (b *Bus) getWriter(topic string) (*kafka.Writer, error) {
	b.mu.Lock()
	defer b.mu.Unlock()

	// ตรวจสอบว่ามี writer สำหรับ topic นี้แล้วหรือไม่
	if writer, exists := b.writers[topic]; exists {
		return writer, nil
	}

	// หา broker ที่รับผิดชอบ topic นี้
	broker, exists := GetTopicBroker(topic)
	if !exists {
		// ถ้ายังไม่มี topic ให้สร้างใหม่
		if err := EnsureTopic(b.brokers, topic, 20); err != nil {
			return nil, fmt.Errorf("failed to create topic %s: %v", topic, err)
		}
		broker, _ = GetTopicBroker(topic)
	}

	// สร้าง writer ใหม่สำหรับ topic นี้
	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers:      []string{broker}, // ใช้เฉพาะ broker ที่รับผิดชอบ topic นี้
		Topic:        topic,
		Balancer:     &kafka.Hash{}, // ใช้ Hash partitioner
		RequiredAcks: int(kafka.RequireOne),
		Async:        true,
		BatchTimeout: 50 * time.Millisecond,
		BatchSize:    1000,
		BatchBytes:   1024 * 1024 * 5,
		ReadTimeout:  2 * time.Second,
		WriteTimeout: 2 * time.Second,
	})

	b.writers[topic] = writer
	return writer, nil
}

// Emit ส่ง message ไปยัง topic
func (b *Bus) Emit(ctx context.Context, topic, key string, payload any) error {
	writer, err := b.getWriter(topic)
	if err != nil {
		return fmt.Errorf("failed to get writer for topic %s: %v", topic, err)
	}

	value, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	return writer.WriteMessages(ctx, kafka.Message{
		Key:   []byte(key),
		Value: value,
	})
}

// เริ่มต้นการทำงาน
func (b *Bus) Start() error {
	
	// ล็อกการเข้าถึง handlers
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

	// ปิด writers ทั้งหมด
	for _, writer := range b.writers {
		writer.Close()
	}

	// ปิด readers ทั้งหมด
	for _, reader := range b.readers {
		reader.Close()
	}
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
				go func(handler HandlerFunc) {
					defer func() {
						if r := recover(); r != nil {
							log.Printf("[Kafka] Handler panic recovered: %v", r)
						}
					}()
			
					// เรียกใช้งาน handler
					if err := handler(context.Background(), wrapped); err != nil {
						log.Printf("[Kafka] Handler error (will not commit): %v", err)
						// Optional: retry / push to DLQ
						return
					}
			
					// ✅ Commit เมื่อ handler สำเร็จ
					if err := reader.CommitMessages(context.Background(), msg); err != nil {
						log.Printf("[Kafka] Commit failed: %v", err)
					} else {
						log.Printf("[Kafka] ✅ Message committed: offset=%d topic=%s", msg.Offset, msg.Topic)
					}
				}(h)
			}			
		}
	}
}
