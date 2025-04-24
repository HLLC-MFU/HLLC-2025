package service

import (
	"context"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Error string

func (e Error) Error() string { return string(e) }

func NewError(text string) error {
	return Error(text)
}

func (s *service) InitChatHub() {
	go func() {
		for {
			select {
			case client := <-model.Register:
				log.Printf("[REGISTER] %s joined room %s\n", client.UserID, client.RoomID)

			case client := <-model.Unregister:
				log.Printf("[UNREGISTER] %s left room %s\n", client.UserID, client.RoomID)

			case message := <-model.Broadcast:
				log.Printf("[BROADCAST] Message from %s in room %s: %s\n", message.FROM.UserID, message.FROM.RoomID, message.MSG)

				// ✅ ✅ ✅ ใส่ตรงนี้เพื่อเก็บข้อความลง buffer ก่อนจะ broadcast
				model.AppendMessageToBuffer(message.FROM.RoomID, model.MessageEntry{
					UserID:    message.FROM.UserID,
					Text:      message.MSG,
					Timestamp: time.Now(),
				})

				for userID, conn := range model.Clients[message.FROM.RoomID] {
					if userID != message.FROM.UserID {
						err := conn.WriteMessage(1, []byte(message.FROM.UserID+": "+message.MSG))
						if err != nil {
							log.Printf("[ERROR] Write to user %s failed: %v\n", userID, err)
							conn.Close()
							delete(model.Clients[message.FROM.RoomID], userID)
						}
					}
				}
			}
		}
	}()

	// ✅ Now s.repo is valid
	model.FlushChatBufferToDatabase(func(ctx context.Context, roomID string, messages []model.MessageEntry) error {
		return s.repo.SaveChatMessages(ctx, roomID, messages)
	})
}

type Service interface {
	CreateRoom(ctx context.Context, room *model.Room) error
	GetRoom(ctx context.Context, id primitive.ObjectID) (*model.Room, error)
	ListRooms(ctx context.Context, page, limit int64) ([]*model.Room, int64, error)
	UpdateRoom(ctx context.Context, room *model.Room) error
	DeleteRoom(ctx context.Context, id primitive.ObjectID) error
	InitChatHub()
	GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.MessageEntry, error)

}

type service struct {
	repo repository.Repository
}

func NewService(repo repository.Repository) Service {
	return &service{
		repo: repo,
	}
}

func (s *service) CreateRoom(ctx context.Context, room *model.Room) error {
	// Set timestamps
	now := time.Now()
	room.CreatedAt = now
	room.UpdatedAt = now

	// Check if room with same name exists
	existing, err := s.repo.GetByName(ctx, room.Name.ThName, room.Name.EnName)
	if err != nil {
		return err
	}
	if existing != nil {
		return NewError("room already exists")
	}

	return s.repo.Create(ctx, room)
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

func (s *service) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.MessageEntry, error) {
	return s.repo.GetChatHistoryByRoom(ctx, roomID, limit)
}