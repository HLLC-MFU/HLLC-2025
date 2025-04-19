package dto

import (
	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
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
		Password string `json:"password"`  // Optional for admin creation
		Name     Name   `json:"name" validate:"required"`
		RoleIDs  []string `json:"roleIds"`
		MajorID  string `json:"majorId"`
		IsActivated bool `json:"isActivated"` // Whether user can login
	}

	UpdateUserRequest struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Name     Name   `json:"name"`
		RoleIDs  []string `json:"roleIds"`
		MajorID  string `json:"majorId"`
		IsActivated bool `json:"isActivated"`
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

	CheckUsernameRequest struct {
		Username string `json:"username" validate:"required,min=3,max=50,alphanum"`
	}

	CheckUsernameResponse struct {
		Exists bool `json:"exists"`
		User   *UserInfo `json:"user,omitempty"`
	}

	UserInfo struct {
		ID       string `json:"id"`
		Username string `json:"username"`
		Name     Name   `json:"name"`
		MajorID  string `json:"majorId,omitempty"`
		Major    *majorPb.Major `json:"major,omitempty"`
		IsActivated bool `json:"isActivated"`
	}

	SetPasswordRequest struct {
		Username string `json:"username" validate:"required,min=3,max=50,alphanum"`
		Password string `json:"password" validate:"required,min=8,max=100"`
	}

	SetPasswordResponse struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
	}

	UserResponse struct {
		ID       string        `json:"id"`
		Username string        `json:"username"`
		Name     Name         `json:"name"`
		Roles    []*userPb.Role `json:"roles,omitempty"`
		MajorID  string        `json:"majorId,omitempty"`
		Major    *majorPb.Major `json:"major,omitempty"`
		IsActivated bool       `json:"isActivated"`
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