package service

import (
	"context"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/redis"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MemberService interface {
	AddUserToRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error
	RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error
	GetRoomMembers(ctx context.Context, roomID primitive.ObjectID) ([]string, error)
	IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
}

type memberService struct {
	repo repository.RoomMemberRepository
}

func NewMemberService(repo repository.RoomMemberRepository) MemberService {
	return &memberService{repo: repo}
}

// service/MemberService.go

func (s *memberService) AddUserToRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	// ✅ Add to MongoDB
	if err := s.repo.AddUserToRoom(ctx, roomID, userID); err != nil {
		return err
	}

	// ✅ Add to Redis
	if err := redis.AddUserToRoom(roomID.Hex(), userID); err != nil {
		return err
	}

	log.Printf("[JOIN] User %s joined room %s", userID, roomID.Hex())
	return nil
}

func (s *memberService) RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	// Remove from MongoDB
	if err := s.repo.RemoveUserFromRoom(ctx, roomID, userID); err != nil {
		return err
	}

	// Remove from Redis
	if err := redis.RemoveUserFromRoom(roomID.Hex(), userID); err != nil {
		return err
	}

	log.Printf("[LEAVE] User %s left room %s", userID, roomID.Hex())
	return nil
}

func (s *memberService) GetRoomMembers(ctx context.Context, roomID primitive.ObjectID) ([]string, error) {
	return s.repo.GetRoomMembers(ctx, roomID)
}

func (s *memberService) IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	isMember, err := redis.IsUserInRoom(roomID.Hex(), userID)
	if err == nil && isMember {
		return true, nil
	}
	return s.repo.IsUserInRoom(ctx, roomID, userID)
}
