package model

import (
	"chat/pkg/common"
	"encoding/json"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Room Type Constants
const (
	RoomTypeNormal   = "normal"   // ห้องปกติ - user สามารถส่งข้อความ, sticker, reaction ได้
	RoomTypeReadOnly = "readonly" // ห้องอ่านอย่างเดียว - user อ่านได้เท่านั้น
)

type (
	Room struct {
		ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
		Name        common.LocalizedName `bson:"name" json:"name"`
		Type        string               `bson:"type" json:"type"` // ประเภทห้อง (normal, readonly)
		Capacity    int                  `bson:"capacity" json:"capacity"`
		Members     []primitive.ObjectID `bson:"members" json:"members"`
		CreatedBy   primitive.ObjectID   `bson:"createdBy" json:"createdBy"`
		CreatedAt   time.Time            `bson:"createdAt" json:"createdAt"`
		UpdatedAt   time.Time            `bson:"updatedAt" json:"updatedAt"`
		Image       string               `bson:"image,omitempty" json:"image,omitempty"`
	}

	RoomEvent struct {
		Type string `json:"type"`
		RoomID string `json:"roomId"`
		Payload json.RawMessage `json:"payload"`
	}
)

// IsReadOnly ตรวจสอบว่าห้องเป็นแบบ read-only หรือไม่
func (r *Room) IsReadOnly() bool {
	return r.Type == RoomTypeReadOnly
}

// CanUserSendMessages ตรวจสอบว่า user สามารถส่งข้อความได้หรือไม่
func (r *Room) CanUserSendMessages() bool {
	return r.Type == RoomTypeNormal
}

// ValidateRoomType ตรวจสอบความถูกต้องของ room type
func ValidateRoomType(roomType string) bool {
	return roomType == RoomTypeNormal || roomType == RoomTypeReadOnly
}	