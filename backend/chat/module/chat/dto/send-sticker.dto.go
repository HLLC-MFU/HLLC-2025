package dto

import "go.mongodb.org/mongo-driver/bson/primitive"

type (
	SendStickerDto struct {
		StickerID string `json:"stickerId" validate:"required,mongoId"`
	}
)

func (dto *SendStickerDto) ToObjectIDs() (stickerObjID primitive.ObjectID, err error) {
	stickerObjID, err = primitive.ObjectIDFromHex(dto.StickerID)
	if err != nil {
		return
	}
	
	return
} 