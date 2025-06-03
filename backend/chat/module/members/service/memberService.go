package service

import (
	"context"
	"fmt"
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/members/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/redis"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MemberService interface {
	AddUserToRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error
	RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error
	GetRoomMembers(ctx context.Context, roomID primitive.ObjectID) ([]primitive.ObjectID, error)
	IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error)
	DeleteRoomMembers(ctx context.Context, roomID primitive.ObjectID) error
}

type memberService struct {
	repo repository.RoomMemberRepository
}

func NewMemberService(repo repository.RoomMemberRepository) MemberService {
	return &memberService{repo: repo}
}

func (s *memberService) AddUserToRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("[ERROR] Invalid user ID: %v", err)
		return err
	}

	// ✅ Add to MongoDB
	if err := s.repo.AddUserToRoom(ctx, roomID, userObjID); err != nil {
		return err
	}

	// ✅ Add to Redis
	if err := redis.AddUserToRoom(roomID.Hex(), userObjID.Hex()); err != nil {
		return err
	}

	log.Printf("[JOIN] User %s joined room %s", userID, roomID.Hex())
	return nil
}

func (s *memberService) RemoveUserFromRoom(ctx context.Context, roomID primitive.ObjectID, userID string) error {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("[ERROR] Invalid user ID: %v", err)
		return err
	}

	// ✅ Remove from MongoDB
	if err := s.repo.RemoveUserFromRoom(ctx, roomID, userObjID); err != nil {
		return err
	}

	// ✅ Remove from Redis
	if err := redis.RemoveUserFromRoom(roomID.Hex(), userObjID.Hex()); err != nil {
		return err
	}

	log.Printf("[LEAVE] User %s left room %s", userID, roomID.Hex())
	return nil
}

func (s *memberService) GetRoomMembers(ctx context.Context, roomID primitive.ObjectID) ([]primitive.ObjectID, error) {
	return s.repo.GetRoomMembers(ctx, roomID)
}

func (s *memberService) IsUserInRoom(ctx context.Context, roomID primitive.ObjectID, userID string) (bool, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return false, err
	}
	return s.repo.IsUserInRoom(ctx, roomID, userObjID)
}

// DeleteRoomMembers deletes all members for a room from both MongoDB and Redis
func (s *memberService) DeleteRoomMembers(ctx context.Context, roomID primitive.ObjectID) error {
	// Delete from MongoDB
	if err := s.repo.DeleteRoomMembers(ctx, roomID); err != nil {
		log.Printf("[ERROR] Failed to delete room members from MongoDB for room %s: %v", roomID.Hex(), err)
		return err
	}

	// Delete from Redis
	key := fmt.Sprintf("room:%s", roomID.Hex())
	if err := redis.DeleteRoomMembers(key); err != nil {
		log.Printf("[ERROR] Failed to delete room members from Redis for room %s: %v", roomID.Hex(), err)
		return err
	}

	log.Printf("[DELETE] Deleted all members for room %s", roomID.Hex())
	return nil
}
