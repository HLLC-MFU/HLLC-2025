package service

import (
	"context"
	"log"
	"strings"
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
	GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error)
	SaveChatMessage(ctx context.Context, msg *model.ChatMessage) error
	SaveReaction(ctx context.Context, reaction *model.MessageReaction) error
	SaveReadReceipt(ctx context.Context, receipt *model.MessageReadReceipt) error
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

				if err := s.publisher.SendMessage(message.FROM.RoomID, message.FROM.UserID, message.MSG); err != nil {
					log.Printf("[Kafka] Failed to publish message: %v", err)
				}

				if err := s.repo.SaveChatMessage(context.Background(), &model.ChatMessage{
					RoomID:    message.FROM.RoomID,
					UserID:    message.FROM.UserID,
					Message:   message.MSG,
					Mentions:  mentions,
					Timestamp: time.Now(),
				}); err != nil {
					log.Printf("[MongoDB] Failed to save chat message: %v", err)
				}

				for userID, conn := range model.Clients[message.FROM.RoomID] {
					if conn == nil {
						continue
					}

					isJSON := strings.HasPrefix(strings.TrimSpace(message.MSG), "{") &&
						strings.HasSuffix(strings.TrimSpace(message.MSG), "}")

					if !isJSON && userID == message.FROM.UserID {
						continue
					}

					var outgoing string
					if isJSON {
						outgoing = message.MSG
					} else {
						outgoing = message.FROM.UserID + ": " + message.MSG
					}

					if err := conn.WriteMessage(websocket.TextMessage, []byte(outgoing)); err != nil {
						log.Printf("[WS] Failed to send message to user %s: %v", userID, err)
						conn.Close()
						delete(model.Clients[message.FROM.RoomID], userID)
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

	existing, err := s.repo.GetByName(ctx, room.Name.Th, room.Name.En)
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

	if err := kafkaPublisher.EnsureKafkaTopic("localhost:9092", topicName); err != nil {
		log.Printf("[Kafka] Failed to create topic %s: %v", topicName, err)
	}
	if err := kafkaPublisher.ForceCreateTopic("localhost:9092", topicName); err != nil {
		log.Printf("[Kafka] Failed to force produce to topic %s: %v", topicName, err)
	}
	time.Sleep(5 * time.Second)
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

func (s *service) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error) {
	rawMessages, err := s.repo.GetChatHistoryByRoom(ctx, roomID, limit)
	if err != nil {
		return nil, err
	}

	var enriched []model.ChatMessageEnriched
	for _, msg := range rawMessages {
		reactions, _ := s.repo.GetReactionsByMessageID(ctx, msg.ID)
		reads, _ := s.repo.GetReadReceiptsByMessageID(ctx, msg.ID)

		var replyTo *model.ChatMessage
		if msg.ReplyToID != nil {
			replyTo, _ = s.repo.GetMessageByID(ctx, *msg.ReplyToID)
		}

		enriched = append(enriched, model.ChatMessageEnriched{
			ChatMessage:  msg,
			Reactions:    reactions,
			ReadReceipts: reads,
			ReplyTo:      replyTo,
		})
	}

	return enriched, nil
}

func (s *service) SaveChatMessage(ctx context.Context, msg *model.ChatMessage) error {
	id, err := s.repo.Save(ctx, msg)
	if err != nil {
		return err
	}
	msg.ID = id
	return nil
}

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

			for _, userID := range memberIDs {
				userIDStr := userID.Hex()
				if _, exists := model.Clients[room.ID.Hex()][userIDStr]; !exists {
					model.Clients[room.ID.Hex()][userIDStr] = nil
				}
				log.Printf("[SYNC] User %s is a member of room %s", userIDStr, room.ID.Hex())
			}
		}
	}

	log.Println("[SYNC] Room membership synchronized")
}

func (s *service) SaveReaction(ctx context.Context, reaction *model.MessageReaction) error {
	return s.repo.SaveReaction(ctx, reaction)
}

func (s *service) SaveReadReceipt(ctx context.Context, receipt *model.MessageReadReceipt) error {
	return s.repo.SaveReadReceipt(ctx, receipt)
}
