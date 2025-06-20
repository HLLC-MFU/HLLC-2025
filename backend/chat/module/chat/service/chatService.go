package service

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"chat/module/chat/model"

	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const messageHistoryLimit = 50

type Client struct {
	UserID string
	RoomID string
	Conn   *websocket.Conn
}

type ChatService struct {
	db       *mongo.Database
	clients  map[string]map[string]*websocket.Conn // roomID -> userID -> connection
	mu       sync.RWMutex
}

func NewChatService(db *mongo.Database) *ChatService {
	return &ChatService{
		db:      db,
		clients: make(map[string]map[string]*websocket.Conn),
	}
}

func (s *ChatService) HandleWebSocket(c *websocket.Conn, userID, roomID string) {
	// Register client
	s.mu.Lock()
	if s.clients[roomID] == nil {
		s.clients[roomID] = make(map[string]*websocket.Conn)
	}
	s.clients[roomID][userID] = c
	s.mu.Unlock()

	// Cleanup on disconnect
	defer func() {
		s.mu.Lock()
		delete(s.clients[roomID], userID)
		if len(s.clients[roomID]) == 0 {
			delete(s.clients, roomID)
		}
		s.mu.Unlock()
		c.Close()
	}()

	// Send chat history
	if err := s.sendChatHistory(c, roomID); err != nil {
		log.Printf("Error sending chat history: %v", err)
		return
	}

	// Handle messages
	for {
		_, msg, err := c.ReadMessage()
		if err != nil {
			break
		}

		var message model.Message
		if err := json.Unmarshal(msg, &message); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		// Set message metadata
		message.ID = primitive.NewObjectID()
		message.CreatedAt = time.Now()
		message.RoomID, _ = primitive.ObjectIDFromHex(roomID)
		message.UserID, _ = primitive.ObjectIDFromHex(userID)

		// Save to database
		if err := s.saveMessage(&message); err != nil {
			log.Printf("Error saving message: %v", err)
			continue
		}

		// Broadcast to room
		s.broadcastToRoom(roomID, message)
	}
}

func (s *ChatService) saveMessage(msg *model.Message) error {
	_, err := s.db.Collection("messages").InsertOne(context.Background(), msg)
	return err
}

func (s *ChatService) sendChatHistory(c *websocket.Conn, roomID string) error {
	roomObjID, _ := primitive.ObjectIDFromHex(roomID)
	limit := int64(messageHistoryLimit)
	
	cursor, err := s.db.Collection("messages").Find(
		context.Background(),
		bson.M{"roomId": roomObjID},
		options.Find().SetSort(bson.M{"createdAt": -1}).SetLimit(limit),
	)
	if err != nil {
		return err
	}
	defer cursor.Close(context.Background())

	var messages []model.Message
	if err := cursor.All(context.Background(), &messages); err != nil {
		return err
	}

	return c.WriteJSON(messages)
}

func (s *ChatService) broadcastToRoom(roomID string, msg model.Message) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	clients := s.clients[roomID]
	for _, conn := range clients {
		if err := conn.WriteJSON(msg); err != nil {
			log.Printf("Error broadcasting message: %v", err)
		}
	}
}