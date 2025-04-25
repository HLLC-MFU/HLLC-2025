package handler

// import (
// 	"context"
// 	"time"

// 	"github.com/HLLC-MFU/HLLC-2025/backend/config"
// 	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
// 	"google.golang.org/grpc/codes"
// 	"google.golang.org/grpc/status"
// )

// type grpcHandler struct {
// 	cfg          *config.Config
// 	userService  service.UserService
// 	roleService  service.RoleService
// 	permService  service.PermissionService
// 	userPb.UnimplementedUserServiceServer
// }

// func NewGRPCHandler(
// 	cfg *config.Config,
// 	userService service.UserService,
// 	roleService service.RoleService,
// 	permService service.PermissionService,
// ) userPb.UserServiceServer {
// 	return &grpcHandler{
// 		cfg:         cfg,
// 		userService: userService,
// 		roleService: roleService,
// 		permService: permService,
// 	}
// }

// func (h *grpcHandler) CreateUser(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error) {
// 	result, err := decorator.WithTimeout[*userPb.User](10*time.Second)(func(ctx context.Context) (*userPb.User, error) {
// 		return h.userService.CreateUserGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) GetUser(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error) {
// 	result, err := decorator.WithTimeout[*userPb.User](5*time.Second)(func(ctx context.Context) (*userPb.User, error) {
// 		return h.userService.GetUserGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) GetAllUsers(ctx context.Context, req *userPb.GetAllUsersRequest) (*userPb.GetAllUsersResponse, error) {
// 	result, err := decorator.WithTimeout[*userPb.GetAllUsersResponse](15*time.Second)(func(ctx context.Context) (*userPb.GetAllUsersResponse, error) {
// 		return h.userService.GetAllUsersGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) UpdateUser(ctx context.Context, req *userPb.UpdateUserRequest) (*userPb.User, error) {
// 	result, err := decorator.WithTimeout[*userPb.User](10*time.Second)(func(ctx context.Context) (*userPb.User, error) {
// 		return h.userService.UpdateUserGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) DeleteUser(ctx context.Context, req *userPb.DeleteUserRequest) (*userPb.Empty, error) {
// 	result, err := decorator.WithTimeout[*userPb.Empty](5*time.Second)(func(ctx context.Context) (*userPb.Empty, error) {
// 		return h.userService.DeleteUserGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) ValidateCredentials(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error) {
// 	result, err := decorator.WithTimeout[*userPb.ValidateCredentialsResponse](5*time.Second)(func(ctx context.Context) (*userPb.ValidateCredentialsResponse, error) {
// 		return h.userService.ValidateCredentialsGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) CreateRole(ctx context.Context, req *userPb.CreateRoleRequest) (*userPb.Role, error) {
// 	result, err := decorator.WithTimeout[*userPb.Role](10*time.Second)(func(ctx context.Context) (*userPb.Role, error) {
// 		return h.roleService.CreateRoleGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) GetRole(ctx context.Context, req *userPb.GetRoleRequest) (*userPb.Role, error) {
// 	result, err := decorator.WithTimeout[*userPb.Role](5*time.Second)(func(ctx context.Context) (*userPb.Role, error) {
// 		return h.roleService.GetRoleGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) GetAllRoles(ctx context.Context, req *userPb.GetAllRolesRequest) (*userPb.GetAllRolesResponse, error) {
// 	result, err := decorator.WithTimeout[*userPb.GetAllRolesResponse](15*time.Second)(func(ctx context.Context) (*userPb.GetAllRolesResponse, error) {
// 		return h.roleService.GetAllRolesGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) UpdateRole(ctx context.Context, req *userPb.UpdateRoleRequest) (*userPb.Role, error) {
// 	result, err := decorator.WithTimeout[*userPb.Role](10*time.Second)(func(ctx context.Context) (*userPb.Role, error) {
// 		return h.roleService.UpdateRoleGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) DeleteRole(ctx context.Context, req *userPb.DeleteRoleRequest) (*userPb.Empty, error) {
// 	result, err := decorator.WithTimeout[*userPb.Empty](5*time.Second)(func(ctx context.Context) (*userPb.Empty, error) {
// 		return h.roleService.DeleteRoleGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) CreatePermission(ctx context.Context, req *userPb.CreatePermissionRequest) (*userPb.Permission, error) {
// 	result, err := decorator.WithTimeout[*userPb.Permission](10*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
// 		return h.permService.CreatePermissionGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) GetPermission(ctx context.Context, req *userPb.GetPermissionRequest) (*userPb.Permission, error) {
// 	result, err := decorator.WithTimeout[*userPb.Permission](5*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
// 		return h.permService.GetPermissionGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) GetAllPermissions(ctx context.Context, req *userPb.GetAllPermissionsRequest) (*userPb.GetAllPermissionsResponse, error) {
// 	result, err := decorator.WithTimeout[*userPb.GetAllPermissionsResponse](15*time.Second)(func(ctx context.Context) (*userPb.GetAllPermissionsResponse, error) {
// 		return h.permService.GetAllPermissionsGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) UpdatePermission(ctx context.Context, req *userPb.UpdatePermissionRequest) (*userPb.Permission, error) {
// 	result, err := decorator.WithTimeout[*userPb.Permission](10*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
// 		return h.permService.UpdatePermissionGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) DeletePermission(ctx context.Context, req *userPb.DeletePermissionRequest) (*userPb.Empty, error) {
// 	result, err := decorator.WithTimeout[*userPb.Empty](5*time.Second)(func(ctx context.Context) (*userPb.Empty, error) {
// 		return h.permService.DeletePermissionGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) CheckUsername(ctx context.Context, req *userPb.CheckUsernameRequest) (*userPb.CheckUsernameResponse, error) {
// 	// Use gRPC method directly
// 	result, err := decorator.WithTimeout[*userPb.CheckUsernameResponse](5*time.Second)(func(ctx context.Context) (*userPb.CheckUsernameResponse, error) {
// 		return h.userService.CheckUsernameGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) SetPassword(ctx context.Context, req *userPb.SetPasswordRequest) (*userPb.SetPasswordResponse, error) {
// 	// Use gRPC method directly
// 	result, err := decorator.WithTimeout[*userPb.SetPasswordResponse](5*time.Second)(func(ctx context.Context) (*userPb.SetPasswordResponse, error) {
// 		return h.userService.SetPasswordGRPC(ctx, req)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return result, nil
// }

// func (h *grpcHandler) mustEmbedUnimplementedUserServiceServer() {}