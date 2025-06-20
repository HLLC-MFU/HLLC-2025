package websocket

import (
	"encoding/json"
	"log"
	"time"

	"chat/module/chat/hub"

	"github.com/gofiber/websocket/v2"
)

type ConnectionHandler struct {
	hub *hub.Hub
}

func NewConnectionHandler(h *hub.Hub) *ConnectionHandler {
	return &ConnectionHandler{hub: h}
}

func (h *ConnectionHandler) HandleConnection(conn *websocket.Conn, userID, roomID string) {
	// Create client state
	client := &hub.ClientState{
		UserID:   userID,
		RoomID:   roomID,
		Conn:     conn,
		IsOnline: true,
	}

	// Register client with hub
	h.hub.Register <- client

	// Ensure cleanup on exit
	defer func() {
		h.hub.Unregister <- client
		conn.Close()
	}()

	// Start ping/pong to keep connection alive
	go h.keepAlive(conn)

	// Handle incoming messages
	for {
		messageType, data, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error reading message: %v", err)
			}
			break
		}

		if messageType == websocket.TextMessage {
			var msg map[string]interface{}
			if err := json.Unmarshal(data, &msg); err != nil {
				log.Printf("Error unmarshaling message: %v", err)
				continue
			}

			// Convert to hub.Event
			event := h.createEvent(msg, userID, roomID)

			// Broadcast via hub
			h.hub.Broadcast <- event
		}
	}
}

func (h *ConnectionHandler) keepAlive(conn *websocket.Conn) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h *ConnectionHandler) createEvent(msg map[string]interface{}, userID, roomID string) hub.Event {
	eventType := hub.MessageEvent // default
	if t, ok := msg["type"].(string); ok {
		switch t {
		case "message":
			eventType = hub.MessageEvent
		case "reaction":
			eventType = hub.ReactionEvent
		case "file":
			eventType = hub.FileEvent
		case "sticker":
			eventType = hub.StickerEvent
		}
	}

	return hub.Event{
		Type:    eventType,
		RoomID:  roomID,
		UserID:  userID,
		Payload: msg,
	}
}

// SendEvent sends an event to a specific WebSocket connection
func (h *ConnectionHandler) SendEvent(conn *websocket.Conn, event hub.Event) error {
	return conn.WriteJSON(event)
}

// SendError sends an error event to a specific WebSocket connection
func (h *ConnectionHandler) SendError(conn *websocket.Conn, message string) error {
	event := hub.Event{
		Type: "error",
		Payload: map[string]interface{}{
			"message": message,
		},
	}
	return conn.WriteJSON(event)
} 