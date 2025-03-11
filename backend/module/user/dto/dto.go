package dto

import (
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto"
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
		Name     Name     `json:"name" validate:"required"`
		RoleIDs  []string `json:"roleIds" validate:"required"`
		Username string   `json:"username" validate:"required"`
		Password string   `json:"password" validate:"required"`
	}

	UpdateUserRequest struct {
		Name     Name     `json:"name" validate:"required"`
		RoleIDs  []string `json:"roleIds" validate:"required"`
		Username string   `json:"username" validate:"required"`
		Password string   `json:"password" validate:"required"`
	}

	CreateRoleRequest struct {
		Name        string   `json:"name" validate:"required"`
		Code        string   `json:"code" validate:"required"`
		Description string   `json:"description" validate:"required"`
		Permissions []string `json:"permissions" validate:"required"`
	}

	UpdateRoleRequest struct {
		Name        string   `json:"name" validate:"required"`
		Code        string   `json:"code" validate:"required"`
		Description string   `json:"description" validate:"required"`
		Permissions []string `json:"permissions" validate:"required"`
	}

	CreatePermissionRequest struct {
		Name        string `json:"name" validate:"required"`
		Code        string `json:"code" validate:"required"`
		Description string `json:"description" validate:"required"`
		Module      string `json:"module" validate:"required"`
	}

	UpdatePermissionRequest struct {
		Name        string `json:"name" validate:"required"`
		Code        string `json:"code" validate:"required"`
		Description string `json:"description" validate:"required"`
		Module      string `json:"module" validate:"required"`
	}

	UserResponse struct {
		ID          string              `json:"id"`
		Name        Name                `json:"name"`
		Roles       []*userPb.Role      `json:"roles"`
		Permissions []*userPb.Permission `json:"permissions"`
		Username    string              `json:"username"`
	}

	RoleResponse struct {
		ID          string              `json:"id"`
		Name        string              `json:"name"`
		Code        string              `json:"code"`
		Description string              `json:"description"`
		Permissions []*userPb.Permission `json:"permissions"`
	}

	PermissionResponse struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Code        string `json:"code"`
		Description string `json:"description"`
		Module      string `json:"module"`
	}

	ValidateCredentialsRequest struct {
		Username string `json:"username" validate:"required"`
		Password string `json:"password" validate:"required"`
	}
)