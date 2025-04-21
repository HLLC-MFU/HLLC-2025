package repository

import "errors"

var (
	// ErrNotFound is returned when a requested resource is not found
	ErrNotFound = errors.New("resource not found")
	
	// ErrDuplicateKey is returned when trying to create a resource with a duplicate unique key
	ErrDuplicateKey = errors.New("duplicate key error")
	
	// ErrInvalidID is returned when an invalid ID is provided
	ErrInvalidID = errors.New("invalid ID")

	// ErrUserExists is returned when trying to create a user with an existing username
	ErrUserExists = errors.New("user with this username already exists")

	// ErrInvalidPassword is returned when the provided password is invalid
	ErrInvalidPassword = errors.New("invalid password")

	// ErrRoleExists is returned when trying to create a role with an existing code
	ErrRoleExists = errors.New("role with this code already exists")

	// ErrPermissionExists is returned when trying to create a permission with an existing code
	ErrPermissionExists = errors.New("permission with this code already exists")
) 