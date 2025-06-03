package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/utils"
	roomRedis "github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/redis"

	RoomRepository "github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/repository"
	kafkaPublisher "github.com/HLLC-MFU/HLLC-2025/backend/pkg/kafka"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/redis"
	"github.com/gofiber/websocket/v2"
)

type Error string

func (e Error) Error() string { return string(e) }

func NewError(text string) error {
	return Error(text)
}

type ChatService interface {
	InitChatHub()
	GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error)
	SaveChatMessage(ctx context.Context, msg *model.ChatMessage) error
	SaveReaction(ctx context.Context, reaction *model.MessageReaction) error
	SaveReadReceipt(ctx context.Context, receipt *model.MessageReadReceipt) error
	SyncRoomMembers()
	DeleteRoomMessages(ctx context.Context, roomID string) error
	StartRoomConsumers()
}

const (
	chatConsumerGroup = "chat-service-group"
)

type service struct {
	repo      repository.ChatRepository
	publisher kafkaPublisher.Publisher
	roomRepo  RoomRepository.RoomRepository
}

func NewService(repo repository.ChatRepository, publisher kafkaPublisher.Publisher, roomRepo RoomRepository.RoomRepository) ChatService {
	s := &service{
		repo:      repo,
		publisher: publisher,
		roomRepo:  roomRepo,
	}

	s.StartRoomConsumers()

	return s
}

func (s *service) InitChatHub() {
	go func() {
		for {
			select {
			case client := <-model.Register:
				if model.Clients[client.RoomID] == nil {
					model.Clients[client.RoomID] = make(map[string]*websocket.Conn)
				}
				model.Clients[client.RoomID][client.UserID] = client.Conn
				log.Printf("[REGISTER] %s joined room %s", client.UserID, client.RoomID)

			case client := <-model.Unregister:
				if roomClients, exists := model.Clients[client.RoomID]; exists {
					roomClients[client.UserID] = nil
				}
				roomRedis.RemoveUserFromRoom(client.RoomID, client.UserID)
				log.Printf("[UNREGISTER] %s left room %s", client.UserID, client.RoomID)

			case message := <-model.Broadcast:
				log.Printf("[BROADCAST] Message from %s in room %s: %s", message.FROM.UserID, message.FROM.RoomID, message.MSG)

				// Try to parse as a special message type (sticker/file)
				var specialMsg map[string]interface{}
				if err := json.Unmarshal([]byte(message.MSG), &specialMsg); err == nil {
					// Check if it's a special message type
					if msgType, ok := specialMsg["type"].(string); ok {
						switch msgType {
						case "sticker":
							// Notify offline users about sticker
							for userID, conn := range model.Clients[message.FROM.RoomID] {
								if conn == nil {
									notificationMsg := fmt.Sprintf("sent a sticker")
									s.notifyOfflineUser(userID, message.FROM.RoomID, message.FROM.UserID, notificationMsg)
								}
							}
							continue
						case "file":
							fileName, _ := specialMsg["fileName"].(string)
							// Notify offline users about file
							for userID, conn := range model.Clients[message.FROM.RoomID] {
								if conn == nil {
									notificationMsg := fmt.Sprintf("sent a file: %s", fileName)
									s.notifyOfflineUser(userID, message.FROM.RoomID, message.FROM.UserID, notificationMsg)
								}
							}
							continue
						}
					}
				}

				// Handle as regular text message
				mentions := utils.ExtractMentions(message.MSG)
				chatMsg := &model.ChatMessage{
					RoomID:    message.FROM.RoomID,
					UserID:    message.FROM.UserID,
					Message:   message.MSG,
					Mentions:  mentions,
					Timestamp: time.Now(),
				}

				// Convert to Kafka message format and send to Kafka topic
				kafkaMsg := chatMsg.ToKafkaMessage()
				data, err := json.Marshal(kafkaMsg)
				if err != nil {
					log.Printf("[BROADCAST] Failed to marshal message: %v", err)
					continue
				}

				if err := s.publisher.SendMessage(chatMsg.RoomID, chatMsg.UserID, string(data)); err != nil {
					log.Printf("[BROADCAST] Failed to send message to Kafka: %v", err)
					continue
				}

				// Notify offline users
				for userID, conn := range model.Clients[message.FROM.RoomID] {
					if conn == nil {
						s.notifyOfflineUser(userID, message.FROM.RoomID, message.FROM.UserID, message.MSG)
					}
				}

				// Send acknowledgment back to sender
				if conn, exists := model.Clients[chatMsg.RoomID][chatMsg.UserID]; exists && conn != nil {
					ack := model.ChatEvent{
						EventType: "message_ack",
						Payload: model.MessagePayload{
							UserID:   chatMsg.UserID,
							RoomID:   chatMsg.RoomID,
							Message:  chatMsg.Message,
							Mentions: chatMsg.Mentions,
						},
					}
					if err := sendJSONMessage(conn, ack); err != nil {
						log.Printf("[BROADCAST] Failed to send acknowledgment to sender: %v", err)
					}
				}
			}
		}
	}()
}

func sendJSONMessage(conn *websocket.Conn, v interface{}) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return conn.WriteMessage(websocket.TextMessage, data)
}

func (s *service) notifyOfflineUser(userID, roomID, fromUserID, message string) {
	payload := map[string]string{
		"userId":  userID,
		"roomId":  roomID,
		"from":    fromUserID,
		"message": message,
	}
	msg, _ := json.Marshal(payload)

	if err := s.publisher.SendMessageToTopic("chat-notifications", userID, string(msg)); err != nil {
		log.Printf("[Kafka Notify] Failed to notify offline user %s: %v", userID, err)
	} else {
		log.Printf("[Kafka Notify] Notification queued for %s", userID)
	}
}

func (s *service) GetChatHistoryByRoom(ctx context.Context, roomID string, limit int64) ([]model.ChatMessageEnriched, error) {
	// Try to get from Redis cache first
	cachedMessages, err := redis.GetRecentMessages(roomID, int(limit))
	if err == nil && len(cachedMessages) > 0 {
		// Cache hit - enrich the messages with reactions and read receipts
		var enriched []model.ChatMessageEnriched
		for _, msg := range cachedMessages {
			reactions, _ := s.repo.GetReactionsByMessageID(ctx, msg.ID)
			reads, _ := s.repo.GetReadReceiptsByMessageID(ctx, msg.ID)

			var replyTo *model.ChatMessage
			if msg.ReplyToID != nil {
				replyTo, _ = s.repo.GetMessageByID(ctx, *msg.ReplyToID)
			}

			enriched = append(enriched, model.ChatMessageEnriched{
				ChatMessage:  msg,
				Reactions:    reactions,
				ReadReceipts: reads,
				ReplyTo:      replyTo,
			})
		}
		return enriched, nil
	}

	// Cache miss - get from MongoDB
	rawMessages, err := s.repo.GetChatHistoryByRoom(ctx, roomID, limit)
	if err != nil {
		return nil, err
	}

	// Cache the results in Redis
	for _, msg := range rawMessages {
		if err := redis.SaveChatMessageToRoom(roomID, &msg); err != nil {
			log.Printf("[Cache] Failed to cache message for room %s: %v", roomID, err)
		}
	}

	var enriched []model.ChatMessageEnriched
	for _, msg := range rawMessages {
		reactions, _ := s.repo.GetReactionsByMessageID(ctx, msg.ID)
		reads, _ := s.repo.GetReadReceiptsByMessageID(ctx, msg.ID)

		var replyTo *model.ChatMessage
		if msg.ReplyToID != nil {
			replyTo, _ = s.repo.GetMessageByID(ctx, *msg.ReplyToID)
		}

		enriched = append(enriched, model.ChatMessageEnriched{
			ChatMessage:  msg,
			Reactions:    reactions,
			ReadReceipts: reads,
			ReplyTo:      replyTo,
		})
	}

	return enriched, nil
}

func (s *service) SaveChatMessage(ctx context.Context, msg *model.ChatMessage) error {
	id, err := s.repo.Save(ctx, msg)
	if err != nil {
		return err
	}
	msg.ID = id

	// Cache the new message in Redis
	if err := redis.SaveChatMessageToRoom(msg.RoomID, msg); err != nil {
		log.Printf("[Cache] Failed to cache new message for room %s: %v", msg.RoomID, err)
	}

	return nil
}

func (s *service) SyncRoomMembers() {
	rooms, _, err := s.roomRepo.List(context.Background(), 1, 1000)
	if err != nil {
		log.Printf("[SYNC] Failed to fetch rooms from database: %v", err)
		return
	}

	for _, room := range rooms {
		memberIDs, err := roomRedis.GetRoomMembers(room.ID.Hex())
		if err != nil {
			log.Printf("[SYNC] Failed to get members for room %s: %v", room.ID.Hex(), err)
			continue
		}

		if len(memberIDs) > 0 {
			if model.Clients[room.ID.Hex()] == nil {
				model.Clients[room.ID.Hex()] = make(map[string]*websocket.Conn)
			}

			for _, userID := range memberIDs {
				userIDStr := userID.Hex()
				if _, exists := model.Clients[room.ID.Hex()][userIDStr]; !exists {
					model.Clients[room.ID.Hex()][userIDStr] = nil
				}
				log.Printf("[SYNC] User %s is a member of room %s", userIDStr, room.ID.Hex())
			}
		}
	}

	log.Println("[SYNC] Room membership synchronized")
}

func (s *service) SaveReaction(ctx context.Context, reaction *model.MessageReaction) error {
	return s.repo.SaveReaction(ctx, reaction)
}

func (s *service) SaveReadReceipt(ctx context.Context, receipt *model.MessageReadReceipt) error {
	return s.repo.SaveReadReceipt(ctx, receipt)
}

// DeleteRoomMessages deletes all messages, reactions, and read receipts for a room
func (s *service) DeleteRoomMessages(ctx context.Context, roomID string) error {
	// Delete messages from MongoDB
	if err := s.repo.DeleteMessagesByRoomID(ctx, roomID); err != nil {
		return err
	}

	// Delete messages from Redis cache
	if err := redis.DeleteRoomMessages(roomID); err != nil {
		log.Printf("[DeleteRoomMessages] Failed to delete messages from Redis for room %s: %v", roomID, err)
		// Don't return error here as messages are already deleted from MongoDB
	}

	// Delete reactions and read receipts
	if err := s.repo.DeleteReactionsByRoomID(ctx, roomID); err != nil {
		log.Printf("[DeleteRoomMessages] Failed to delete reactions for room %s: %v", roomID, err)
	}

	if err := s.repo.DeleteReadReceiptsByRoomID(ctx, roomID); err != nil {
		log.Printf("[DeleteRoomMessages] Failed to delete read receipts for room %s: %v", roomID, err)
	}

	log.Printf("[DeleteRoomMessages] Successfully deleted all messages and related data for room: %s", roomID)
	return nil
}

func (s *service) StartRoomConsumers() {
	ctx := context.Background()
	// Get all rooms (use a large limit to get all)
	rooms, _, err := s.roomRepo.List(ctx, 1, 10000)
	if err != nil {
		log.Printf("[Kafka] Failed to list rooms for consumer startup: %v", err)
		return
	}
	handler := NewChatMessageHandler(s)
	for _, room := range rooms {
		topic := "chat-room-" + room.ID.Hex()
		consumer := kafkaPublisher.NewConsumer(
			[]string{"localhost:9092"},
			topic,
			chatConsumerGroup,
			handler,
		)
		go func(c *kafkaPublisher.Consumer, t string) {
			if err := c.Start(); err != nil {
				log.Printf("[Kafka] Failed to start consumer for topic %s: %v", t, err)
			}
		}(consumer, topic)
	}
}
