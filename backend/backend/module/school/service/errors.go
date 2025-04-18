package service

import "errors"

var (
	ErrSchoolNotFound      = errors.New("school not found")
	ErrSchoolAlreadyExists = errors.New("school with this acronym already exists")
) 