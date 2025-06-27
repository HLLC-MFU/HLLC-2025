package model

import (
	"encoding/json"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	NotificationLog struct {
		ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		Type        string             `bson:"type" json:"type"`
		Receiver    string             `bson:"receiver" json:"receiver"`
		Sender      string             `bson:"sender" json:"sender"`
		RoomID      string             `bson:"room_id" json:"room_id"`
		MessageID   string             `bson:"message_id,omitempty" json:"message_id,omitempty"`
		Payload     interface{}        `bson:"payload" json:"-"` // Can be string or embedded document
		Status      string             `bson:"status" json:"status"` // "sent", "failed", "delivered"
		Error       string             `bson:"error,omitempty" json:"error,omitempty"`
		Timestamp   time.Time          `bson:"timestamp" json:"timestamp"`
		DeliveredAt *time.Time         `bson:"delivered_at,omitempty" json:"delivered_at,omitempty"`
	}

	// Custom JSON marshaling for NotificationLog
	NotificationLogJSON struct {
		ID          string      `json:"id"`
		Type        string      `json:"type"`
		Receiver    string      `json:"receiver"`
		Sender      string      `json:"sender"`
		RoomID      string      `json:"room_id"`
		MessageID   string      `json:"message_id,omitempty"`
		Payload     interface{} `json:"payload"` // Will be parsed JSON object
		Status      string      `json:"status"`
		Error       string      `json:"error,omitempty"`
		Timestamp   time.Time   `json:"timestamp"`
		DeliveredAt *time.Time  `json:"delivered_at,omitempty"`
	}

	NotificationStats struct {
		TotalNotifications int64                 `json:"total_notifications"`
		TodayNotifications int64                 `json:"today_notifications"`
		ByType             map[string]int64      `json:"by_type"`
		ByStatus           map[string]int64      `json:"by_status"`
		TopReceivers       []ReceiverStats       `json:"top_receivers"`
		RecentActivity     []NotificationLog     `json:"recent_activity"`
		SuccessRate        float64               `json:"success_rate"`
	}

	ReceiverStats struct {
		UserID string `json:"user_id"`
		Count  int64  `json:"count"`
	}

	TestNotificationRequest struct {
		ReceiverID string `json:"receiver_id" validate:"required"`
		Type       string `json:"type" validate:"required"`
		Message    string `json:"message" validate:"required"`
		RoomID     string `json:"room_id,omitempty"`
	}
)

// Custom UnmarshalBSON to handle both string and embedded document payload types
func (n *NotificationLog) UnmarshalBSON(data []byte) error {
	// Create a temporary struct with all fields explicitly defined to avoid recursion
	temp := struct {
		ID          primitive.ObjectID `bson:"_id,omitempty"`
		Type        string             `bson:"type"`
		Receiver    string             `bson:"receiver"`
		Sender      string             `bson:"sender"`
		RoomID      string             `bson:"room_id"`
		MessageID   string             `bson:"message_id,omitempty"`
		Payload     bson.RawValue      `bson:"payload"`
		Status      string             `bson:"status"`
		Error       string             `bson:"error,omitempty"`
		Timestamp   time.Time          `bson:"timestamp"`
		DeliveredAt *time.Time         `bson:"delivered_at,omitempty"`
	}{}

	if err := bson.Unmarshal(data, &temp); err != nil {
		return err
	}

	// Copy all fields except payload
	n.ID = temp.ID
	n.Type = temp.Type
	n.Receiver = temp.Receiver
	n.Sender = temp.Sender
	n.RoomID = temp.RoomID
	n.MessageID = temp.MessageID
	n.Status = temp.Status
	n.Error = temp.Error
	n.Timestamp = temp.Timestamp
	n.DeliveredAt = temp.DeliveredAt

	// Handle different payload types
	switch temp.Payload.Type {
	case bson.TypeString:
		// New format: JSON string
		n.Payload = temp.Payload.StringValue()
	case bson.TypeEmbeddedDocument:
		// Old format: embedded document, convert to JSON string
		var doc bson.M
		if err := temp.Payload.Unmarshal(&doc); err != nil {
			n.Payload = "{}"
		} else {
			if jsonBytes, err := json.Marshal(doc); err != nil {
				n.Payload = "{}"
			} else {
				n.Payload = string(jsonBytes)
			}
		}
	default:
		// Fallback: empty JSON object
		n.Payload = "{}"
	}

	return nil
}

// Custom MarshalJSON for NotificationLog to parse payload string back to JSON object
func (n NotificationLog) MarshalJSON() ([]byte, error) {
	// Parse payload to JSON object
	var payloadObj interface{}
	
	if n.Payload != nil {
		switch p := n.Payload.(type) {
		case string:
			// If it's a string, try to parse as JSON
			if p != "" {
				if err := json.Unmarshal([]byte(p), &payloadObj); err != nil {
					// If parsing fails, use the string as is
					payloadObj = p
				}
			}
		default:
			// If it's already an object, use it directly
			payloadObj = p
		}
	}

	// Create the JSON representation
	jsonLog := NotificationLogJSON{
		ID:          n.ID.Hex(),
		Type:        n.Type,
		Receiver:    n.Receiver,
		Sender:      n.Sender,
		RoomID:      n.RoomID,
		MessageID:   n.MessageID,
		Payload:     payloadObj,
		Status:      n.Status,
		Error:       n.Error,
		Timestamp:   n.Timestamp,
		DeliveredAt: n.DeliveredAt,
	}

	return json.Marshal(jsonLog)
} 