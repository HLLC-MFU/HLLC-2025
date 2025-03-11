package handler

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type grpcHandler struct {
	cfg *config.Config
	userService service.UserService
	userPb.UnimplementedUserServiceServer
}

func NewGRPCHandler(cfg *config.Config, userService service.UserService) userPb.UserServiceServer {
	return &grpcHandler{
		cfg: cfg,
		userService: userService,
	}
}

func (h *grpcHandler) CreateUser(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error) {
	dtoReq := &dto.CreateUserRequest{
		Username: req.Username,
		Password: req.Password,
		Name: dto.Name{
			FirstName:  req.Name.FirstName,
			MiddleName: req.Name.MiddleName,
			LastName:   req.Name.LastName,
		},
		RoleIDs: req.RoleIds,
	}

	user, err := h.userService.CreateUser(ctx, dtoReq)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var roleIds []string
	for _, role := range user.Roles {
		roleIds = append(roleIds, role.Id)
	}

	return &userPb.User{
		Id:       user.ID,
		Username: user.Username,
		Name: &userPb.Name{
			FirstName:  user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName:   user.Name.LastName,
		},
		RoleIds: roleIds,
	}, nil
}

func (h *grpcHandler) GetUser(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error) {
	user, err := h.userService.GetUserByUsername(ctx, req.Username)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var roleIds []string
	for _, role := range user.Roles {
		roleIds = append(roleIds, role.Id)
	}

	return &userPb.User{
		Id:       user.ID,
		Username: user.Username,
		Name: &userPb.Name{
			FirstName:  user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName:   user.Name.LastName,
		},
		RoleIds: roleIds,
	}, nil
}

func (h *grpcHandler) GetAllUsers(ctx context.Context, _ *userPb.GetAllUsersRequest) (*userPb.GetAllUsersResponse, error) {
	users, err := h.userService.GetAllUsers(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	pbUsers := make([]*userPb.User, len(users))
	for i, user := range users {
		var roleIds []string
		for _, role := range user.Roles {
			roleIds = append(roleIds, role.Id)
		}

		pbUsers[i] = &userPb.User{
			Id:       user.ID,
			Username: user.Username,
			Name: &userPb.Name{
				FirstName:  user.Name.FirstName,
				MiddleName: user.Name.MiddleName,
				LastName:   user.Name.LastName,
			},
			RoleIds: roleIds,
		}
	}

	return &userPb.GetAllUsersResponse{
		Users: pbUsers,
	}, nil
}

func (h *grpcHandler) UpdateUser(ctx context.Context, req *userPb.UpdateUserRequest) (*userPb.User, error) {
	dtoReq := &dto.UpdateUserRequest{
		Username: req.Username,
		Password: req.Password,
		Name: dto.Name{
			FirstName:  req.Name.FirstName,
			MiddleName: req.Name.MiddleName,
			LastName:   req.Name.LastName,
		},
		RoleIDs: req.RoleIds,
	}

	user, err := h.userService.UpdateUser(ctx, req.Id, dtoReq)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var roleIds []string
	for _, role := range user.Roles {
		roleIds = append(roleIds, role.Id)
	}

	return &userPb.User{
		Id:       user.ID,
		Username: user.Username,
		Name: &userPb.Name{
			FirstName:  user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName:   user.Name.LastName,
		},
		RoleIds: roleIds,
	}, nil
}

func (h *grpcHandler) DeleteUser(ctx context.Context, req *userPb.DeleteUserRequest) (*userPb.Empty, error) {
	err := h.userService.DeleteUser(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &userPb.Empty{}, nil
}

func (h *grpcHandler) ValidateCredentials(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error) {
	resp, err := h.userService.ValidateCredentialsGRPC(ctx, req)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return resp, nil
}

func (h *grpcHandler) CreateRole(ctx context.Context, req *userPb.CreateRoleRequest) (*userPb.Role, error) {
	createReq := &dto.CreateRoleRequest{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Permissions: req.PermissionIds,
	}

	role, err := h.userService.CreateRole(ctx, createReq)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var permissionIds []string
	for _, perm := range role.Permissions {
		permissionIds = append(permissionIds, perm.Id)
	}

	return &userPb.Role{
		Id:            role.ID,
		Name:          role.Name,
		Code:          role.Code,
		Description:   role.Description,
		PermissionIds: permissionIds,
	}, nil
}

func (h *grpcHandler) GetRole(ctx context.Context, req *userPb.GetRoleRequest) (*userPb.Role, error) {
	role, err := h.userService.GetRoleByID(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var permissionIds []string
	for _, perm := range role.Permissions {
		permissionIds = append(permissionIds, perm.Id)
	}

	return &userPb.Role{
		Id:            role.ID,
		Name:          role.Name,
		Code:          role.Code,
		Description:   role.Description,
		PermissionIds: permissionIds,
	}, nil
}

func (h *grpcHandler) GetAllRoles(ctx context.Context, _ *userPb.GetAllRolesRequest) (*userPb.GetAllRolesResponse, error) {
	roles, err := h.userService.GetAllRoles(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	pbRoles := make([]*userPb.Role, len(roles))
	for i, role := range roles {
		var permissionIds []string
		for _, perm := range role.Permissions {
			permissionIds = append(permissionIds, perm.Id)
		}

		pbRoles[i] = &userPb.Role{
			Id:            role.ID,
			Name:          role.Name,
			Code:          role.Code,
			Description:   role.Description,
			PermissionIds: permissionIds,
		}
	}

	return &userPb.GetAllRolesResponse{
		Roles: pbRoles,
	}, nil
}

func (h *grpcHandler) UpdateRole(ctx context.Context, req *userPb.UpdateRoleRequest) (*userPb.Role, error) {
	updateReq := &dto.UpdateRoleRequest{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Permissions: req.PermissionIds,
	}

	role, err := h.userService.UpdateRole(ctx, req.Id, updateReq)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var permissionIds []string
	for _, perm := range role.Permissions {
		permissionIds = append(permissionIds, perm.Id)
	}

	return &userPb.Role{
		Id:            role.ID,
		Name:          role.Name,
		Code:          role.Code,
		Description:   role.Description,
		PermissionIds: permissionIds,
	}, nil
}

func (h *grpcHandler) DeleteRole(ctx context.Context, req *userPb.DeleteRoleRequest) (*userPb.Empty, error) {
	err := h.userService.DeleteRole(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &userPb.Empty{}, nil
}

func (h *grpcHandler) CreatePermission(ctx context.Context, req *userPb.CreatePermissionRequest) (*userPb.Permission, error) {
	createReq := &dto.CreatePermissionRequest{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Module:      req.Module,
	}

	permission, err := h.userService.CreatePermission(ctx, createReq)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &userPb.Permission{
		Id:          permission.ID,
		Name:        permission.Name,
		Code:        permission.Code,
		Description: permission.Description,
		Module:      permission.Module,
	}, nil
}

func (h *grpcHandler) GetPermission(ctx context.Context, req *userPb.GetPermissionRequest) (*userPb.Permission, error) {
	permission, err := h.userService.GetPermissionByID(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &userPb.Permission{
		Id:          permission.ID,
		Name:        permission.Name,
		Code:        permission.Code,
		Description: permission.Description,
		Module:      permission.Module,
	}, nil
}

func (h *grpcHandler) GetAllPermissions(ctx context.Context, _ *userPb.GetAllPermissionsRequest) (*userPb.GetAllPermissionsResponse, error) {
	permissions, err := h.userService.GetAllPermissions(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	pbPermissions := make([]*userPb.Permission, len(permissions))
	for i, permission := range permissions {
		pbPermissions[i] = &userPb.Permission{
			Id:          permission.ID,
			Name:        permission.Name,
			Code:        permission.Code,
			Description: permission.Description,
			Module:      permission.Module,
		}
	}

	return &userPb.GetAllPermissionsResponse{
		Permissions: pbPermissions,
	}, nil
}

func (h *grpcHandler) UpdatePermission(ctx context.Context, req *userPb.UpdatePermissionRequest) (*userPb.Permission, error) {
	updateReq := &dto.UpdatePermissionRequest{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Module:      req.Module,
	}

	permission, err := h.userService.UpdatePermission(ctx, req.Id, updateReq)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &userPb.Permission{
		Id:          permission.ID,
		Name:        permission.Name,
		Code:        permission.Code,
		Description: permission.Description,
		Module:      permission.Module,
	}, nil
}

func (h *grpcHandler) DeletePermission(ctx context.Context, req *userPb.DeletePermissionRequest) (*userPb.Empty, error) {
	err := h.userService.DeletePermission(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &userPb.Empty{}, nil
}

// Required by gRPC generated code just empty implementation
func (h *grpcHandler) mustEmbedUnimplementedUserServiceServer() {} 