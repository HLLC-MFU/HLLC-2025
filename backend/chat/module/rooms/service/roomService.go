package service

import (
	"context"
	"encoding/json"
	"log"
	"time"

	ChatServicePkg "github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	MemberService "github.com/HLLC-MFU/HLLC-2025/backend/module/members/service"
	roomKafka "github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/kafka"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/repository"
	userService "github.com/HLLC-MFU/HLLC-2025/backend/module/users/service"
	kafkaPublisher "github.com/HLLC-MFU/HLLC-2025/backend/pkg/kafka"
	"github.com/segmentio/kafka-go"
	"go.mongodb.org/mongo-driver/bson"
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
	ListVisibleRooms(ctx context.Context, userID primitive.ObjectID) ([]*model.Room, error)
}

type service struct {
	repo          repository.RoomRepository
	publisher     kafkaPublisher.Publisher
	memberService MemberService.MemberService
	chatService   ChatServicePkg.ChatService
	userService   userService.UserService
}

func NewService(repo repository.RoomRepository, publisher kafkaPublisher.Publisher, memberService MemberService.MemberService, chatService ChatServicePkg.ChatService, userService userService.UserService) RoomService {
	return &service{
		repo:          repo,
		publisher:     publisher,
		memberService: memberService,
		chatService:   chatService,
		userService:   userService,
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

	//Setup Kafka topic asynchronously
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
	room.CreatedAt = existing.CreatedAt
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

	// Delete all room members first
	if err := s.memberService.DeleteRoomMembers(ctx, id); err != nil {
		log.Printf("[Room Service] Error deleting room members: %v", err)
	} else {
		log.Printf("[Room Service] Successfully deleted all members for room: %s", id.Hex())
	}

	// Delete all chat messages, reactions, and read receipts for this room
	if err := s.chatService.DeleteRoomMessages(ctx, id.Hex()); err != nil {
		log.Printf("[Room Service] Error deleting chat messages for room %s: %v", id.Hex(), err)
	} else {
		log.Printf("[Room Service] Successfully deleted all chat messages for room: %s", id.Hex())
	}

	// Publish room deletion event to Kafka
	event := roomKafka.RoomEvent{
		Type:   "room_deleted",
		RoomID: id.Hex(),
	}
	eventBytes, err := json.Marshal(event)
	if err != nil {
		log.Printf("[Room Service] Error marshaling room deletion event: %v", err)
	} else {
		writer := kafka.NewWriter(kafka.WriterConfig{
			Brokers:  []string{"localhost:9092"},
			Topic:    "room-events",
			Balancer: &kafka.LeastBytes{},
		})
		defer writer.Close()

		if err := writer.WriteMessages(ctx, kafka.Message{
			Value: eventBytes,
		}); err != nil {
			log.Printf("[Room Service] Error publishing room deletion event: %v", err)
		} else {
			log.Printf("[Room Service] Published room deletion event for room: %s", id.Hex())
		}
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

func (s *service) ListVisibleRooms(ctx context.Context, userID primitive.ObjectID) ([]*model.Room, error) {
	roomIDs, err := s.memberService.GetRoomIDsForUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	if len(roomIDs) == 0 {
		return []*model.Room{}, nil
	}

	filter := bson.M{
		"_id": bson.M{"$in": roomIDs},
	}

	return s.repo.FilterRooms(ctx, filter)
}
