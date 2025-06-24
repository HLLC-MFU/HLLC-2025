package utils

import (
	"chat/module/room/model"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	defaultRoomTTL = 24 * time.Hour
	defaultMembersTTL = 1 * time.Hour
	defaultConnectionTTL = 5 * time.Minute
)

type RoomCacheService struct {
	redis *redis.Client
}

func NewRoomCacheService(redis *redis.Client) *RoomCacheService {
	return &RoomCacheService{redis: redis}
}

// Key generators
func (s *RoomCacheService) roomKey(roomID string) string {
	return fmt.Sprintf("room:%s", roomID)
}

func (s *RoomCacheService) membersKey(roomID string) string {
	return fmt.Sprintf("room:%s:members", roomID)
}

func (s *RoomCacheService) connectionKey(roomID, userID string) string {
	return fmt.Sprintf("room:%s:connection:%s", roomID, userID)
}

func (s *RoomCacheService) activeConnectionsKey(roomID string) string {
	return fmt.Sprintf("room:%s:active_connections", roomID)
}

func (s *RoomCacheService) GetRoom(ctx context.Context, roomID string) (*model.Room, error) {
	key := s.roomKey(roomID)
	data, err := s.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var room model.Room
	if err := json.Unmarshal([]byte(data), &room); err != nil {
		return nil, err
	}

	s.redis.Expire(ctx, key, defaultRoomTTL)

	return &room, nil
}

func (s *RoomCacheService) SaveRoom(ctx context.Context, room *model.Room) error {
	key := s.roomKey(room.ID.Hex())
	data, err := json.Marshal(room)
	if err != nil {
		return err
	}
	if err := s.redis.SetEx(ctx, key, data, defaultRoomTTL).Err(); err != nil {
		return err
	}
	return s.SaveMembers(ctx, room.ID.Hex(), room.Members)
}

func (s *RoomCacheService) DeleteRoom(ctx context.Context, roomID string) error {
	pipe := s.redis.Pipeline()

	pipe.Del(ctx, s.roomKey(roomID))
	pipe.Del(ctx, s.membersKey(roomID))
	
	_, err := pipe.Exec(ctx)
	return err
}

func (s *RoomCacheService) GetMembers(ctx context.Context, roomID string) ([]primitive.ObjectID, error) {
	key := s.membersKey(roomID)
	data, err := s.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var members []primitive.ObjectID
	if err := json.Unmarshal([]byte(data), &members); err != nil {
		return nil, err
	}

	s.redis.Expire(ctx, key, defaultMembersTTL)
	return members, nil
}

func (s *RoomCacheService) SaveMembers(ctx context.Context, roomID string, members []primitive.ObjectID) error {
	key := s.membersKey(roomID)
	data, err := json.Marshal(members)
	if err != nil {
		return err
	}
	return s.redis.SetEx(ctx, key, data, defaultMembersTTL).Err()
}

func (s *RoomCacheService) AddMember(ctx context.Context, roomID string, memberID primitive.ObjectID) error {
	members, err := s.GetMembers(ctx, roomID)
	if err != nil && err != redis.Nil {
		return err
	}

	for _, m := range members {
		if m == memberID {
			return nil
		}
	}

	members = append(members, memberID)
	return s.SaveMembers(ctx, roomID, members)
}

func (s *RoomCacheService) RemoveMember(ctx context.Context, roomID string, memberID primitive.ObjectID) error {
	members, err := s.GetMembers(ctx, roomID)
	if err != nil && err != redis.Nil {
		return err
	}

	filtered := make([]primitive.ObjectID, 0, len(members))
	for _, m := range members {
		if m != memberID {
			filtered = append(filtered, m)
		}
	}

	return s.SaveMembers(ctx, roomID, filtered)
}

func (s *RoomCacheService) IsMember(ctx context.Context, roomID string, memberID primitive.ObjectID) (bool, error) {
	members, err := s.GetMembers(ctx, roomID)
	if err != nil {
		return false, err
	}

	for _, m := range members {
		if m == memberID {
			return true, nil
		}
	}
	return false, nil
}

func (s *RoomCacheService) GetMemberCount(ctx context.Context, roomID string) (int, error) {
	members, err := s.GetMembers(ctx, roomID)
	if err != nil {
		return 0, err
	}
	return len(members), nil
}

func (s *RoomCacheService) TrackConnection(ctx context.Context, roomID, userID string) error {
	pipe := s.redis.Pipeline()

	pipe.SAdd(ctx, s.activeConnectionsKey(roomID), userID)
	pipe.Expire(ctx, s.activeConnectionsKey(roomID), defaultConnectionTTL)

	connKey := s.connectionKey(roomID, userID)
	pipe.Set(ctx, connKey, time.Now().Unix(), defaultConnectionTTL)

	_, err := pipe.Exec(ctx)
	return err
}

func (s *RoomCacheService) RemoveConnection(ctx context.Context, roomID, userID string) error {
	pipe := s.redis.Pipeline()

	pipe.SRem(ctx, s.activeConnectionsKey(roomID), userID)
	pipe.Del(ctx, s.connectionKey(roomID, userID))

	_, err := pipe.Exec(ctx)
	return err
}

func (s *RoomCacheService) GetActiveConnectionsCount(ctx context.Context, roomID string) (int64, error) {
	return s.redis.SCard(ctx, s.activeConnectionsKey(roomID)).Result()
}

func (s *RoomCacheService) HasActiveConnection(ctx context.Context, roomID, userID string) (bool, error) {
	return s.redis.SIsMember(ctx, s.activeConnectionsKey(roomID), userID).Result()
}

func (s *RoomCacheService) GetActiveUsers(ctx context.Context, roomID string) ([]string, error) {
	return s.redis.SMembers(ctx, s.activeConnectionsKey(roomID)).Result()
}

func (s *RoomCacheService) CleanupInactiveConnections(ctx context.Context, roomID string) error {
	activeUsers, err := s.GetActiveUsers(ctx, roomID)
	if err != nil {
		return err
	}

	pipe := s.redis.Pipeline()
	for _, userID := range activeUsers {
		connKey := s.connectionKey(roomID, userID)
		exists, err := s.redis.Exists(ctx, connKey).Result()
		if err != nil {
			continue
		}
		if exists == 0 {
			pipe.SRem(ctx, s.activeConnectionsKey(roomID), userID)
		}
	}

	_, err = pipe.Exec(ctx)
	return err
}

