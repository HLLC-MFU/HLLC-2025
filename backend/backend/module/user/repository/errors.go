package repository

import "errors"

var (
	// ErrNotFound is returned when a requested resource is not found
	ErrNotFound = errors.New("resource not found")
	
	// ErrDuplicateKey is returned when trying to create a resource with a duplicate unique key
	ErrDuplicateKey = errors.New("duplicate key error")
	
	// ErrInvalidID is returned when an invalid ID is provided
	ErrInvalidID = errors.New("invalid ID")
) 