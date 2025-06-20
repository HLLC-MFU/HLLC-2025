package utils

// import (
// 	"chat/module/chat/model"
// 	"encoding/json"
// 	"fmt"

// 	"github.com/segmentio/kafka-go"
// )

// func NotifyUserIfNeeded(pub kafka.Publisher, cache *deduplicationCache, payload model.MessagePayload) error {
// 	key := fmt.Sprintf("%s:%s:%s", payload.UserID, payload.RoomID, payload.Message)
// 	if !cache.ShouldNotify(key) {
// 		return nil
// 	}
// 	msg, _ := json.Marshal(payload)
// 	return pub.SendMessageToTopic("chat-notifications", payload.UserID, string(msg))
// }
