package dto

import "go.mongodb.org/mongo-driver/bson/primitive"

type (
	SendStickerDto struct {
		StickerID string `json:"stickerId" validate:"required,mongoId"`
		UserID    string `json:"userId" validate:"required,mongoId"`
	}
)

func (dto *SendStickerDto) ToObjectIDs() (stickerObjID, userObjID primitive.ObjectID, err error) {
	stickerObjID, err = primitive.ObjectIDFromHex(dto.StickerID)
	if err != nil {
		return
	}
	
	userObjID, err = primitive.ObjectIDFromHex(dto.UserID)
	if err != nil {
		return
	}
	
	return
} 