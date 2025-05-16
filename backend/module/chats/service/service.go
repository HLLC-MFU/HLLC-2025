package service

import (
	"context"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/redis"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/utils"
	kafkaPublisher "github.com/HLLC-MFU/HLLC-2025/backend/pkg/kafka"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Error string

func (e Error) Error() string { return string(e) }

func NewError(text string) error {
	return Error(text)
}

type Service interface {
	CreateRoom(ctx context.Context, room *model.Room) error
	GetRoom(ctx context.Context, id primitive.ObjectID) (*model.Room, error)
	ListRooms(ctx context.Context, page, limit int64) ([]*model.Room, int64, error)
	UpdateRoom(ctx context.Context, room *model.Room) error
	DeleteRoom(ctx context.Context, id primitive.ObjectID) error
	InitChatHub()
	GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessage, error)
	SaveChatMessage(ctx context.Context, msg *model.ChatMessage) error
	SyncRoomMembers()
}

type service struct {
	repo      repository.Repository
	publisher kafkaPublisher.Publisher
}

func NewService(repo repository.Repository, publisher kafkaPublisher.Publisher) Service {
	return &service{
		repo:      repo,
		publisher: publisher,
	}
}

func (s *service) InitChatHub() {
	go func() {
		for {
			select {
			case client := <-model.Register:
				model.Clients[client.RoomID][client.UserID] = client.Conn
				log.Printf("[REGISTER] %s joined room %s", client.UserID, client.RoomID)

			case client := <-model.Unregister:
				delete(model.Clients[client.RoomID], client.UserID)
				redis.RemoveUserFromRoom(client.RoomID, client.UserID)
				log.Printf("[UNREGISTER] %s left room %s", client.UserID, client.RoomID)

			case message := <-model.Broadcast:
				log.Printf("[BROADCAST] Message from %s in room %s: %s", message.FROM.UserID, message.FROM.RoomID, message.MSG)

				mentions := utils.ExtractMentions(message.MSG)

				// ✅ สำคัญ!! เติม "chat-room-" ตอนส่ง Kafka
				err := s.publisher.SendMessage(message.FROM.RoomID, message.FROM.UserID, message.MSG)
				if err != nil {
					log.Printf("[Kafka] Failed to publish message: %v", err)
				}

				// ✅ Save ลง MongoDB ด้วย
				saveErr := s.repo.SaveChatMessage(context.Background(), &model.ChatMessage{
					RoomID:    message.FROM.RoomID,
					UserID:    message.FROM.UserID,
					Message:   message.MSG,
					Mentions:  mentions,
					Timestamp: time.Now(),
				})
				if saveErr != nil {
					log.Printf("[MongoDB] Failed to save chat message: %v", saveErr)
				}

				// ✅ Broadcast ต่อให้คนในห้อง
				for userID, conn := range model.Clients[message.FROM.RoomID] {
					if userID != message.FROM.UserID && conn != nil {
						err := conn.WriteMessage(websocket.TextMessage, []byte(message.FROM.UserID+": "+message.MSG))
						if err != nil {
							log.Printf("[MEMORY] Failed to send message to user %s: %v", userID, err)
							conn.Close()
							delete(model.Clients[message.FROM.RoomID], userID)
						}
					}
				}
			}
		}
	}()
}

func (s *service) CreateRoom(ctx context.Context, room *model.Room) error {
	now := time.Now()
	room.CreatedAt = now
	room.UpdatedAt = now

	existing, err := s.repo.GetByName(ctx, room.Name.ThName, room.Name.EnName)
	if err != nil {
		return err
	}
	if existing != nil {
		return NewError("room already exists")
	}

	if err := s.repo.Create(ctx, room); err != nil {
		return err
	}

	topicName := "chat-room-" + room.ID.Hex()

	// Step 1: Create Kafka topic
	if err := kafkaPublisher.EnsureKafkaTopic("localhost:9092", topicName); err != nil {
		log.Printf("[Kafka] Failed to create topic %s: %v", topicName, err)
	}

	// Step 2: Force produce message to create partition
	if err := kafkaPublisher.ForceCreateTopic("localhost:9092", topicName); err != nil {
		log.Printf("[Kafka] Failed to force produce to topic %s: %v", topicName, err)
	}

	// Step 3: Sleep 1-2 second เพื่อให้ Kafka "register" topic ใหม่เข้า broker
	time.Sleep(5 * time.Second)

	// Step 4: Check if topic ready
	if err := kafkaPublisher.WaitUntilTopicReady("localhost:9092", topicName, 10*time.Second); err != nil {
		log.Printf("[Kafka] Topic %s not ready: %v", topicName, err)
	}

	return nil
}

func (s *service) GetRoom(ctx context.Context, id primitive.ObjectID) (*model.Room, error) {
	return s.repo.GetById(ctx, id)
}

func (s *service) ListRooms(ctx context.Context, page, limit int64) ([]*model.Room, int64, error) {
	return s.repo.List(ctx, page, limit)
}

func (s *service) UpdateRoom(ctx context.Context, room *model.Room) error {
	existing, err := s.repo.GetById(ctx, room.ID)
	if err != nil {
		return err
	}
	if existing == nil {
		return NewError("room not found")
	}
	return s.repo.Update(ctx, room)
}

func (s *service) DeleteRoom(ctx context.Context, id primitive.ObjectID) error {
	existing, err := s.repo.GetById(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return NewError("room not found")
	}
	return s.repo.Delete(ctx, id)
}

func (s *service) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessage, error) {
	return s.repo.GetChatHistoryByRoom(ctx, roomID, limit)
}

func (s *service) SaveChatMessage(ctx context.Context, msg *model.ChatMessage) error {
	return s.repo.SaveChatMessage(ctx, msg)
}

// Sync Redis members to in-memory map on startup
func (s *service) SyncRoomMembers() {
	rooms, _, err := s.repo.List(context.Background(), 1, 1000)
	if err != nil {
		log.Printf("[SYNC] Failed to fetch rooms from database: %v", err)
		return
	}

	for _, room := range rooms {
		memberIDs, err := redis.GetRoomMembers(room.ID.Hex())
		if err != nil {
			log.Printf("[SYNC] Failed to get members for room %s: %v", room.ID.Hex(), err)
			continue
		}

		if len(memberIDs) > 0 {
			if model.Clients[room.ID.Hex()] == nil {
				model.Clients[room.ID.Hex()] = make(map[string]*websocket.Conn)
			}

			// Ensure only connected users are counted
			for _, userID := range memberIDs {
				userIDStr := userID.Hex() // Convert to string
				if _, exists := model.Clients[room.ID.Hex()][userIDStr]; !exists {
					model.Clients[room.ID.Hex()][userIDStr] = nil
				}
				log.Printf("[SYNC] User %s is a member of room %s", userIDStr, room.ID.Hex())
			}
		}
	}

	log.Println("[SYNC] Room membership synchronized")
}
