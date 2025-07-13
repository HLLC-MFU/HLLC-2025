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

// Schedule Type Constants
const (
	ScheduleTypeOneTime = "one-time" // ใช้ครั้งเดียว
	ScheduleTypeLoop    = "loop"     // วนลูปทุกวัน
)

type (
	// RoomSchedule สำหรับการตั้งเวลาเปิดปิดห้อง
	RoomSchedule struct {
		Type    string     `bson:"type" json:"type"`                       // "one-time" หรือ "loop"
		StartAt *time.Time `bson:"startAt,omitempty" json:"startAt,omitempty"` // เวลาเริ่มเปิดห้อง
		EndAt   *time.Time `bson:"endAt,omitempty" json:"endAt,omitempty"`     // เวลาปิดห้อง
		Enabled bool       `bson:"enabled" json:"enabled"`                 // เปิดใช้งาน schedule หรือไม่
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

// ValidateScheduleType ตรวจสอบความถูกต้องของ schedule type
func ValidateScheduleType(scheduleType string) bool {
	return scheduleType == ScheduleTypeOneTime || scheduleType == ScheduleTypeLoop
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
	return r.Schedule != nil && r.Schedule.Enabled
}

// IsRoomAccessible ตรวจสอบว่าห้องสามารถเข้าได้ตามเวลาที่กำหนดหรือไม่
func (r *Room) IsRoomAccessible(now time.Time) bool {
	// ถ้าไม่เปิดใช้งาน schedule ให้เข้าได้ตามปกติ
	if !r.IsScheduleEnabled() {
		return r.IsActive()
	}

	// ถ้าเปิดใช้งาน schedule ให้ตรวจสอบเวลา
	schedule := r.Schedule
	if schedule.Type == ScheduleTypeOneTime {
		return r.IsOneTimeAccessible(now)
	} else if schedule.Type == ScheduleTypeLoop {
		return r.IsLoopAccessible(now)
	}

	return r.IsActive()
}

// IsRoomAccessibleForWebSocket ตรวจสอบการเข้าถึงสำหรับ WebSocket (ผ่อนปรนกว่า)
func (r *Room) IsRoomAccessibleForWebSocket(now time.Time) bool {
	// ถ้าไม่เปิดใช้งาน schedule ให้เข้าได้ตามปกติ
	if !r.IsScheduleEnabled() {
		return r.IsActive()
	}

	// ถ้าเปิดใช้งาน schedule ให้ตรวจสอบเวลาแบบผ่อนปรน
	schedule := r.Schedule
	if schedule.Type == ScheduleTypeOneTime {
		return r.IsOneTimeAccessibleForWebSocket(now)
	} else if schedule.Type == ScheduleTypeLoop {
		return r.IsLoopAccessibleForWebSocket(now)
	}

	return r.IsActive()
}

// IsOneTimeAccessibleForWebSocket ตรวจสอบการเข้าถึงแบบ one-time สำหรับ WebSocket
func (r *Room) IsOneTimeAccessibleForWebSocket(now time.Time) bool {
	if !r.IsActive() {
		return false
	}

	schedule := r.Schedule
	if schedule == nil {
		return true
	}

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

// IsLoopAccessibleForWebSocket ตรวจสอบการเข้าถึงแบบ loop สำหรับ WebSocket
func (r *Room) IsLoopAccessibleForWebSocket(now time.Time) bool {
	if !r.IsActive() {
		return false
	}

	schedule := r.Schedule
	if schedule == nil {
		return true
	}

	// สำหรับ loop ให้ใช้เฉพาะเวลาในวัน ไม่สนใจวันที่
	currentTime := time.Date(1, 1, 1, now.Hour(), now.Minute(), now.Second(), 0, now.Location())

	var startTime, endTime time.Time
	if schedule.StartAt != nil {
		startTime = time.Date(1, 1, 1, schedule.StartAt.Hour(), schedule.StartAt.Minute(), schedule.StartAt.Second(), 0, now.Location())
	}
	if schedule.EndAt != nil {
		endTime = time.Date(1, 1, 1, schedule.EndAt.Hour(), schedule.EndAt.Minute(), schedule.EndAt.Second(), 0, now.Location())
	}

	// ถ้าไม่มีเวลาเริ่มต้น ให้ถือว่าเริ่มตั้งแต่ 00:00
	if schedule.StartAt == nil {
		startTime = time.Date(1, 1, 1, 0, 0, 0, 0, now.Location())
	}

	// ถ้าไม่มีเวลาสิ้นสุด ให้ถือว่าสิ้นสุดที่ 23:59
	if schedule.EndAt == nil {
		endTime = time.Date(1, 1, 1, 23, 59, 59, 0, now.Location())
	}

	// กรณีที่เวลาเริ่มต้นมากกว่าเวลาสิ้นสุด (ข้ามวัน)
	if !startTime.Before(endTime) {
		// เช่น 22:00 - 06:00 (ข้ามคืน) (ให้ margin 2 นาที)
		return currentTime.After(startTime.Add(-2*time.Minute)) || currentTime.Before(endTime.Add(2*time.Minute))
	}

	// กรณีปกติ (ให้ margin 2 นาที)
	return currentTime.After(startTime.Add(-2*time.Minute)) && currentTime.Before(endTime.Add(2*time.Minute))
}

// IsOneTimeAccessible ตรวจสอบการเข้าถึงแบบ one-time
func (r *Room) IsOneTimeAccessible(now time.Time) bool {
	if !r.IsActive() {
		return false
	}

	schedule := r.Schedule
	if schedule == nil {
		return true
	}

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

// IsLoopAccessible ตรวจสอบการเข้าถึงแบบ loop (ทุกวัน)
func (r *Room) IsLoopAccessible(now time.Time) bool {
	if !r.IsActive() {
		return false
	}

	schedule := r.Schedule
	if schedule == nil {
		return true
	}

	// สำหรับ loop ให้ใช้เฉพาะเวลาในวัน ไม่สนใจวันที่
	currentTime := time.Date(1, 1, 1, now.Hour(), now.Minute(), now.Second(), 0, now.Location())

	var startTime, endTime time.Time
	if schedule.StartAt != nil {
		startTime = time.Date(1, 1, 1, schedule.StartAt.Hour(), schedule.StartAt.Minute(), schedule.StartAt.Second(), 0, now.Location())
	}
	if schedule.EndAt != nil {
		endTime = time.Date(1, 1, 1, schedule.EndAt.Hour(), schedule.EndAt.Minute(), schedule.EndAt.Second(), 0, now.Location())
	}

	// ถ้าไม่มีเวลาเริ่มต้น ให้ถือว่าเริ่มตั้งแต่ 00:00
	if schedule.StartAt == nil {
		startTime = time.Date(1, 1, 1, 0, 0, 0, 0, now.Location())
	}

	// ถ้าไม่มีเวลาสิ้นสุด ให้ถือว่าสิ้นสุดที่ 23:59
	if schedule.EndAt == nil {
		endTime = time.Date(1, 1, 1, 23, 59, 59, 0, now.Location())
	}

	// กรณีที่เวลาเริ่มต้นมากกว่าเวลาสิ้นสุด (ข้ามวัน)
	if !startTime.Before(endTime) {
		// เช่น 22:00 - 06:00 (ข้ามคืน) (ให้ margin 1 นาที)
		return currentTime.After(startTime.Add(-time.Minute)) || currentTime.Before(endTime.Add(time.Minute))
	}

	// กรณีปกติ (ให้ margin 1 นาที)
	return currentTime.After(startTime.Add(-time.Minute)) && currentTime.Before(endTime.Add(time.Minute))
}

// GetScheduleStatus ดึงสถานะของ schedule
func (r *Room) GetScheduleStatus(now time.Time) string {
	if !r.IsScheduleEnabled() {
		return "disabled"
	}

	if r.IsRoomAccessible(now) {
		return "open"
	}

	return "closed"
}