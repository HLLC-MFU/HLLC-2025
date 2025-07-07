package dto

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UnsendMessageDto struct {
	MessageID string `json:"messageId" validate:"required,mongoId"`
}

func (dto *UnsendMessageDto) ToObjectIDs() (messageObjID primitive.ObjectID, err error) {
	messageObjID, err = primitive.ObjectIDFromHex(dto.MessageID)
	if err != nil {
		return primitive.NilObjectID, err
	}

	return messageObjID, nil
} 