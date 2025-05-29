package service

import "errors"

var (
	ErrStickerNotFound      = errors.New("sticker not found")
	ErrStickerAlreadyExists = errors.New("sticker with this id already exists")
)
