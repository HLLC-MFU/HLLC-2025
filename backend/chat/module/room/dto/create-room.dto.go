package dto

import (
	"chat/pkg/common"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CreateRoomDto struct {
	Name      common.LocalizedName `json:"name" validate:"notEmpty"`
	Capacity  int                 `json:"capacity" validate:"notEmpty"`
	CreatedBy string             `json:"createdBy" validate:"mongoId"`
}

type AddRoomMembersDto struct {
	UserIDs []string `json:"userIds" validate:"mongoId"`
} 


func (dto *CreateRoomDto) ToObjectID() primitive.ObjectID {
	id, _ := primitive.ObjectIDFromHex(dto.CreatedBy)
	return id
}

func (dto *AddRoomMembersDto) ToObjectIDs() []primitive.ObjectID {
	objectIDs := make([]primitive.ObjectID, len(dto.UserIDs))
	for i, userID := range dto.UserIDs {
		objectID, _ := primitive.ObjectIDFromHex(userID)
		objectIDs[i] = objectID
	}
	return objectIDs
}