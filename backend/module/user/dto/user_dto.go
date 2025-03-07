package user

import (
	user "github.com/HLLC-MFU/HLLC-2025/backend/module/user/entity"
)

/**
 * User DTOs
 *
 * @author Dev. Bengi (Backend Team)
 */

// Request DTOs
type (

	// Embedded DTOs
	Name struct {
		FirstName  string `json:"firstName" validate:"required"`
		MiddleName string `json:"middleName"`
		LastName   string `json:"lastName" validate:"required"`
	}

	CreateUserRequest struct {
		Name Name `json:"name" validate:"required"`
		RoleIDs  []string `json:"roleIds" validate:"required"`
		Username string `json:"username" validate:"required"`
		Password string `json:"password" validate:"required"`
	}

	UpdateUserRequest struct {
		Name Name `json:"name" validate:"required"`
		RoleIDs  []string `json:"roleIds" validate:"required"`
		Username string `json:"username" validate:"required"`
		Password string `json:"password" validate:"required"`
	}

	UserResponse struct {
		ID       string `json:"id"`
		Name     Name   `json:"name"`

		// Full role objects for response
		Roles    []user.Role `json:"roles"`

		// Full permission objects for response
		Permissions []user.Permission `json:"permissions"`

		Username string `json:"username"`
	}

	RoleResponse struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}

	PermissionResponse struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
)