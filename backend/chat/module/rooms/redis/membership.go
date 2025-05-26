package redis

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var rdb *redis.Client

func InitRedis() {
	rdb = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // No password set
		DB:       0,  // Use default DB
	})

	// Test the connection
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("[REDIS] Failed to connect to Redis: %v", err)
	}

	log.Println("[REDIS] Connected to Redis server")
}

func AddUserToRoom(roomID string, userID string) error {
	return rdb.SAdd(context.Background(), "room:"+roomID, userID).Err()
}

func RemoveUserFromRoom(roomID string, userID string) error {
	return rdb.SRem(context.Background(), "room:"+roomID, userID).Err()
}

func GetRoomMembers(roomID string) ([]primitive.ObjectID, error) {
	members, err := rdb.SMembers(context.Background(), "room:"+roomID).Result()
	if err != nil {
		return nil, err
	}

	objectIDs := make([]primitive.ObjectID, 0, len(members))
	for _, member := range members {
		objID, err := primitive.ObjectIDFromHex(member)
		if err != nil {
			continue // Skip invalid ObjectIDs
		}
		objectIDs = append(objectIDs, objID)
	}

	return objectIDs, nil
}

func TotalRoomMembers(roomID string) (int64, error) {
	return rdb.SCard(context.Background(), "room:"+roomID).Result()
}

func IsUserInRoom(roomID string, userID string) (bool, error) {
	return rdb.SIsMember(context.Background(), "room:"+roomID, userID).Result()
}
