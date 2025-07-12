package dto

import (
	"chat/pkg/common"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	CreateRoomDto struct {
		Name           common.LocalizedName `form:"name" validate:"notEmpty"`
		Type           string               `form:"type" validate:"roomType"`  // ประเภทห้อง (normal, readonly)
		Capacity       int                  `form:"capacity" validate:"gte=0"` // 0 = unlimited
		Members        []string             `form:"members" validate:"mongoId,optional"`
		CreatedBy      string               `form:"createdBy" validate:"mongoId,optional"` // Optional - will extract from JWT if not provided
		Status         string               `form:"status" validate:"roomStatus"`          // สถานะห้อง (active, inactive)
		Image          string               `form:"image" validate:"optional"`
		SelectAllUsers bool                 `form:"selectAllUsers" json:"selectAllUsers"`
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
