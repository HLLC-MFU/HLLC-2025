package dto

import (
	"chat/module/sticker/model"
	"chat/pkg/common"
)

type CreateStickerDto struct {
	Name  common.LocalizedName `form:"name"`
	Image string              `form:"image"`
}

func (dto *CreateStickerDto) ToSticker() *model.Sticker {
	return &model.Sticker{
		Name:  dto.Name,
		Image: dto.Image,
	}
}