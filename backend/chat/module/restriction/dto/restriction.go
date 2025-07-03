package dto

import (
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	// BanUserDto สำหรับ ban user
	BanUserDto struct {
		UserID     string `json:"userId" validate:"required,mongoId"`
		RoomID     string `json:"roomId" validate:"required,mongoId"`
		Duration   string `json:"duration" validate:"required"` // "temporary" หรือ "permanent"
		TimeValue  int    `json:"timeValue,omitempty"`         // จำนวนเวลา (ถ้าเป็น temporary)
		TimeUnit   string `json:"timeUnit,omitempty"`          // "minutes" หรือ "hours"
		Reason     string `json:"reason" validate:"required"`
	}

	// MuteUserDto สำหรับ mute user
	MuteUserDto struct {
		UserID      string `json:"userId" validate:"required,mongoId"`
		RoomID      string `json:"roomId" validate:"required,mongoId"`
		Duration    string `json:"duration" validate:"required"`    // "temporary" หรือ "permanent"
		TimeValue   int    `json:"timeValue,omitempty"`            // จำนวนเวลา
		TimeUnit    string `json:"timeUnit,omitempty"`             // "minutes" หรือ "hours"
		Restriction string `json:"restriction" validate:"required"` // "can_view" หรือ "cannot_view"
		Reason      string `json:"reason" validate:"required"`
	}

	// KickUserDto สำหรับ kick user
	KickUserDto struct {
		UserID      string `json:"userId" validate:"required,mongoId"`
		RoomID      string `json:"roomId" validate:"required,mongoId"`
		Reason      string `json:"reason" validate:"required"`
	}

	// UnbanUserDto สำหรับ unban user
	UnbanUserDto struct {
		UserID      string `json:"userId" validate:"required,mongoId"`
		RoomID      string `json:"roomId" validate:"required,mongoId"`
	}

	// UnmuteUserDto สำหรับ unmute user
	UnmuteUserDto struct {
		UserID      string `json:"userId" validate:"required,mongoId"`
		RoomID      string `json:"roomId" validate:"required,mongoId"`
	}

	// GetModerationHistoryDto สำหรับดูประวัติการลงโทษ
	GetRestrictionHistoryDto struct {
		RoomID string `query:"roomId,omitempty"`
		UserID string `query:"userId,omitempty"`
		Type   string `query:"type,omitempty"` // ban, mute, kick
		Status string `query:"status,omitempty"` // active, expired, revoked
		Page   int    `query:"page"`
		Limit  int    `query:"limit"`
	}
)

// ToObjectIDs แปลง string IDs เป็น ObjectIDs สำหรับ BanUserDto
func (dto *BanUserDto) ToObjectIDs() (userObjID, roomObjID primitive.ObjectID, err error) {
	userObjID, err = primitive.ObjectIDFromHex(dto.UserID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, fmt.Errorf("invalid user ID: %w", err)
	}

	roomObjID, err = primitive.ObjectIDFromHex(dto.RoomID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, fmt.Errorf("invalid room ID: %w", err)
	}

	return userObjID, roomObjID, nil
}

// CalculateEndTime คำนวณเวลาสิ้นสุดสำหรับ BanUserDto
func (dto *BanUserDto) CalculateEndTime() (*time.Time, error) {
	if dto.Duration == "permanent" {
		return nil, nil
	}

	if dto.TimeValue <= 0 {
		return nil, fmt.Errorf("time value must be greater than 0 for temporary ban")
	}

	var duration time.Duration
	switch dto.TimeUnit {
	case "minutes":
		duration = time.Duration(dto.TimeValue) * time.Minute
	case "hours":
		duration = time.Duration(dto.TimeValue) * time.Hour
	default:
		return nil, fmt.Errorf("invalid time unit: %s (must be 'minutes' or 'hours')", dto.TimeUnit)
	}

	endTime := time.Now().Add(duration)
	return &endTime, nil
}

// ToObjectIDs แปลง string IDs เป็น ObjectIDs สำหรับ MuteUserDto
func (dto *MuteUserDto) ToObjectIDs() (userObjID, roomObjID primitive.ObjectID, err error) {
	userObjID, err = primitive.ObjectIDFromHex(dto.UserID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, fmt.Errorf("invalid user ID: %w", err)
	}

	roomObjID, err = primitive.ObjectIDFromHex(dto.RoomID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, fmt.Errorf("invalid room ID: %w", err)
	}

	return userObjID, roomObjID, nil
}

// CalculateEndTime คำนวณเวลาสิ้นสุดสำหรับ MuteUserDto
func (dto *MuteUserDto) CalculateEndTime() (*time.Time, error) {
	if dto.Duration == "permanent" {
		return nil, nil
	}

	if dto.TimeValue <= 0 {
		return nil, fmt.Errorf("time value must be greater than 0 for temporary mute")
	}

	var duration time.Duration
	switch dto.TimeUnit {
	case "minutes":
		duration = time.Duration(dto.TimeValue) * time.Minute
	case "hours":
		duration = time.Duration(dto.TimeValue) * time.Hour
	default:
		return nil, fmt.Errorf("invalid time unit: %s (must be 'minutes' or 'hours')", dto.TimeUnit)
	}

	endTime := time.Now().Add(duration)
	return &endTime, nil
}

// ToObjectIDs แปลง string IDs เป็น ObjectIDs สำหรับ KickUserDto
func (dto *KickUserDto) ToObjectIDs() (userObjID, roomObjID primitive.ObjectID, err error) {
	userObjID, err = primitive.ObjectIDFromHex(dto.UserID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, fmt.Errorf("invalid user ID: %w", err)
	}

	roomObjID, err = primitive.ObjectIDFromHex(dto.RoomID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, fmt.Errorf("invalid room ID: %w", err)
	}

	return userObjID, roomObjID, nil
}

// ToObjectIDs แปลง string IDs เป็น ObjectIDs สำหรับ UnbanUserDto
func (dto *UnbanUserDto) ToObjectIDs() (userObjID, roomObjID primitive.ObjectID, err error) {
	userObjID, err = primitive.ObjectIDFromHex(dto.UserID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, fmt.Errorf("invalid user ID: %w", err)
	}

	roomObjID, err = primitive.ObjectIDFromHex(dto.RoomID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, fmt.Errorf("invalid room ID: %w", err)
	}

	return userObjID, roomObjID, nil
}

// ToObjectIDs แปลง string IDs เป็น ObjectIDs สำหรับ UnmuteUserDto
func (dto *UnmuteUserDto) ToObjectIDs() (userObjID, roomObjID primitive.ObjectID, err error) {
	userObjID, err = primitive.ObjectIDFromHex(dto.UserID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, fmt.Errorf("invalid user ID: %w", err)
	}

	roomObjID, err = primitive.ObjectIDFromHex(dto.RoomID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, fmt.Errorf("invalid room ID: %w", err)
	}

	return userObjID, roomObjID, nil
}

// Validate ตรวจสอบความถูกต้องของ BanUserDto
func (dto *BanUserDto) Validate() error {
	if dto.Duration != "temporary" && dto.Duration != "permanent" {
		return fmt.Errorf("duration must be 'temporary' or 'permanent'")
	}

	if dto.Duration == "temporary" {
		if dto.TimeValue <= 0 {
			return fmt.Errorf("timeValue must be greater than 0 for temporary ban")
		}
		if dto.TimeUnit != "minutes" && dto.TimeUnit != "hours" {
			return fmt.Errorf("timeUnit must be 'minutes' or 'hours'")
		}
	}

	return nil
}

// Validate ตรวจสอบความถูกต้องของ MuteUserDto
func (dto *MuteUserDto) Validate() error {
	if dto.Duration != "temporary" && dto.Duration != "permanent" {
		return fmt.Errorf("duration must be 'temporary' or 'permanent'")
	}

	if dto.Duration == "temporary" {
		if dto.TimeValue <= 0 {
			return fmt.Errorf("timeValue must be greater than 0 for temporary mute")
		}
		if dto.TimeUnit != "minutes" && dto.TimeUnit != "hours" {
			return fmt.Errorf("timeUnit must be 'minutes' or 'hours'")
		}
	}

	if dto.Restriction != "can_view" && dto.Restriction != "cannot_view" {
		return fmt.Errorf("restriction must be 'can_view' or 'cannot_view'")
	}

	return nil
}

// GetTimeDescription สร้างคำอธิบายเวลาที่เป็นมิตรต่อผู้ใช้
func (dto *BanUserDto) GetTimeDescription() string {
	if dto.Duration == "permanent" {
		return "ถาวร"
	}
	
	unit := "นาที"
	if dto.TimeUnit == "hours" {
		unit = "ชั่วโมง"
	}
	
	return fmt.Sprintf("%d %s", dto.TimeValue, unit)
}

// GetTimeDescription สร้างคำอธิบายเวลาที่เป็นมิตรต่อผู้ใช้สำหรับ MuteUserDto
func (dto *MuteUserDto) GetTimeDescription() string {
	if dto.Duration == "permanent" {
		return "ถาวร"
	}
	
	unit := "นาที"
	if dto.TimeUnit == "hours" {
		unit = "ชั่วโมง"
	}
	
	return fmt.Sprintf("%d %s", dto.TimeValue, unit)
} 