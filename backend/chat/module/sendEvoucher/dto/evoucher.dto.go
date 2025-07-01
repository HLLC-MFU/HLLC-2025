package dto

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	SendEvoucherDto struct {
		UserID      string                 `json:"userId" validate:"required,mongoId"`
		RoomID      string                 `json:"roomId" validate:"required,mongoId"`
		Title       string                 `json:"title" validate:"required"`
		Description string                 `json:"description" validate:"required"`
		ClaimURL    string                 `json:"claimUrl" validate:"required"`
	}

	ClaimEvoucherDto struct {
		UserID     string `json:"userId" validate:"required,mongoId"`
		EvoucherID string `json:"evoucherId" validate:"required"`
	}
)

// Convert string IDs to ObjectIDs
func (dto *SendEvoucherDto) ToObjectIDs() (userObjID, roomObjID primitive.ObjectID, err error) {
	userObjID, err = primitive.ObjectIDFromHex(dto.UserID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, err
	}

	roomObjID, err = primitive.ObjectIDFromHex(dto.RoomID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, err
	}

	return userObjID, roomObjID, nil
}

func (dto *ClaimEvoucherDto) ToObjectID() (userObjID primitive.ObjectID, err error) {
	return primitive.ObjectIDFromHex(dto.UserID)
} 