package dto

import (
	"chat/module/room/room/model"
	"chat/pkg/common"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	// ScheduleDto สำหรับการตั้งเวลาเปิดปิดห้อง
	ScheduleDto struct {
		StartAt string `form:"scheduleStartAt" validate:"optional"`   // เวลาเริ่มเปิดห้อง (RFC3339 format)
		EndAt   string `form:"scheduleEndAt" validate:"optional"`     // เวลาปิดห้อง (RFC3339 format)
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

	schedule := &model.RoomSchedule{}

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

	if schedule.StartAt != nil {
		dto.StartAt = schedule.StartAt.Format(time.RFC3339)
	}

	if schedule.EndAt != nil {
		dto.EndAt = schedule.EndAt.Format(time.RFC3339)
	}
}

// ValidateSchedule ตรวจสอบความถูกต้องของ schedule
func (dto *ScheduleDto) ValidateSchedule() error {
	if dto == nil {
		return nil
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

	// ถ้ามีทั้ง start และ end ให้ตรวจสอบว่า start มาก่อน end
	if dto.StartAt != "" && dto.EndAt != "" {
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

	startAt := getValue("scheduleStartAt")
	endAt := getValue("scheduleEndAt")

	// ถ้าไม่มีค่าใดๆ ให้ return nil
	if startAt == "" && endAt == "" {
		return nil
	}

	return &ScheduleDto{
		StartAt: startAt,
		EndAt:   endAt,
	}
}
