package dto

import "go.mongodb.org/mongo-driver/bson/primitive"

type (
	ReplyMessageDto struct {
		Message   string `json:"message" validate:"required"`
		ReplyToId string `json:"replyToId" validate:"required,mongoId"`
	}

	AddReactionDto struct {
		MessageID string `json:"messageId" validate:"required,mongoId"`
		Reaction  string `json:"reaction" validate:"required"`
	}

	RemoveReactionDto struct {
		MessageID string `json:"messageId" validate:"required,mongoId"`
	}
)

func (dto *ReplyMessageDto) ToObjectIDs() (replyToObjID primitive.ObjectID, err error) {
	replyToObjID, err = primitive.ObjectIDFromHex(dto.ReplyToId)
	if err != nil {
		return
	}
	
	return
}

func (dto *AddReactionDto) ToObjectIDs() (messageObjID primitive.ObjectID, err error) {
	messageObjID, err = primitive.ObjectIDFromHex(dto.MessageID)
	if err != nil {
		return
	}
	
	return
}

func (dto *RemoveReactionDto) ToObjectIDs() (messageObjID primitive.ObjectID, err error) {
	messageObjID, err = primitive.ObjectIDFromHex(dto.MessageID)
	if err != nil {
		return
	}
	
	return
} 