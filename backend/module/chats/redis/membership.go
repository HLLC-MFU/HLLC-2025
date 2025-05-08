package redis

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

var rdb = redis.NewClient(&redis.Options{
	Addr:     "localhost:6379",
	Password: "",
	DB:       0,
})

func InitRedis() {
	rdb = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	// Test the connection
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("[REDIS] Failed to connect to Redis: %v", err)
	}

	log.Println("[REDIS] Connected to Redis server")
}

func AddUserToRoom(roomID, userID string) error {
	err := rdb.SAdd(context.Background(), "room:"+roomID, userID).Err()
	if err != nil {
		log.Printf("[REDIS] Failed to add user %s to room %s: %v", userID, roomID, err)
	}
	return err
}

func RemoveUserFromRoom(roomID, userID string) error {
	err := rdb.SRem(context.Background(), "room:"+roomID, userID).Err()
	if err != nil {
		log.Printf("[REDIS] Failed to remove user %s from room %s: %v", userID, roomID, err)
	}
	return err
}

func GetRoomMembers(roomID string) ([]string, error) {
	members, err := rdb.SMembers(context.Background(), "room:"+roomID).Result()
	if err != nil {
		log.Printf("[REDIS] Failed to get members for room %s: %v", roomID, err)
		return nil, err
	}
	return members, nil
}

func TotalRoomMembers(roomID string) (int64, error) {
	count, err := rdb.SCard(context.Background(), "room:"+roomID).Result()
	if err != nil {
		log.Printf("[REDIS] Failed to count members in room %s: %v", roomID, err)
		return 0, err
	}
	return count, nil
}

// ✅ เพิ่มฟังก์ชันตรวจสอบสมาชิก
func IsUserInRoom(roomID, userID string) (bool, error) {
	isMember, err := rdb.SIsMember(context.Background(), "room:"+roomID, userID).Result()
	if err != nil {
		log.Printf("[REDIS] Failed to check if user %s is in room %s: %v", userID, roomID, err)
		return false, err
	}
	return isMember, nil
}
