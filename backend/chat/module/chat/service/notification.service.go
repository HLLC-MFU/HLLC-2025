package service

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"chat/module/chat/types"
	"chat/pkg/kafka"
)

type NotificationService struct {
	publisher kafka.Publisher
	notified  map[string]time.Time // key: userId:roomId:message -> lastNotificationTime
	mu        sync.Mutex
}

func NewNotificationService() *NotificationService {
	return &NotificationService{
		publisher: kafka.GetPublisher(),
		notified:  make(map[string]time.Time),
	}
}

func (s *NotificationService) NotifyOfflineUser(userID, roomID, fromUserID, message string) {
	key := fmt.Sprintf("%s:%s:%s", userID, roomID, message)
	
	s.mu.Lock()
	if t, exists := s.notified[key]; exists && time.Since(t) < types.DeduplicationTTL {
		s.mu.Unlock()
		return
	}
	s.notified[key] = time.Now()
	s.mu.Unlock()

	notification := map[string]string{
		"user_id":    userID,
		"room_id":    roomID,
		"from_user":  fromUserID,
		"message":    message,
		"event_type": "message",
	}

	data, _ := json.Marshal(notification)
	if err := s.publisher.SendMessageToTopic("chat-notifications", userID, string(data)); err != nil {
		log.Printf("[Notification] Failed to send notification: %v", err)
	}
} 