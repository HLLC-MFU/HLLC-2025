package handler

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/user"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
)

type GRPCHandler interface {
	userPb.UserServiceServer
}

type grpcHandler struct {
	cfg         *config.Config
	userService service.UserService
}

func NewGRPCHandler(cfg *config.Config, userService service.UserService) GRPCHandler {
	return &grpcHandler{
		cfg:         cfg,
		userService: userService,
	}
}

// Implement UserServiceServer interface
func (h *grpcHandler) CreateUser(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error) {
	return h.userService.CreateUserGRPC(ctx, req)
}

func (h *grpcHandler) GetUser(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error) {
	return h.userService.GetUserGRPC(ctx, req)
}

func (h *grpcHandler) ValidateCredentials(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error) {
	return h.userService.ValidateCredentialsGRPC(ctx, req)
}

// Required by gRPC generated code
func (h *grpcHandler) mustEmbedUnimplementedUserServiceServer() {} 