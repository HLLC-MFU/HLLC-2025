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

func (dto *CreateRoomDto) ToObjectID() primitive.ObjectID {
	id, _ := primitive.ObjectIDFromHex(dto.CreatedBy)
	return id
}