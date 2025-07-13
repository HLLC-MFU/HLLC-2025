package dto

import (
	"chat/module/room/room/model"
	"chat/pkg/common"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	// ScheduleDto สำหรับการตั้งเวลาเปิดปิดห้อง
	ScheduleDto struct {
		Type    string `form:"scheduleType" validate:"optional"`      // "one-time" หรือ "loop"
		StartAt string `form:"scheduleStartAt" validate:"optional"`   // เวลาเริ่มเปิดห้อง (RFC3339 format)
		EndAt   string `form:"scheduleEndAt" validate:"optional"`     // เวลาปิดห้อง (RFC3339 format)
		Enabled bool   `form:"scheduleEnabled" validate:"optional"`   // เปิดใช้งาน schedule หรือไม่
	}

	CreateRoomDto struct {
		Name           common.LocalizedName `form:"name" validate:"notEmpty"`
		Type           string               `form:"type" validate:"roomType"`  // ประเภทห้อง (normal, readonly)
		Capacity       int                  `form:"capacity" validate:"gte=0"` // 0 = unlimited
		Members        []string             `form:"members" validate:"mongoId,optional"`
		CreatedBy      string               `form:"createdBy" validate:"mongoId,optional"` // Optional - will extract from JWT if not provided
		Status         string               `form:"status" validate:"roomStatus"`          // สถานะห้อง (active, inactive)
		Image          string               `form:"image" validate:"optional"`
		SelectAllUsers bool                 `form:"selectAllUsers" json:"selectAllUsers"`
		Schedule       *ScheduleDto         `form:"schedule" validate:"optional"` // เพิ่มฟิลด์ schedule
	}

	UpdateRoomDto struct {
		Name           common.LocalizedName `form:"name" validate:"notEmpty"`
		Type           string               `form:"type" validate:"roomType"`     // ประเภทห้อง (normal, readonly)
		Status         string               `form:"status" validate:"roomStatus"` // สถานะห้อง (active, inactive)
		Capacity       int                  `form:"capacity" validate:"notEmpty"`
		Members        []string             `form:"members" validate:"mongoId,optional"`
		Image          string               `form:"image" validate:"optional"`
		UpdatedAt      time.Time            `form:"updatedAt" validate:"optional"`
		CreatedBy      string               `form:"createdBy" validate:"mongoId,optional"`
		SelectAllUsers bool                 `form:"selectAllUsers" json:"selectAllUsers"`
		Schedule       *ScheduleDto         `form:"schedule" validate:"optional"` // เพิ่มฟิลด์ schedule
	}

	AddRoomMembersDto struct {
		Members []string `json:"members" validate:"mongoId,optional"`
		RoomID  string   `json:"roomId" validate:"mongoId"`
	}

	UpdateRoomTypeDto struct {
		Type string `json:"type" validate:"roomType"`
	}

	UpdateRoomStatusDto struct {
		Status string `form:"status" validate:"roomStatus"`
	}
)

func (dto *CreateRoomDto) ToObjectID() primitive.ObjectID {
	id, _ := primitive.ObjectIDFromHex(dto.CreatedBy)
	return id
}

func (dto *AddRoomMembersDto) ToObjectIDs() []primitive.ObjectID {
	objectIDs := make([]primitive.ObjectID, len(dto.Members))
	for i, userID := range dto.Members {
		objID, _ := primitive.ObjectIDFromHex(userID)
		objectIDs[i] = objID
	}
	return objectIDs
}

// Helper: Convert Members to []primitive.ObjectID
func (dto *CreateRoomDto) MembersToObjectIDs() []primitive.ObjectID {
	objectIDs := make([]primitive.ObjectID, len(dto.Members))
	for i, userID := range dto.Members {
		objID, _ := primitive.ObjectIDFromHex(userID)
		objectIDs[i] = objID
	}
	return objectIDs
}

func (dto *CreateRoomDto) CreatedByToObjectID() primitive.ObjectID {
	objID, _ := primitive.ObjectIDFromHex(dto.CreatedBy)
	return objID
}

func (dto *UpdateRoomDto) MembersToObjectIDs() []primitive.ObjectID {
	objectIDs := make([]primitive.ObjectID, len(dto.Members))
	for i, userID := range dto.Members {
		objID, _ := primitive.ObjectIDFromHex(userID)
		objectIDs[i] = objID
	}
	return objectIDs
}

func (dto *UpdateRoomDto) CreatedByToObjectID() primitive.ObjectID {
	objID, _ := primitive.ObjectIDFromHex(dto.CreatedBy)
	return objID
}

// ToRoomSchedule แปลง ScheduleDto เป็น model.RoomSchedule
func (dto *ScheduleDto) ToRoomSchedule() (*model.RoomSchedule, error) {
	if dto == nil {
		return nil, nil
	}

	schedule := &model.RoomSchedule{
		Type:    dto.Type,
		Enabled: dto.Enabled,
	}

	// แปลง StartAt
	if dto.StartAt != "" {
		startAt, err := time.Parse(time.RFC3339, dto.StartAt)
		if err != nil {
			return nil, err
		}
		schedule.StartAt = &startAt
	}

	// แปลง EndAt
	if dto.EndAt != "" {
		endAt, err := time.Parse(time.RFC3339, dto.EndAt)
		if err != nil {
			return nil, err
		}
		schedule.EndAt = &endAt
	}

	return schedule, nil
}

// FromRoomSchedule แปลง model.RoomSchedule เป็น ScheduleDto
func (dto *ScheduleDto) FromRoomSchedule(schedule *model.RoomSchedule) {
	if schedule == nil {
		return
	}

	dto.Type = schedule.Type
	dto.Enabled = schedule.Enabled

	if schedule.StartAt != nil {
		dto.StartAt = schedule.StartAt.Format(time.RFC3339)
	}

	if schedule.EndAt != nil {
		dto.EndAt = schedule.EndAt.Format(time.RFC3339)
	}
}

// ValidateSchedule ตรวจสอบความถูกต้องของ schedule
func (dto *ScheduleDto) ValidateSchedule() error {
	if dto == nil || !dto.Enabled {
		return nil
	}

	// ตรวจสอบ schedule type
	if dto.Type != "" && !model.ValidateScheduleType(dto.Type) {
		return errors.New("invalid schedule type")
	}

	// ตรวจสอบรูปแบบเวลา
	if dto.StartAt != "" {
		if _, err := time.Parse(time.RFC3339, dto.StartAt); err != nil {
			return errors.New("invalid start time format")
		}
	}

	if dto.EndAt != "" {
		if _, err := time.Parse(time.RFC3339, dto.EndAt); err != nil {
			return errors.New("invalid end time format")
		}
	}

	// สำหรับ one-time ต้องมีทั้ง start และ end
	if dto.Type == model.ScheduleTypeOneTime {
		if dto.StartAt == "" || dto.EndAt == "" {
			return errors.New("one-time schedule requires both start and end time")
		}

		startAt, _ := time.Parse(time.RFC3339, dto.StartAt)
		endAt, _ := time.Parse(time.RFC3339, dto.EndAt)

		if !startAt.Before(endAt) {
			return errors.New("start time must be before end time")
		}
	}

	return nil
}

// ParseScheduleFromForm แยกข้อมูล schedule จาก form data
func ParseScheduleFromForm(values map[string][]string) *ScheduleDto {
	getValue := func(key string) string {
		if vals, exists := values[key]; exists && len(vals) > 0 {
			return vals[0]
		}
		return ""
	}

	scheduleType := getValue("scheduleType")
	if scheduleType == "" {
		return nil
	}

	return &ScheduleDto{
		Type:    scheduleType,
		StartAt: getValue("scheduleStartAt"),
		EndAt:   getValue("scheduleEndAt"),
		Enabled: strings.ToLower(getValue("scheduleEnabled")) == "true",
	}
}
