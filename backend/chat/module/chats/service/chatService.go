package service

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/utils"
	roomRedis "github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/redis"

	RoomRepository "github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/repository"
	kafkaPublisher "github.com/HLLC-MFU/HLLC-2025/backend/pkg/kafka"

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
}

type service struct {
	repo      repository.ChatRepository
	publisher kafkaPublisher.Publisher
	roomRepo  RoomRepository.RoomRepository
}

func NewService(repo repository.ChatRepository, publisher kafkaPublisher.Publisher, roomRepo RoomRepository.RoomRepository) ChatService {
	return &service{
		repo:      repo,
		publisher: publisher,
		roomRepo:  roomRepo,
	}
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

				mentions := utils.ExtractMentions(message.MSG)

				chatMsg := &model.ChatMessage{
					RoomID:    message.FROM.RoomID,
					UserID:    message.FROM.UserID,
					Message:   message.MSG,
					Mentions:  mentions,
					Timestamp: time.Now(),
				}

				payload := model.MessagePayload{
					UserID:   chatMsg.UserID,
					RoomID:   chatMsg.RoomID,
					Message:  chatMsg.Message,
					Mentions: chatMsg.Mentions,
				}
				event := model.ChatEvent{
					EventType: "message",
					Payload:   payload,
				}

				for userID, conn := range model.Clients[chatMsg.RoomID] {
					if conn == nil {
						if userID != chatMsg.UserID {
							s.notifyOfflineUser(userID, chatMsg.RoomID, chatMsg.UserID, chatMsg.Message)
						}
						continue
					}

					if err := sendJSONMessage(conn, event); err != nil {
						log.Printf("[WS] Failed to send to %s: %v", userID, err)
						conn.Close()
						model.Clients[chatMsg.RoomID][userID] = nil

						if userID != chatMsg.UserID {
							s.notifyOfflineUser(userID, chatMsg.RoomID, chatMsg.UserID, chatMsg.Message)
						}
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
	rawMessages, err := s.repo.GetChatHistoryByRoom(ctx, roomID, limit)
	if err != nil {
		return nil, err
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
