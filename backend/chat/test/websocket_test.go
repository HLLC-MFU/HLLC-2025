package test

import (
	"context"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"regexp"
	"runtime"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	wsEndpoint = "ws://localhost:1334/chat/ws/%s/%s" // roomId/userId
	mongoURI   = "mongodb://localhost:27017"
	dbName     = "hllc_db"
)

// 🔧 ดึง ObjectId string จาก ObjectId(...) ด้วย regex
var objectIdRegex = regexp.MustCompile(`ObjectId\(([^)]+)\)`)

// ✅ ฟังก์ชันโหลด user id จากไฟล์ CSV
func loadUserIDsFromCSV(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	lines, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	var ids []string
	for i, line := range lines {
		if i == 0 {
			continue // skip header
		}
		raw := strings.TrimSpace(line[0])
		matches := objectIdRegex.FindStringSubmatch(raw)
		if len(matches) == 2 {
			ids = append(ids, matches[1])
		}
	}

	return ids, nil
}

var testUsers []string

func init() {
	var err error
	testUsers, err = loadUserIDsFromCSV("../user_ids.csv")
	if err != nil {
		log.Fatalf("❌ Failed to load user IDs from CSV: %v", err)
		}
	log.Printf("✅ Loaded %d user IDs from CSV", len(testUsers))
}

func createTestRoom(ctx context.Context, db *mongo.Database) (primitive.ObjectID, error) {
	room := bson.M{
		"name": bson.M{
			"th": "ห้องทดสอบ WebSocket",
			"en": "WebSocket Test Room",
		},
		"type":      "normal",
		"capacity":  0,
		"members":   []primitive.ObjectID{},
		"createdAt": time.Now(),
		"updatedAt": time.Now(),
	}

	result, err := db.Collection("rooms").InsertOne(ctx, room)
	if err != nil {
		return primitive.NilObjectID, err
	}

	return result.InsertedID.(primitive.ObjectID), nil
}

func addUsersToRoom(ctx context.Context, db *mongo.Database, roomID primitive.ObjectID, userIDs []string) error {
	var userObjectIDs []primitive.ObjectID
	for _, id := range userIDs {
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return fmt.Errorf("invalid user ID %s: %v", id, err)
		}
		userObjectIDs = append(userObjectIDs, objID)
	}

	_, err := db.Collection("rooms").UpdateOne(
		ctx,
		bson.M{"_id": roomID},
		bson.M{"$addToSet": bson.M{"members": bson.M{"$each": userObjectIDs}}},
	)
	return err
}

// TestMassiveConnections ทดสอบการเชื่อมต่อ WebSocket จำนวนมากพร้อมกัน
func TestMassiveConnections(t *testing.T) {
	ctx := context.Background()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(ctx)

	db := client.Database(dbName)

	roomID, err := createTestRoom(ctx, db)
	if err != nil {
		t.Fatalf("Failed to create test room: %v", err)
	}

	if err := addUsersToRoom(ctx, db, roomID, testUsers); err != nil {
		t.Fatalf("Failed to add users to room: %v", err)
	}

	log.Printf("Created test room %s with %d initial members", roomID.Hex(), len(testUsers))

	// กำหนดค่าพารามิเตอร์สำหรับการทดสอบ
	totalConnections := 10000
	concurrentLimit := 200     // จำนวน goroutines ที่จะรันพร้อมกัน
	connectionTimeout := 30 * time.Second
	
	log.Printf("🔥 MASSIVE CONNECTION TEST: Attempting %d concurrent connections...", totalConnections)
	log.Printf("Settings: Concurrent Limit=%d, Timeout=%v", concurrentLimit, connectionTimeout)

	// สร้าง connection pool และ channels สำหรับจัดการผลลัพธ์
	connections := make([]*websocket.Conn, totalConnections)
	errors := make(chan error, totalConnections)
	successes := make(chan int, totalConnections)
	semaphore := make(chan struct{}, concurrentLimit)

	// สร้าง WaitGroup สำหรับรอให้ทุก connection เสร็จสิ้น
	var wg sync.WaitGroup
	wg.Add(totalConnections)

	// เริ่มจับเวลา
	start := time.Now()

	// Monitor goroutine สำหรับแสดงความคืบหน้า
	progressTicker := time.NewTicker(5 * time.Second)
	go func() {
		for range progressTicker.C {
			successCount := len(successes)
			errorCount := len(errors)
			totalDone := successCount + errorCount
			if totalDone >= totalConnections {
				progressTicker.Stop()
				return
			}
			log.Printf("Progress: %d/%d connections (Success: %d, Failed: %d)", 
				totalDone, totalConnections, successCount, errorCount)
		}
	}()

	// เริ่มสร้าง connections
	for i := 0; i < totalConnections; i++ {
		go func(index int) {
			defer wg.Done()
			
			// รอ semaphore
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			userIndex := index % len(testUsers)
			userID := testUsers[userIndex]
			url := fmt.Sprintf(wsEndpoint, roomID.Hex(), userID)

			// สร้าง dialer with timeout
			dialer := websocket.Dialer{
				HandshakeTimeout: connectionTimeout,
				ReadBufferSize:  1024,
				WriteBufferSize: 1024,
			}

			// พยายามเชื่อมต่อ
			conn, _, err := dialer.Dial(url, nil)
			if err != nil {
				errors <- fmt.Errorf("connection %d (user %s) failed: %v", index, userID, err)
				return
			}

			connections[index] = conn
			successes <- index

			// แสดงความคืบหน้าทุก 500 connections
			if index%500 == 0 {
				log.Printf("Connection milestone: %d connections established", index)
			}

		}(i)
	}

	// รอให้ทุก connection เสร็จสิ้น
	wg.Wait()
	progressTicker.Stop()

	// ปิด channels
	close(errors)
	close(successes)
	duration := time.Since(start)

	// นับจำนวน successes และ errors
	successCount := len(successes)
	errorCount := len(errors)

	// แสดงตัวอย่างของ errors (ถ้ามี)
	if errorCount > 0 {
		log.Printf("Sample of connection errors:")
		errorSamples := 0
		for err := range errors {
			if errorSamples < 5 {
				log.Printf("- %v", err)
				errorSamples++
			} else {
				break
			}
		}
	}

	// ปิด connections ที่สำเร็จ
	log.Printf("Closing %d successful connections...", successCount)
	closeStart := time.Now()
	
	// ใช้ mutex เพื่อป้องกัน race condition ในการนับ connections
	var closeMutex sync.Mutex
	closedCount := 0
	
	// สร้าง channel สำหรับรอการปิด connections
	closeDone := make(chan struct{})
	
	// เริ่มปิด connections แบบ parallel
	for i, conn := range connections {
		if conn != nil {
			go func(index int, c *websocket.Conn) {
				defer func() {
					closeMutex.Lock()
					closedCount++
					if closedCount == successCount {
						close(closeDone)
					}
					closeMutex.Unlock()
				}()
				
				// ส่ง close message ก่อนปิด connection
				c.WriteControl(websocket.CloseMessage, 
					websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""), 
					time.Now().Add(time.Second))
				c.Close()
			}(i, conn)
		}
	}
	
	// รอให้ปิด connections เสร็จสิ้น (timeout 30 วินาที)
	select {
	case <-closeDone:
		log.Printf("All connections closed successfully")
	case <-time.After(30 * time.Second):
		log.Printf("Warning: Connection close timeout after 30 seconds")
	}
	
	closeDuration := time.Since(closeStart)

	// แสดงผลสรุป
	log.Printf("\n=== MASSIVE CONNECTION TEST SUMMARY ===")
	log.Printf("Total test duration: %v", duration)
	log.Printf("Connection close duration: %v", closeDuration)
	log.Printf("Total connections attempted: %d", totalConnections)
	log.Printf("Successful connections: %d", successCount)
	log.Printf("Failed connections: %d", errorCount)
	log.Printf("Success rate: %.2f%%", float64(successCount)/float64(totalConnections)*100)
	log.Printf("Average connection time: %.2f ms/conn", float64(duration.Milliseconds())/float64(totalConnections))
	log.Printf("Connection rate: %.2f conn/sec", float64(successCount)/duration.Seconds())
	
	// คำนวณ memory usage
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	log.Printf("Memory usage: %.2f MB", float64(m.Alloc)/1024/1024)
	log.Printf("Total memory allocated: %.2f MB", float64(m.TotalAlloc)/1024/1024)
	log.Printf("Memory obtained from system: %.2f MB", float64(m.Sys)/1024/1024)

	// เช็คเงื่อนไขความสำเร็จ
	successRate := float64(successCount) / float64(totalConnections)
	if successRate < 0.8 {
		t.Errorf("Connection success rate too low: %.2f%% (expected at least 80%%)", successRate*100)
	}

	if successCount > 8000 {
		log.Printf("🚀 EXCELLENT PERFORMANCE: Successfully maintained %d concurrent WebSocket connections!", successCount)
	}
}

