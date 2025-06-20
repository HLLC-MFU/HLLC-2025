// hub/event_bus.go
package hub

import (
	"context"
)

// EventType represents different types of events in the chat system
type EventType string

const (
	MessageEvent     EventType = "message"
	NotificationEvent EventType = "notification"
	PresenceEvent    EventType = "presence"
	ReactionEvent    EventType = "reaction"
	FileEvent        EventType = "file"
	StickerEvent     EventType = "sticker"
)

// Event represents a chat event with its type and payload
type Event struct {
	Type    EventType    `json:"type"`
	RoomID  string      `json:"roomId,omitempty"`
	UserID  string      `json:"userId,omitempty"`
	Payload interface{} `json:"payload"`
}

// EventBus defines the interface for event distribution
type EventBus interface {
	// Publish sends an event to all subscribers of a topic
	Publish(ctx context.Context, topic string, event Event) error

	// Subscribe registers a handler for events on a topic
	Subscribe(topic string, handler EventHandler) error

	// Unsubscribe removes a handler from a topic
	Unsubscribe(topic string, handler EventHandler) error

	// PublishDirect sends an event directly to a specific user
	PublishDirect(ctx context.Context, userID string, event Event) error

	// Close cleans up resources used by the event bus
	Close() error
}

// EventHandler defines how to handle incoming events
type EventHandler interface {
	// HandleEvent processes an incoming event
	HandleEvent(ctx context.Context, event Event) error
}
