// JoinRoomByGroupDto สำหรับการเข้าห้องตามกลุ่ม
package dto

import (
	roomDto "chat/module/room/room/dto"
	"chat/module/room/room/model"
	"chat/pkg/common"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	JoinRoomByGroupDto struct {
		RoomID     string `json:"roomId" validate:"required,mongoId"`
		GroupType  string `json:"groupType" validate:"required"` // "major" หรือ "school"
		GroupValue string `json:"groupValue" validate:"required"`
	}

	CreateRoomByGroupDto struct {
		Name       common.LocalizedName `form:"name" validate:"notEmpty"`
		GroupType  string               `form:"groupType" validate:"required"`         // "major" หรือ "school"
		GroupValue string               `form:"groupValue" validate:"required"`        // ID ของ major หรือ school
		Type       string               `form:"type" validate:"roomType"`              // ประเภทห้อง (normal, readonly)
		Status     string               `form:"status" validate:"roomStatus"`          // สถานะห้อง (active, inactive)
		CreatedBy  string               `form:"createdBy" validate:"mongoId,optional"` // Optional - will extract from JWT if not provided
		Image      string               `form:"image" validate:"optional"`
		Schedule   *roomDto.ScheduleDto `form:"schedule" validate:"optional"`          // เพิ่มฟิลด์ schedule
		// หมายเหตุ: ไม่ต้องระบุ capacity เพราะห้องกลุ่มจะเป็น unlimited (capacity = 0)
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
		Schedule       *roomDto.ScheduleDto `form:"schedule" validate:"optional"` // เพิ่มฟิลด์ schedule
	}

	ResponseRoomDto struct {
		ID          primitive.ObjectID     `bson:"_id,omitempty" json:"_id,omitempty"`
		Name        common.LocalizedName   `bson:"name" json:"name"`
		Type        string                 `bson:"type" json:"type"`
		Status      string                 `bson:"status" json:"status"`
		Capacity    int                    `bson:"capacity" json:"capacity"`
		CreatedBy   primitive.ObjectID     `bson:"createdBy" json:"createdBy"` // string for response
		Image       string                 `bson:"image,omitempty" json:"image,omitempty"`
		CreatedAt   time.Time              `bson:"createdAt" json:"createdAt"`
		UpdatedAt   time.Time              `bson:"updatedAt" json:"updatedAt"`
		Metadata    map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"`
		MemberCount int                    `bson:"memberCount" json:"memberCount"` // เพิ่ม field นี้
		CanJoin     bool                   `json:"canJoin,omitempty"`              // เพิ่ม field นี้
		Schedule    *model.RoomSchedule    `bson:"schedule,omitempty" json:"schedule,omitempty"` // เพิ่มฟิลด์ schedule
	}

	ResponseAllRoomForUserDto struct {
		ID          primitive.ObjectID     `bson:"_id,omitempty" json:"_id,omitempty"`
		Name        common.LocalizedName   `bson:"name" json:"name"`
		Type        string                 `bson:"type" json:"type"`
		Status      string                 `bson:"status" json:"status"`
		Capacity    int                    `bson:"capacity" json:"capacity"`
		CreatedBy   primitive.ObjectID     `bson:"createdBy" json:"createdBy"` // string for response
		Image       string                 `bson:"image,omitempty" json:"image,omitempty"`
		CreatedAt   time.Time              `bson:"createdAt" json:"createdAt"`
		UpdatedAt   time.Time              `bson:"updatedAt" json:"updatedAt"`
		Metadata    map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"`
		IsMember    bool                   `json:"isMember"`
		CanJoin     bool                   `json:"canJoin"`     // remove omitempty to always show
		MemberCount int                    `json:"memberCount"` // เพิ่ม field นี้
		Schedule    *model.RoomSchedule    `bson:"schedule,omitempty" json:"schedule,omitempty"` // เพิ่มฟิลด์ schedule
	}

	ResponseRoomMemberDto struct {
		ID      primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
		Members []struct {
			User struct {
				ID       string `json:"_id"`
				Username string `json:"username"`
			} `json:"user"`
		} `json:"members"`
	}

	ResponseGroupRoomDto struct {
		ID       primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
		IsMember bool               `json:"isMember,omitempty"` // เพิ่ม field ใหม่
	}

	BulkAddUsersDto struct {
		RoomID  string   `json:"roomId" validate:"required,mongoId"`
		UserIDs []string `json:"userIds" validate:"required"`
	}

	GroupRoomStatsDto struct {
		GroupType  string `query:"groupType" validate:"required"`  // "major" หรือ "school"
		GroupValue string `query:"groupValue" validate:"required"` // ID ของ major หรือ school
	}
)

// ToObjectIDs แปลง string IDs เป็น ObjectIDs
func (dto *JoinRoomByGroupDto) ToObjectID() primitive.ObjectID {
	id, _ := primitive.ObjectIDFromHex(dto.RoomID)
	return id
}

func (dto *CreateRoomByGroupDto) ToObjectID() primitive.ObjectID {
	id, _ := primitive.ObjectIDFromHex(dto.CreatedBy)
	return id
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

func (dto *BulkAddUsersDto) ToObjectIDs() (roomObjID primitive.ObjectID, userObjIDs []primitive.ObjectID) {
	roomObjID, _ = primitive.ObjectIDFromHex(dto.RoomID)

	userObjIDs = make([]primitive.ObjectID, 0, len(dto.UserIDs))
	for _, userID := range dto.UserIDs {
		userObjID, _ := primitive.ObjectIDFromHex(userID)
		userObjIDs = append(userObjIDs, userObjID)
	}

	return
}

// ValidateGroupType ตรวจสอบประเภทกลุ่มที่ถูกต้อง
func (dto *JoinRoomByGroupDto) ValidateGroupType() error {
	if dto.GroupType != "major" && dto.GroupType != "school" {
		return fmt.Errorf("invalid group type: %s (must be 'major' or 'school')", dto.GroupType)
	}
	return nil
}

func (dto *CreateRoomByGroupDto) ValidateGroupType() error {
	if dto.GroupType != "major" && dto.GroupType != "school" {
		return fmt.Errorf("invalid group type: %s (must be 'major' or 'school')", dto.GroupType)
	}
	return nil
}
