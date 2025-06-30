package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Moderation action types
const (
	ModerationTypeBan  = "ban"
	ModerationTypeMute = "mute"
	ModerationTypeKick = "kick"
)

// Ban/Mute durations
const (
	DurationTemporary = "temporary"
	DurationPermanent = "permanent"
)

// Mute restrictions
const (
	MuteRestrictionCanView    = "can_view"     // ดูได้แต่พิมพ์ไม่ได้
	MuteRestrictionCannotView = "cannot_view"  // ดูไม่ได้และพิมพ์ไม่ได้
)

type (
	// UserModeration เก็บประวัติการลงโทษ
	UserModeration struct {
		ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		RoomID      primitive.ObjectID `bson:"room_id" json:"room_id"`
		UserID      primitive.ObjectID `bson:"user_id" json:"user_id"`
		ModeratorID primitive.ObjectID `bson:"moderator_id" json:"moderator_id"`
		
		// ประเภทการลงโทษ: ban, mute, kick
		Type        string `bson:"type" json:"type"`
		
		// ระยะเวลา: temporary, permanent
		Duration    string `bson:"duration" json:"duration"`
		
		// เวลาเริ่มต้นและสิ้นสุด
		StartTime   time.Time  `bson:"start_time" json:"start_time"`
		EndTime     *time.Time `bson:"end_time,omitempty" json:"end_time,omitempty"`
		
		// สำหรับ mute: can_view หรือ cannot_view
		Restriction string `bson:"restriction,omitempty" json:"restriction,omitempty"`
		
		// เหตุผลการลงโทษ
		Reason      string `bson:"reason" json:"reason"`
		
		// สถานะ: active, expired, revoked
		Status      string    `bson:"status" json:"status"`
		RevokedAt   *time.Time `bson:"revoked_at,omitempty" json:"revoked_at,omitempty"`
		RevokedBy   *primitive.ObjectID `bson:"revoked_by,omitempty" json:"revoked_by,omitempty"`
		
		CreatedAt   time.Time `bson:"created_at" json:"created_at"`
		UpdatedAt   time.Time `bson:"updated_at" json:"updated_at"`
		
		// Populated fields (ไม่เก็บในฐานข้อมูล)
		User      interface{} `bson:"-" json:"user,omitempty"`
		Moderator interface{} `bson:"-" json:"moderator,omitempty"`
		Room      interface{} `bson:"-" json:"room,omitempty"`
	}

	// ModerationStatus สถานะการลงโทษปัจจุบันของ user ในห้อง
	ModerationStatus struct {
		UserID      string     `json:"user_id"`
		RoomID      string     `json:"room_id"`
		IsBanned    bool       `json:"is_banned"`
		IsMuted     bool       `json:"is_muted"`
		IsKicked    bool       `json:"is_kicked"`
		BanExpiry   *time.Time `json:"ban_expiry,omitempty"`
		MuteExpiry  *time.Time `json:"mute_expiry,omitempty"`
		Restriction string     `json:"restriction,omitempty"`
	}

	// ModerationAction สำหรับ API response
	ModerationAction struct {
		ID          string    `json:"id"`
		Type        string    `json:"type"`
		Duration    string    `json:"duration"`
		Reason      string    `json:"reason"`
		StartTime   time.Time `json:"start_time"`
		EndTime     *time.Time `json:"end_time,omitempty"`
		Status      string    `json:"status"`
		Moderator   string    `json:"moderator"`
	}
)

// IsActive ตรวจสอบว่าการลงโทษยังมีผลอยู่หรือไม่
func (m *UserModeration) IsActive() bool {
	if m.Status != "active" {
		return false
	}
	
	// ถ้าเป็นแบบถาวร
	if m.Duration == DurationPermanent {
		return true
	}
	
	// ตรวจสอบเวลาหมดอายุ
	if m.EndTime != nil && time.Now().After(*m.EndTime) {
		return false
	}
	
	return true
}

// IsExpired ตรวจสอบว่าการลงโทษหมดอายุแล้วหรือไม่
func (m *UserModeration) IsExpired() bool {
	if m.Duration == DurationPermanent {
		return false
	}
	
	return m.EndTime != nil && time.Now().After(*m.EndTime)
}

// CanViewMessages ตรวจสอบว่า user สามารถดูข้อความได้หรือไม่
func (s *ModerationStatus) CanViewMessages() bool {
	if s.IsBanned {
		return false
	}
	
	if s.IsMuted && s.Restriction == MuteRestrictionCannotView {
		return false
	}
	
	return true
}

// CanSendMessages ตรวจสอบว่า user สามารถส่งข้อความได้หรือไม่
func (s *ModerationStatus) CanSendMessages() bool {
	if s.IsBanned || s.IsMuted {
		return false
	}
	
	return true
} 