package dto

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	SendEvoucherDto struct {
		UserID      string `json:"userId"`
		RoomID      string `json:"roomId" validate:"required,mongoId"`
		Title       string `json:"title" validate:"required"`
		Description string `json:"description" validate:"required"`
		ClaimURL    string `json:"claimUrl" validate:"required"`
	}

	ClaimEvoucherDto struct {
		UserID    string `json:"userId" validate:"required,mongoId"`
		MessageID string `json:"messageId" validate:"required,mongoId"`
	}

	ClaimEvoucherInChatDto struct {
		ClaimURL string `json:"claimUrl" validate:"required,url"`
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

func (dto *ClaimEvoucherDto) ToObjectIDs() (userObjID, messageObjID primitive.ObjectID, err error) {
	userObjID, err = primitive.ObjectIDFromHex(dto.UserID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, err
	}

	messageObjID, err = primitive.ObjectIDFromHex(dto.MessageID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, err
	}

	return userObjID, messageObjID, nil
} 