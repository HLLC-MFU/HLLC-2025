package service

import "errors"

var (
	ErrRoomNotFound      = errors.New("room not found")
	ErrRoomAlreadyExists = errors.New("room with this id already exists")
)
