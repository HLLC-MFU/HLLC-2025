package dto

import (
	"chat/pkg/common"

	"chat/module/room/model"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type(
	CreateRoomDto struct {
		Name      common.LocalizedName `form:"name" validate:"notEmpty"`
		Type      string               `form:"type" validate:"roomType"`      // ประเภทห้อง (normal, readonly)
		Capacity  int                  `form:"capacity" validate:"notEmpty"`
		Members   []string             `form:"members" validate:"mongoId,optional"`
		CreatedBy string               `form:"createdBy" validate:"mongoId"`
		Image     string               `form:"image" validate:"optional"`
	}

	UpdateRoomDto struct {
		Name     common.LocalizedName `json:"name" validate:"notEmpty"`
		Type     string              `json:"type" validate:"roomType"`
		Capacity int                 `json:"capacity" validate:"notEmpty"`
	}

	AddRoomMembersDto struct {
		Members []string `json:"members" validate:"mongoId,optional"`
		RoomID  string   `json:"roomId" validate:"mongoId"`
	} 

	JoinRoomDto struct {
		UserID string `json:"userId" validate:"required,mongoId"`
	}
	
	LeaveRoomDto struct {
		UserID string `json:"userId" validate:"required,mongoId"`
	}

	UpdateRoomTypeDto struct {
		Type string `json:"type" validate:"roomType"`
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

func (dto *JoinRoomDto) ToObjectID() primitive.ObjectID {
	id, _ := primitive.ObjectIDFromHex(dto.UserID)
	return id
}

func (dto *LeaveRoomDto) ToObjectID() primitive.ObjectID {
	id, _ := primitive.ObjectIDFromHex(dto.UserID)
	return id
}

func (dto *UpdateRoomDto) ToRoom() *model.Room {
	return &model.Room{
		Name:     dto.Name,
		Type:     dto.Type,
		Capacity: dto.Capacity,
	}
}

