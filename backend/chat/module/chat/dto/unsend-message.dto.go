package dto

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UnsendMessageDto struct {
	MessageID string `json:"messageId" validate:"required,mongoId"`
	UserID    string `json:"userId" validate:"required,mongoId"`
}

func (dto *UnsendMessageDto) ToObjectIDs() (messageObjID primitive.ObjectID, userObjID primitive.ObjectID, err error) {
	messageObjID, err = primitive.ObjectIDFromHex(dto.MessageID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, err
	}

	userObjID, err = primitive.ObjectIDFromHex(dto.UserID)
	if err != nil {
		return primitive.NilObjectID, primitive.NilObjectID, err
	}

	return messageObjID, userObjID, nil
} 