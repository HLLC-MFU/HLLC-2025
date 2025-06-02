package service

import (
	"context"
	"log"
	"time"

	MemberService "github.com/HLLC-MFU/HLLC-2025/backend/module/members/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/repository"
	kafkaPublisher "github.com/HLLC-MFU/HLLC-2025/backend/pkg/kafka"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Error string

func (e Error) Error() string { return string(e) }

func NewError(text string) error {
	return Error(text)
}

type RoomService interface {
	CreateRoom(ctx context.Context, room *model.Room) error
	GetRoom(ctx context.Context, id primitive.ObjectID) (*model.Room, error)
	ListRooms(ctx context.Context, page, limit int64) ([]*model.Room, int64, error)
	UpdateRoom(ctx context.Context, room *model.Room) error
	DeleteRoom(ctx context.Context, id primitive.ObjectID) error
	ListRoomsWithMembers(ctx context.Context, memberService MemberService.MemberService) ([]map[string]interface{}, error)
}

type service struct {
	repo          repository.RoomRepository
	publisher     kafkaPublisher.Publisher
	memberService MemberService.MemberService
}

func NewService(repo repository.RoomRepository, publisher kafkaPublisher.Publisher, memberService MemberService.MemberService) RoomService {
	return &service{
		repo:          repo,
		publisher:     publisher,
		memberService: memberService,
	}
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

	// 🔄 Setup Kafka topic asynchronously
	go func(roomID primitive.ObjectID) {
		topicName := "chat-room-" + roomID.Hex()

		if err := kafkaPublisher.EnsureKafkaTopic("localhost:9092", topicName); err != nil {
			log.Printf("[Kafka] Failed to create topic %s: %v", topicName, err)
		}

		if err := kafkaPublisher.ForceCreateTopic("localhost:9092", topicName); err != nil {
			log.Printf("[Kafka] Failed to force produce to topic %s: %v", topicName, err)
		}

		if err := kafkaPublisher.WaitUntilTopicReady("localhost:9092", topicName, 10*time.Second); err != nil {
			log.Printf("[Kafka] Topic %s not ready: %v", topicName, err)
		}
	}(room.ID)

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

	// Ensure creator is not lost
	room.Creator = existing.Creator
	room.CreatedAt = existing.CreatedAt // Optional: preserve created time too

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

func (s *service) ListRoomsWithMembers(ctx context.Context, memberService MemberService.MemberService) ([]map[string]interface{}, error) {
	rooms, _, err := s.ListRooms(ctx, 1, 10)
	if err != nil {
		return nil, err
	}

	var result []map[string]interface{}

	for _, room := range rooms {
		members, err := memberService.GetRoomMembers(ctx, room.ID)
		if err != nil {
			log.Printf("[WARN] Cannot get members for room %s: %v", room.ID.Hex(), err)
			members = []primitive.ObjectID{}
		}

		result = append(result, map[string]interface{}{
			"room":    room,
			"members": members,
		})
	}

	return result, nil
}
