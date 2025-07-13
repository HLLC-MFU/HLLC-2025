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

// Room Status Constants
const (
	RoomStatusActive   = "active"   // ห้องเปิดใช้งาน - user สามารถเชื่อมต่อได้
	RoomStatusInactive = "inactive" // ห้องปิดใช้งาน - user ไม่สามารถเชื่อมต่อได้
)

type (
	// RoomSchedule สำหรับการตั้งเวลาเปิดปิดห้อง
	RoomSchedule struct {
		StartAt *time.Time `bson:"startAt,omitempty" json:"startAt,omitempty"` // เวลาเริ่มเปิดห้อง
		EndAt   *time.Time `bson:"endAt,omitempty" json:"endAt,omitempty"`     // เวลาปิดห้อง
	}

	Room struct {
		ID        primitive.ObjectID   `bson:"_id,omitempty" json:"_id,omitempty"`
		Name      common.LocalizedName `bson:"name" json:"name"`
		Type      string              `bson:"type" json:"type"`
		Status    string              `bson:"status" json:"status"` // active or inactive
		Capacity  int                 `bson:"capacity" json:"capacity"`
		Members   []primitive.ObjectID `bson:"members" json:"members"`
		CreatedBy primitive.ObjectID   `bson:"createdBy" json:"createdBy"`
		Image     string              `bson:"image,omitempty" json:"image,omitempty"`
		CreatedAt time.Time           `bson:"createdAt" json:"createdAt"`
		UpdatedAt time.Time           `bson:"updatedAt" json:"updatedAt"`
		Metadata  map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"`
		Schedule  *RoomSchedule       `bson:"schedule,omitempty" json:"schedule,omitempty"` // เพิ่มฟิลด์ schedule
	}

	RoomEvent struct {
		Type    string          `json:"type"`
		RoomID  string          `json:"roomId"`
		Payload json.RawMessage `json:"payload"`
	}
)

// IsReadOnly ตรวจสอบว่าห้องเป็นแบบ read-only หรือไม่
func (r *Room) IsReadOnly() bool {
	return r.Type == RoomTypeReadOnly
}

// IsActive ตรวจสอบว่าห้องเปิดใช้งานหรือไม่
func (r *Room) IsActive() bool {
	return r.Status == RoomStatusActive
}

// IsInactive ตรวจสอบว่าห้องปิดใช้งานหรือไม่
func (r *Room) IsInactive() bool {
	return r.Status == RoomStatusInactive
}

// CanUserSendMessages ตรวจสอบว่า user สามารถส่งข้อความได้หรือไม่
func (r *Room) CanUserSendMessages() bool {
	return r.Type == RoomTypeNormal
}

// ValidateRoomType ตรวจสอบความถูกต้องของ room type
func ValidateRoomType(roomType string) bool {
	return roomType == RoomTypeNormal || roomType == RoomTypeReadOnly
}

// ValidateRoomStatus ตรวจสอบความถูกต้องของ room status
func ValidateRoomStatus(status string) bool {
	return status == RoomStatusActive || status == RoomStatusInactive
}

// IsUnlimitedCapacity ตรวจสอบว่าห้องมี capacity ไม่จำกัดหรือไม่
func (r *Room) IsUnlimitedCapacity() bool {
	return r.Capacity == 0
}

// CanAddMoreMembers ตรวจสอบว่าสามารถเพิ่มสมาชิกได้อีกหรือไม่
func (r *Room) CanAddMoreMembers() bool {
	// ถ้า capacity = 0 แสดงว่าไม่จำกัด
	if r.IsUnlimitedCapacity() {
		return true
	}
	// ถ้ามี capacity จำกัด ให้ตรวจสอบจำนวนปัจจุบัน
	return len(r.Members) < r.Capacity
}

// GetAvailableSlots คืนจำนวนที่ว่างในห้อง (-1 = unlimited)
func (r *Room) GetAvailableSlots() int {
	if r.IsUnlimitedCapacity() {
		return -1 // unlimited
	}
	available := r.Capacity - len(r.Members)
	if available < 0 {
		return 0
	}
	return available
}

// IsGroupRoom ตรวจสอบว่าห้องเป็น group room หรือไม่
func (r *Room) IsGroupRoom() bool {
	if r.Metadata == nil {
		return false
	}
	isGroup, exists := r.Metadata["isGroupRoom"]
	return exists && isGroup == true
}

// GetGroupType ดึงประเภทของกลุ่ม (major หรือ school)
func (r *Room) GetGroupType() string {
	if r.Metadata == nil {
		return ""
	}
	groupType, exists := r.Metadata["groupType"]
	if !exists {
		return ""
	}
	if str, ok := groupType.(string); ok {
		return str
	}
	return ""
}

// GetGroupValue ดึงค่าของกลุ่ม (ID ของ major หรือ school)
func (r *Room) GetGroupValue() string {
	if r.Metadata == nil {
		return ""
	}
	groupValue, exists := r.Metadata["groupValue"]
	if !exists {
		return ""
	}
	if str, ok := groupValue.(string); ok {
		return str
	}
	return ""
}

// ShouldAutoAddNewUsers ตรวจสอบว่าห้องควร auto add user ใหม่หรือไม่
func (r *Room) ShouldAutoAddNewUsers() bool {
	if r.Metadata == nil {
		return false
	}
	autoAdd, exists := r.Metadata["autoAdd"]
	return exists && autoAdd == true
}

// IsScheduleEnabled ตรวจสอบว่าห้องเปิดใช้งาน schedule หรือไม่
func (r *Room) IsScheduleEnabled() bool {
	return r.Schedule != nil && (r.Schedule.StartAt != nil || r.Schedule.EndAt != nil)
}

// IsRoomAccessible ตรวจสอบว่าห้องสามารถเข้าได้ตามเวลาที่กำหนดหรือไม่
func (r *Room) IsRoomAccessible(now time.Time) bool {
	// ถ้าห้องไม่ active ให้ return false
	if !r.IsActive() {
		return false
	}

	// ถ้าไม่มี schedule ให้เข้าได้ตามปกติ
	if !r.IsScheduleEnabled() {
		return true
	}

	schedule := r.Schedule

	// ตรวจสอบเวลาเริ่มต้น (ให้ margin 1 นาที)
	if schedule.StartAt != nil && now.Before(schedule.StartAt.Add(-time.Minute)) {
		return false
	}

	// ตรวจสอบเวลาสิ้นสุด (ให้ margin 1 นาที)
	if schedule.EndAt != nil && now.After(schedule.EndAt.Add(time.Minute)) {
		return false
	}

	return true
}

// IsRoomAccessibleForWebSocket ตรวจสอบการเข้าถึงสำหรับ WebSocket (ผ่อนปรนกว่า)
func (r *Room) IsRoomAccessibleForWebSocket(now time.Time) bool {
	// ถ้าห้องไม่ active ให้ return false
	if !r.IsActive() {
		return false
	}

	// ถ้าไม่มี schedule ให้เข้าได้ตามปกติ
	if !r.IsScheduleEnabled() {
		return true
	}

	schedule := r.Schedule

	// ตรวจสอบเวลาเริ่มต้น (ให้ margin 2 นาที)
	if schedule.StartAt != nil && now.Before(schedule.StartAt.Add(-2*time.Minute)) {
		return false
	}

	// ตรวจสอบเวลาสิ้นสุด (ให้ margin 2 นาที)
	if schedule.EndAt != nil && now.After(schedule.EndAt.Add(2*time.Minute)) {
		return false
	}

	return true
}

// GetScheduleStatus ดึงสถานะของ schedule
func (r *Room) GetScheduleStatus(now time.Time) string {
	if !r.IsScheduleEnabled() {
		return "no_schedule"
	}

	if r.IsRoomAccessible(now) {
		return "open"
	}

	return "closed"
}