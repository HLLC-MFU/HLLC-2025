package utils

import (
	"chat/module/chat/model"
	"chat/pkg/core/kafka"
	"context"
	"encoding/json"
	"log"
)

type ChatEventEmitter struct {
	bus *kafka.Bus
}

func NewChatEventEmitter(bus *kafka.Bus) *ChatEventEmitter {
	return &ChatEventEmitter{bus: bus}
}

func (e *ChatEventEmitter) EmitMessage(ctx context.Context, roomID, userID, message string) {
	payload := map[string]interface{}{
		"roomId": roomID,
		"userId": userID,
		"message": message,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal message payload: %v", err)
		return
	}

	event := model.ChatEvent{
		EventType: "message",
		Payload: payloadBytes,
	}

	if err := e.bus.Emit(ctx, "chat-events", event.EventType, payloadBytes); err != nil {
		log.Printf("[ERROR] Failed to emit chat event: %v", err)
	}

	log.Printf("[ChatEvent] Successfully emitted message event for room %s, user %s", roomID, userID)
}