package dto

import (
	"chat/module/sticker/model"
	"chat/pkg/common"
)

type CreateStickerDto struct {
	Name common.LocalizedName `json:"name" validate:"notEmpty"`
	Image string `json:"image" validate:"notEmpty"`
}

func (dto *CreateStickerDto) ToSticker() *model.Sticker {
	return &model.Sticker{
		Name: dto.Name,
		Image: dto.Image,
	}
}