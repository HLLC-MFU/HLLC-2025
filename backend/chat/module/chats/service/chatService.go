package service

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/utils"
	roomRedis "github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/redis"

	MemberService "github.com/HLLC-MFU/HLLC-2025/backend/module/members/service"
	RoomRepository "github.com/HLLC-MFU/HLLC-2025/backend/module/rooms/repository"
	userService "github.com/HLLC-MFU/HLLC-2025/backend/module/users/service"
	kafkaPublisher "github.com/HLLC-MFU/HLLC-2025/backend/pkg/kafka"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/redis"
	"github.com/gofiber/websocket/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
	SyncRoomMembers()
	DeleteRoomMessages(ctx context.Context, roomID string) error
	StartRoomConsumers()
	NotifyOfflineUser(userID, roomID, fromUserID, message, eventType string)
	HandleMessage(ctx context.Context, msg *model.ChatMessage) error
	GetMessageByID(ctx context.Context, id primitive.ObjectID) (*model.ChatMessage, error)
}

const (
	chatConsumerGroup = "chat-service-group"
	deduplicationTTL  = time.Minute
)

type service struct {
	repo          repository.ChatRepository
	publisher     kafkaPublisher.Publisher
	roomRepo      RoomRepository.RoomRepository
	userService   userService.UserService
	memberService MemberService.MemberService
	config        *config.Config
}

var (
	notifiedMu sync.Mutex
	notified   = make(map[string]time.Time) // key: userId:roomId:message
)

func NewService(repo repository.ChatRepository, publisher kafkaPublisher.Publisher, roomRepo RoomRepository.RoomRepository, userService userService.UserService, memberService MemberService.MemberService, cfg *config.Config) ChatService {
	s := &service{
		repo:          repo,
		publisher:     publisher,
		roomRepo:      roomRepo,
		userService:   userService,
		memberService: memberService,
		config:        cfg,
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
				model.Clients[client.RoomID][client.UserID.Hex()] = client.Conn
				log.Printf("[REGISTER] %s joined room %s", client.UserID.Hex(), client.RoomID)

			case client := <-model.Unregister:
				if roomClients, exists := model.Clients[client.RoomID]; exists {
					roomClients[client.UserID.Hex()] = nil
				}
				roomRedis.RemoveUserFromRoom(client.RoomID.Hex(), client.UserID.Hex())
				log.Printf("[UNREGISTER] %s left room %s", client.UserID.Hex(), client.RoomID)

			case message := <-model.Broadcast:
				log.Printf("[BROADCAST] Message from %s in room %s: %v", message.FROM.UserID.Hex(), message.FROM.RoomID, message.MSG)

				// Handle MSG เป็น struct (ChatMessage) หรือ string
				var chatMsg *model.ChatMessage
				switch v := message.MSG.(type) {
				case string:
					// กรณีเก่า (text ธรรมดา)
					chatMsg = &model.ChatMessage{
						RoomID:    message.FROM.RoomID,
						UserID:    message.FROM.UserID,
						Message:   v,
						Mentions:  utils.ExtractMentions(v),
						Timestamp: time.Now(),
					}
				case *model.ChatMessage:
					chatMsg = v
				case model.ChatMessage:
					chatMsg = &v
				default:
					log.Printf("[BROADCAST] Unknown MSG type: %T", message.MSG)
					continue
				}

				// Convert to Kafka message format and send to Kafka topic
				kafkaMsg := chatMsg.ToKafkaMessage()
				data, err := json.Marshal(kafkaMsg)
				if err != nil {
					log.Printf("[BROADCAST] Failed to marshal message: %v", err)
					continue
				}

				if err := s.publisher.SendMessage(chatMsg.RoomID.Hex(), chatMsg.UserID.Hex(), string(data)); err != nil {
					log.Printf("[BROADCAST] Failed to send message to Kafka: %v", err)
					continue
				}

				// Notify offline users
				for userID, conn := range model.Clients[message.FROM.RoomID] {
					if conn == nil {
						s.NotifyOfflineUser(userID, message.FROM.RoomID.Hex(), message.FROM.UserID.Hex(), chatMsg.Message, "text")
					}
				}

				// Send acknowledgment back to sender
				if conn, exists := model.Clients[chatMsg.RoomID][chatMsg.UserID.Hex()]; exists && conn != nil {
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

func (s *service) NotifyOfflineUser(userID, roomID, fromUserID, message, eventType string) {
	key := userID + ":" + roomID + ":" + eventType + ":" + message
	notifiedMu.Lock()
	if t, exists := notified[key]; exists && time.Since(t) < deduplicationTTL {
		notifiedMu.Unlock()
		log.Printf("[Notify] Duplicate notification for %s, skipping", key)
		return
	}
	notified[key] = time.Now()
	notifiedMu.Unlock()

	// Check if user is still a member of the room
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		log.Printf("[Notify] Invalid room ID: %v", err)
		return
	}

	// Check if user is still a member
	isMember, err := s.memberService.IsUserInRoom(context.Background(), roomObjID, userID)
	if err != nil {
		log.Printf("[Notify] Failed to check room membership: %v", err)
		return
	}

	if !isMember {
		log.Printf("[Notify] User %s is not a member of room %s, skipping notification", userID, roomID)
		return
	}

	payload := model.NewNotificationPayload(userID, roomID, fromUserID, message, eventType)
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
		// Cache hit - enrich the messages with reactions and user info
		var enriched []model.ChatMessageEnriched
		for _, msg := range cachedMessages {
			reactions, _ := s.repo.GetReactionsByMessageID(ctx, msg.ID)

			var replyTo *model.ChatMessage
			if msg.ReplyToID != nil {
				replyTo, _ = s.repo.GetMessageByID(ctx, *msg.ReplyToID)
			}

			// Get user information
			user, err := s.userService.GetById(ctx, msg.UserID)
			var username string
			if err == nil && user != nil {
				username = user.Username
			}

			enrichedMsg := model.ChatMessageEnriched{
				ChatMessage: msg,
				Reactions:   reactions,
				ReplyTo:     replyTo,
				Username:    username, // Add username to enriched message
			}
			enriched = append(enriched, enrichedMsg)
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

		var replyTo *model.ChatMessage
		if msg.ReplyToID != nil {
			replyTo, _ = s.repo.GetMessageByID(ctx, *msg.ReplyToID)
		}

		// Get user information
		user, err := s.userService.GetById(ctx, msg.UserID)
		var username string
		if err == nil && user != nil {
			username = user.Username
		}

		enrichedMsg := model.ChatMessageEnriched{
			ChatMessage: msg,
			Reactions:   reactions,
			ReplyTo:     replyTo,
			Username:    username, // Add username to enriched message
		}
		enriched = append(enriched, enrichedMsg)
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
	if err := redis.SaveChatMessageToRoom(msg.RoomID.Hex(), msg); err != nil {
		log.Printf("[Cache] Failed to cache new message for room %s: %v", msg.RoomID.Hex(), err)
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
			if model.Clients[room.ID] == nil {
				model.Clients[room.ID] = make(map[string]*websocket.Conn)
			}

			for _, userID := range memberIDs {
				userIDStr := userID.Hex()
				if _, exists := model.Clients[room.ID][userIDStr]; !exists {
					model.Clients[room.ID][userIDStr] = nil
				}
				log.Printf("[SYNC] User %s is a member of room %s", userIDStr, room.ID.Hex())
			}
		}
	}

	log.Println("[SYNC] Room membership synchronized")
}

func (s *service) SaveReaction(ctx context.Context, reaction *model.MessageReaction) error {

	// Update the chat_messages collection to include the reaction
	if err := s.repo.AddReactionToMessage(ctx, reaction.MessageID, reaction); err != nil {
		log.Printf("[SaveReaction] Failed to update chat message with reaction: %v", err)
		return err
	}

	// Send the reaction to Kafka chat-notifications topic
	payload := map[string]string{
		"userId":    reaction.UserID.Hex(),
		"messageId": reaction.MessageID.Hex(),
		"reaction":  reaction.Reaction,
	}
	msg, _ := json.Marshal(payload)
	if err := s.publisher.SendMessageToTopic("chat-notifications", reaction.UserID.Hex(), string(msg)); err != nil {
		log.Printf("[Kafka] Failed to send reaction to chat-notifications Kafka topic: %v", err)
	}

	return nil
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
	for _, room := range rooms {
		topic := "chat-room-" + room.ID.Hex()
		consumer := kafkaPublisher.NewConsumer(
			[]string{s.config.KafkaAddress()},
			[]string{topic},
			chatConsumerGroup,
			s,
		)
		go func(c *kafkaPublisher.Consumer, t string) {
			if err := c.Start(); err != nil {
				log.Printf("[Kafka] Failed to start consumer for topic %s: %v", t, err)
			}
		}(consumer, topic)
	}
}

func (s *service) HandleMessage(ctx context.Context, msg *model.ChatMessage) error {
	// Try to unmarshal as KafkaMessage first
	var kafkaMsg model.KafkaMessage
	if err := json.Unmarshal([]byte(msg.Message), &kafkaMsg); err == nil {
		// If successful, convert back to ChatMessage
		msg = &model.ChatMessage{
			RoomID:    kafkaMsg.RoomID,
			UserID:    kafkaMsg.UserID,
			Message:   kafkaMsg.Message,
			Mentions:  kafkaMsg.Mentions,
			FileURL:   kafkaMsg.FileURL,
			FileType:  kafkaMsg.FileType,
			FileName:  kafkaMsg.FileName,
			Timestamp: kafkaMsg.Timestamp,
			Image:     kafkaMsg.Image,
			ReplyToID: kafkaMsg.ReplyToID,
		}
	}

	// Save to MongoDB
	if err := s.SaveChatMessage(ctx, msg); err != nil {
		log.Printf("[Message Handler] Failed to save message to MongoDB: %v", err)
		return err
	}

	// Cache in Redis
	if err := redis.SaveChatMessageToRoom(msg.RoomID.Hex(), msg); err != nil {
		log.Printf("[Message Handler] Failed to cache message in Redis: %v", err)
		// Don't return error here as the message is already saved in MongoDB
	}

	// Get user information regardless of message type
	user, err := s.userService.GetById(ctx, msg.UserID)
	var username string
	if err == nil && user != nil {
		username = user.Username
	}

	// Create the base payload with user information
	payload := map[string]interface{}{
		"userId":   msg.UserID.Hex(),
		"username": username,
		"roomId":   msg.RoomID.Hex(),
		"message":  msg.Message,
		"mentions": msg.Mentions,
	}

	// Add file-related fields if present
	if msg.FileURL != "" {
		payload["fileURL"] = msg.FileURL
		payload["fileType"] = msg.FileType
		payload["fileName"] = msg.FileName
	}
	if msg.Image != "" {
		payload["image"] = msg.Image
	}

	event := model.ChatEvent{
		EventType: "message",
		Payload:   payload,
	}

	// Broadcast to all clients in the room
	for userID, conn := range model.Clients[msg.RoomID] {
		if userID == msg.UserID.Hex() {
			continue
		}

		if conn == nil {
			s.NotifyOfflineUser(userID, msg.RoomID.Hex(), msg.UserID.Hex(), msg.Message, "text")
			continue
		}

		if err := sendJSONMessage(conn, event); err != nil {
			log.Printf("[Message Handler] Failed to send to WebSocket client %s: %v", userID, err)
			conn.Close()
			model.Clients[msg.RoomID][userID] = nil
			s.NotifyOfflineUser(userID, msg.RoomID.Hex(), msg.UserID.Hex(), msg.Message, "text")
		}
	}

	return nil
}

func (s *service) GetMessageByID(ctx context.Context, id primitive.ObjectID) (*model.ChatMessage, error) {
	return s.repo.GetMessageByID(ctx, id)
}
