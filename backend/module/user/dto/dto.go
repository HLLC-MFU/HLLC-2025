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
		FirstName  string `json:"firstName"`
		MiddleName string `json:"middleName"`
		LastName   string `json:"lastName"`
	}

	CreateUserRequest struct {
		Username string `json:"username" validate:"required"`
		Password string `json:"password" validate:"required"`
		Name     Name   `json:"name" validate:"required"`
		RoleIDs  []string `json:"roleIds"`
	}

	UpdateUserRequest struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Name     Name   `json:"name"`
		RoleIDs  []string `json:"roleIds"`
	}

	CreateRoleRequest struct {
		Name        string   `json:"name" validate:"required"`
		Code        string   `json:"code" validate:"required"`
		Description string   `json:"description"`
		Permissions []string `json:"permissions"`
	}

	UpdateRoleRequest struct {
		Name        string   `json:"name"`
		Code        string   `json:"code"`
		Description string   `json:"description"`
		Permissions []string `json:"permissions"`
	}

	CreatePermissionRequest struct {
		Name        string `json:"name" validate:"required"`
		Code        string `json:"code" validate:"required"`
		Description string `json:"description"`
		Module      string `json:"module" validate:"required"`
	}

	UpdatePermissionRequest struct {
		Name        string `json:"name"`
		Code        string `json:"code"`
		Description string `json:"description"`
		Module      string `json:"module"`
	}

	UserResponse struct {
		ID       string        `json:"id"`
		Username string        `json:"username"`
		Name     Name         `json:"name"`
		Roles    []*userPb.Role `json:"roles,omitempty"`
	}

	RoleResponse struct {
		ID          string              `json:"id"`
		Name        string              `json:"name"`
		Code        string              `json:"code"`
		Description string              `json:"description"`
		Permissions []*userPb.Permission `json:"permissions,omitempty"`
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