package dto

import (
	"chat/pkg/common"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type(
	CreateRoomDto struct {
		Name      common.LocalizedName `form:"name" validate:"notEmpty"`
		Capacity  int                  `form:"capacity" validate:"notEmpty"`
		Members   []string            `form:"members" validate:"mongoId,optional"`
		CreatedBy string              `form:"createdBy" validate:"mongoId"`
	}

	AddRoomMembersDto struct {
		Members []string `json:"members" validate:"mongoId,optional"`
		RoomID  string   `json:"roomId" validate:"mongoId"`
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