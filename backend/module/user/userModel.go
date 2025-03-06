package user

import (
	"time"
)

// Request DTOs
type CreateUserRequest struct {
	FirstName  string   `json:"firstName" validate:"required"`
	MiddleName string   `json:"middleName"`
	LastName   string   `json:"lastName" validate:"required"`
	Username   string   `json:"username" validate:"required"`
	Password   string   `json:"password" validate:"required,min=8"`
	RoleIDs    []string `json:"roleIds" validate:"required"`
}

type UpdateUserRequest struct {
	FirstName  string   `json:"firstName"`
	MiddleName string   `json:"middleName"`
	LastName   string   `json:"lastName"`
	RoleIDs    []string `json:"roleIds"`
}

type UpdatePasswordRequest struct {
	OldPassword string `json:"oldPassword" validate:"required"`
	NewPassword string `json:"newPassword" validate:"required,min=8"`
}

// Response DTOs
type UserResponse struct {
	ID         string    `json:"id"`
	FirstName  string    `json:"firstName"`
	MiddleName string    `json:"middleName"`
	LastName   string    `json:"lastName"`
	Username   string    `json:"username"`
	Roles      []Role    `json:"roles"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}


type UserListResponse struct {
	Users []UserResponse `json:"users"`
	Total int64         `json:"total"`
} 