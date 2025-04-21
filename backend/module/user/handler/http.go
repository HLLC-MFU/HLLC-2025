package handler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/request"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/response"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/gofiber/fiber/v2"
)

// Converter functions for DTOs <-> Protos
func roleProtoToDTO(role *userPb.Role) *dto.RoleResponse {
	if role == nil {
		return nil
	}
	
	// Convert permissions from permission_ids
	permissions := make([]*userPb.Permission, 0, len(role.PermissionIds))
	// Note: In a real implementation, you'd fetch the actual permissions
	// We're leaving this as is for now since it matches the expected DTO structure
	
	return &dto.RoleResponse{
		ID:          role.Id,
		Name:        role.Name,
		Code:        role.Code,
		Description: role.Description,
		Permissions: permissions,
	}
}

func roleDTOToProto(roleReq *dto.CreateRoleRequest) *userPb.CreateRoleRequest {
	if roleReq == nil {
		return nil
	}
	
	return &userPb.CreateRoleRequest{
		Name:          roleReq.Name,
		Code:          roleReq.Code,
		Description:   roleReq.Description,
		PermissionIds: roleReq.Permissions,
	}
}

func updateRoleDTOToProto(id string, roleReq *dto.UpdateRoleRequest) *userPb.UpdateRoleRequest {
	if roleReq == nil {
		return nil
	}
	
	return &userPb.UpdateRoleRequest{
		Id:            id,
		Name:          roleReq.Name,
		Code:          roleReq.Code,
		Description:   roleReq.Description,
		PermissionIds: roleReq.Permissions,
	}
}

// Permission converter functions
func permissionProtoToDTO(permission *userPb.Permission) *dto.PermissionResponse {
	if permission == nil {
		return nil
	}
	
	return &dto.PermissionResponse{
		ID:          permission.Id,
		Name:        permission.Name,
		Code:        permission.Code,
		Description: permission.Description,
		Module:      permission.Module,
	}
}

func permissionDTOToProto(permReq *dto.CreatePermissionRequest) *userPb.CreatePermissionRequest {
	if permReq == nil {
		return nil
	}
	
	return &userPb.CreatePermissionRequest{
		Name:        permReq.Name,
		Code:        permReq.Code,
		Description: permReq.Description,
		Module:      permReq.Module,
	}
}

func updatePermissionDTOToProto(id string, permReq *dto.UpdatePermissionRequest) *userPb.UpdatePermissionRequest {
	if permReq == nil {
		return nil
	}
	
	return &userPb.UpdatePermissionRequest{
		Id:          id,
		Name:        permReq.Name,
		Code:        permReq.Code,
		Description: permReq.Description,
		Module:      permReq.Module,
	}
}

// HTTPHandler defines the HTTP handler methods for user functionality
type HTTPHandler interface {
	// User management
	CreateUser(c *fiber.Ctx) error
	GetUser(c *fiber.Ctx) error
	GetAllUsers(c *fiber.Ctx) error
	UpdateUser(c *fiber.Ctx) error
	DeleteUser(c *fiber.Ctx) error
	ValidateCredentials(c *fiber.Ctx) error

	// Role management
	CreateRole(c *fiber.Ctx) error
	GetRole(c *fiber.Ctx) error
	GetAllRoles(c *fiber.Ctx) error
	UpdateRole(c *fiber.Ctx) error
	DeleteRole(c *fiber.Ctx) error

	// Permission management
	CreatePermission(c *fiber.Ctx) error
	GetPermission(c *fiber.Ctx) error
	GetAllPermissions(c *fiber.Ctx) error
	UpdatePermission(c *fiber.Ctx) error
	DeletePermission(c *fiber.Ctx) error

	// Registration methods
	CheckUsername(c *fiber.Ctx) error
	SetPassword(c *fiber.Ctx) error
}

// httpHandler implements HTTPHandler
type httpHandler struct {
	cfg           *config.Config
	userService   service.UserService
	roleService   service.RoleService
	permService   service.PermissionService
}

// NewHTTPHandler creates a new HTTP handler
func NewHTTPHandler(
	cfg *config.Config, 
	userService service.UserService,
	roleService service.RoleService,
	permService service.PermissionService,
) HTTPHandler {
	return &httpHandler{
		cfg:           cfg,
		userService:   userService,
		roleService:   roleService,
		permService:   permService,
	}
}

// User management handlers
func (h *httpHandler) CreateUser(c *fiber.Ctx) error {
	wrapper := request.NewContextWrapper(c)
	
	var req dto.CreateUserRequest
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err.Error())
	}

	result, err := decorator.WithTimeout[*dto.UserResponse](10*time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		return h.userService.CreateUser(ctx, &req)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}

	return response.Success(c, http.StatusCreated, result)
}

func (h *httpHandler) GetUser(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		// If no ID provided, get current user's profile
		id = c.Locals("user_id").(string)
	}

	result, err := decorator.WithTimeout[*dto.UserResponse](5*time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		return h.userService.GetUserByID(ctx, id)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}

	return response.Success(c, http.StatusOK, result)
}

// GetAllUsers retrieves all users
func (h *httpHandler) GetAllUsers(c *fiber.Ctx) error {
	// Parse pagination parameters from query string
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	
	limit, err := strconv.Atoi(c.Query("limit", "10"))
	if err != nil || limit < 1 || limit > 100 {
		limit = 10 // Default and max limit
	}
	
	// Create the request with pagination parameters (will be used when proto is regenerated)
	req := &userPb.GetAllUsersRequest{
		// Page and Limit fields will be available after regenerating from proto
	}
	
	// Call the GRPC method directly
	result, err := decorator.WithTimeout[*userPb.GetAllUsersResponse](15*time.Second)(func(ctx context.Context) (*userPb.GetAllUsersResponse, error) {
		return h.userService.GetAllUsersGRPC(ctx, req)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}
	
	// Return the users with pagination metadata in the response
	return response.Success(c, http.StatusOK, fiber.Map{
		"users": result.Users,
		"pagination": fiber.Map{
			"page":  page,
			"limit": limit,
			"total": len(result.Users), // Will be updated to use totalCount when proto is regenerated
		},
	})
}

func (h *httpHandler) UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		// If no ID provided, update current user's profile
		id = c.Locals("user_id").(string)
	}

	wrapper := request.NewContextWrapper(c)
	
	var req dto.UpdateUserRequest
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err.Error())
	}

	result, err := decorator.WithTimeout[*dto.UserResponse](10*time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		return h.userService.UpdateUser(ctx, id, &req)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}

	return response.Success(c, http.StatusOK, result)
}

func (h *httpHandler) DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return response.Error(c, http.StatusBadRequest, "User ID is required")
	}

	_, err := decorator.WithTimeout[any](5*time.Second)(func(ctx context.Context) (any, error) {
		err := h.userService.DeleteUser(ctx, id)
		return nil, err
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}

	return response.Success(c, http.StatusNoContent, nil)
}

func (h *httpHandler) ValidateCredentials(c *fiber.Ctx) error {
	wrapper := request.NewContextWrapper(c)
	
	var req dto.ValidateCredentialsRequest
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err.Error())
	}

	valid, err := decorator.WithTimeout[bool](5*time.Second)(func(ctx context.Context) (bool, error) {
		return h.userService.ValidatePassword(ctx, req.Username, req.Password)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}

	if !valid {
		return response.Error(c, http.StatusUnauthorized, "Invalid credentials")
	}

	return response.Success(c, http.StatusOK, map[string]bool{"valid": true})
}

// Role management handlers
func (h *httpHandler) CreateRole(c *fiber.Ctx) error {
	wrapper := request.NewContextWrapper(c)
	
	var req dto.CreateRoleRequest
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err.Error())
	}

	// Convert DTO to Proto
	protoReq := roleDTOToProto(&req)
	
	// Call service with Proto
	protoResp, err := decorator.WithTimeout[*userPb.Role](10*time.Second)(func(ctx context.Context) (*userPb.Role, error) {
		return h.roleService.CreateRole(ctx, protoReq)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}
	
	// Convert Proto response back to DTO
	dtoResp := roleProtoToDTO(protoResp)

	return response.Success(c, http.StatusCreated, dtoResp)
}

func (h *httpHandler) GetRole(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return response.Error(c, http.StatusBadRequest, "Role ID is required")
	}

	// Call service with Proto
	protoResp, err := decorator.WithTimeout[*userPb.Role](5*time.Second)(func(ctx context.Context) (*userPb.Role, error) {
		return h.roleService.GetRoleByID(ctx, id)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}
	
	// Convert Proto response to DTO
	dtoResp := roleProtoToDTO(protoResp)

	return response.Success(c, http.StatusOK, dtoResp)
}

func (h *httpHandler) GetAllRoles(c *fiber.Ctx) error {
	// Call service with Proto
	protoResp, err := decorator.WithTimeout[[]*userPb.Role](15*time.Second)(func(ctx context.Context) ([]*userPb.Role, error) {
		return h.roleService.GetAllRoles(ctx)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}
	
	// Convert Proto responses to DTOs
	dtoResps := make([]*dto.RoleResponse, 0, len(protoResp))
	for _, role := range protoResp {
		dtoResps = append(dtoResps, roleProtoToDTO(role))
	}

	return response.Success(c, http.StatusOK, dtoResps)
}

func (h *httpHandler) UpdateRole(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return response.Error(c, http.StatusBadRequest, "Role ID is required")
	}

	wrapper := request.NewContextWrapper(c)
	
	var req dto.UpdateRoleRequest
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err.Error())
	}
	
	// Convert DTO to Proto
	protoReq := updateRoleDTOToProto(id, &req)
	
	// Call service with Proto
	protoResp, err := decorator.WithTimeout[*userPb.Role](10*time.Second)(func(ctx context.Context) (*userPb.Role, error) {
		return h.roleService.UpdateRole(ctx, id, protoReq)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}
	
	// Convert Proto response to DTO
	dtoResp := roleProtoToDTO(protoResp)

	return response.Success(c, http.StatusOK, dtoResp)
}

func (h *httpHandler) DeleteRole(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return response.Error(c, http.StatusBadRequest, "Role ID is required")
	}

	_, err := decorator.WithTimeout[any](5*time.Second)(func(ctx context.Context) (any, error) {
		err := h.roleService.DeleteRole(ctx, id)
		return nil, err
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}

	return response.Success(c, http.StatusNoContent, nil)
}

// Permission management handlers
func (h *httpHandler) CreatePermission(c *fiber.Ctx) error {
	wrapper := request.NewContextWrapper(c)
	
	var req dto.CreatePermissionRequest
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err.Error())
	}

	// Convert DTO to Proto
	protoReq := permissionDTOToProto(&req)
	
	// Call service with Proto
	protoResp, err := decorator.WithTimeout[*userPb.Permission](10*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		return h.permService.CreatePermission(ctx, protoReq)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}
	
	// Convert Proto response back to DTO
	dtoResp := permissionProtoToDTO(protoResp)

	return response.Success(c, http.StatusCreated, dtoResp)
}

func (h *httpHandler) GetPermission(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return response.Error(c, http.StatusBadRequest, "Permission ID is required")
	}

	// Call service with Proto
	protoResp, err := decorator.WithTimeout[*userPb.Permission](5*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		return h.permService.GetPermissionByID(ctx, id)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}
	
	// Convert Proto response to DTO
	dtoResp := permissionProtoToDTO(protoResp)

	return response.Success(c, http.StatusOK, dtoResp)
}

func (h *httpHandler) GetAllPermissions(c *fiber.Ctx) error {
	// Call service with Proto
	protoResp, err := decorator.WithTimeout[[]*userPb.Permission](15*time.Second)(func(ctx context.Context) ([]*userPb.Permission, error) {
		return h.permService.GetAllPermissions(ctx)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}
	
	// Convert Proto responses to DTOs
	dtoResps := make([]*dto.PermissionResponse, 0, len(protoResp))
	for _, permission := range protoResp {
		dtoResps = append(dtoResps, permissionProtoToDTO(permission))
	}

	return response.Success(c, http.StatusOK, dtoResps)
}

func (h *httpHandler) UpdatePermission(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return response.Error(c, http.StatusBadRequest, "Permission ID is required")
	}

	wrapper := request.NewContextWrapper(c)
	
	var req dto.UpdatePermissionRequest
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err.Error())
	}
	
	// Convert DTO to Proto
	protoReq := updatePermissionDTOToProto(id, &req)
	
	// Call service with Proto
	protoResp, err := decorator.WithTimeout[*userPb.Permission](10*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		return h.permService.UpdatePermission(ctx, id, protoReq)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}
	
	// Convert Proto response to DTO
	dtoResp := permissionProtoToDTO(protoResp)

	return response.Success(c, http.StatusOK, dtoResp)
}

func (h *httpHandler) DeletePermission(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return response.Error(c, http.StatusBadRequest, "Permission ID is required")
	}

	_, err := decorator.WithTimeout[any](5*time.Second)(func(ctx context.Context) (any, error) {
		err := h.permService.DeletePermission(ctx, id)
		return nil, err
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}

	return response.Success(c, http.StatusNoContent, nil)
}

// Registration methods
func (h *httpHandler) CheckUsername(c *fiber.Ctx) error {
	wrapper := request.NewContextWrapper(c)
	
	var req dto.CheckUsernameRequest
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err.Error())
	}

	result, err := decorator.WithTimeout[*dto.CheckUsernameResponse](5*time.Second)(func(ctx context.Context) (*dto.CheckUsernameResponse, error) {
		return h.userService.CheckUsername(ctx, &req)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}

	return response.Success(c, http.StatusOK, result)
}

func (h *httpHandler) SetPassword(c *fiber.Ctx) error {
	wrapper := request.NewContextWrapper(c)
	
	var req dto.SetPasswordRequest
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err.Error())
	}

	result, err := decorator.WithTimeout[*dto.SetPasswordResponse](5*time.Second)(func(ctx context.Context) (*dto.SetPasswordResponse, error) {
		return h.userService.SetPassword(ctx, &req)
	})(c.Context())
	
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err.Error())
	}

	return response.Success(c, http.StatusOK, result)
} 