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

	// UserClaims represents the user authentication information from context
	UserClaims struct {
		UserID    string   `json:"userId"`
		Username  string   `json:"username"`
		RoleCodes []string `json:"roleCodes"`
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
		Username    string `json:"username,omitempty"`
		FirstName   string `json:"first_name,omitempty"`
		MiddleName  string `json:"middle_name,omitempty"`
		LastName    string `json:"last_name,omitempty"`
		RoleIDs     []string `json:"role_ids,omitempty"`
		MajorID     string `json:"major_id,omitempty"`
		IsActivated *bool  `json:"is_activated,omitempty"`
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
		Action      string `json:"action" validate:"required,oneof=create read update delete list"`
		AccessLevel string `json:"access_level" validate:"required,oneof=public protected admin"`
		Resource    string `json:"resource" validate:"required"`
		Tags        []string `json:"tags,omitempty"`
	}

	UpdatePermissionRequest struct {
		Name        string `json:"name"`
		Code        string `json:"code"`
		Description string `json:"description"`
		Module      string `json:"module"`
		Action      string `json:"action" validate:"omitempty,oneof=create read update delete list"`
		AccessLevel string `json:"access_level" validate:"omitempty,oneof=public protected admin"`
		Resource    string `json:"resource"`
		Tags        []string `json:"tags,omitempty"`
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
		Permissions []string            `json:"permissions,omitempty"`
	}

	PermissionResponse struct {
		ID          string   `json:"id"`
		Name        string   `json:"name"`
		Code        string   `json:"code"`
		Description string   `json:"description"`
		Module      string   `json:"module"`
		Action      string   `json:"action"`
		AccessLevel string   `json:"access_level"`
		Resource    string   `json:"resource"`
		Tags        []string `json:"tags,omitempty"`
	}

	ValidateCredentialsRequest struct {
		Username string `json:"username" validate:"required"`
		Password string `json:"password" validate:"required"`
	}

	// Request-response DTOs for activating user
	ActivateUserRequest struct {
		UserID string `json:"user_id" validate:"required"`
	}

	ActivateUserResponse struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		UserID  string `json:"user_id"`
	}

	// New DTOs for template-based permission generation
	CreatePermissionTemplateRequest struct {
		Module      string   `json:"module" validate:"required"`
		Resource    string   `json:"resource" validate:"required"`
		Actions     []string `json:"actions" validate:"required,dive,oneof=create read update delete list"`
		AccessLevel string   `json:"access_level" validate:"required,oneof=public protected admin"`
		Description string   `json:"description"`
		Tags        []string `json:"tags"`
	}

	PermissionTemplateResponse struct {
		Module      string                `json:"module"`
		Resource    string                `json:"resource"`
		Permissions []*PermissionResponse `json:"permissions"`
	}

	// Module permission template for generating standard module access levels
	ModulePermissionTemplateRequest struct {
		Module       string   `json:"module" validate:"required"`
		Description  string   `json:"description"`
		GenerateRBAC bool     `json:"generate_rbac" default:"true"`
	}

	// Alias for HTTP handler compatibility
	CreateModulePermissionsRequest = ModulePermissionTemplateRequest

	ModulePermissionTemplateResponse struct {
		Module      string                `json:"module"`
		Permissions []*PermissionResponse `json:"permissions"`
	}
)

func (req *CreateUserRequest) ToProto() *userPb.CreateUserRequest {
	return &userPb.CreateUserRequest{
		Username: req.Username,
		Password: req.Password,
		Name: &userPb.Name{
			FirstName:  req.Name.FirstName,
			MiddleName: req.Name.MiddleName,
			LastName:   req.Name.LastName,
		},
		RoleIds: req.RoleIDs,
		MajorId: req.MajorID,
	}
}