package redis

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func AddUserToRoom(roomID string, userID string) error {
	return core.GlobalRedis.Client.SAdd(context.Background(), "room:"+roomID, userID).Err()
}

func RemoveUserFromRoom(roomID string, userID string) error {
	return core.GlobalRedis.Client.SRem(context.Background(), "room:"+roomID, userID).Err()
}

func GetRoomMembers(roomID string) ([]primitive.ObjectID, error) {
	members, err := core.GlobalRedis.Client.SMembers(context.Background(), "room:"+roomID).Result()
	if err != nil {
		return nil, err
	}

	objectIDs := make([]primitive.ObjectID, 0, len(members))
	for _, member := range members {
		objID, err := primitive.ObjectIDFromHex(member)
		if err != nil {
			continue
		}
		objectIDs = append(objectIDs, objID)
	}

	return objectIDs, nil
}

func TotalRoomMembers(roomID string) (int64, error) {
	return core.GlobalRedis.Client.SCard(context.Background(), "room:"+roomID).Result()
}

func IsUserInRoom(roomID string, userID string) (bool, error) {
	return core.GlobalRedis.Client.SIsMember(context.Background(), "room:"+roomID, userID).Result()
}
