package handler

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/dto"
	authPb "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/security"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// GRPCHandler handles gRPC requests for auth service
type GRPCHandler interface {
	authPb.AuthServiceServer
}

type grpcHandler struct {
	cfg         *config.Config
	authService service.AuthService
	authPb.UnimplementedAuthServiceServer
}

// NewGRPCHandler creates a new gRPC handler
func NewGRPCHandler(cfg *config.Config, authService service.AuthService) authPb.AuthServiceServer {
	return &grpcHandler{
		cfg:         cfg,
		authService: authService,
	}
}

// withGRPCErrorHandler wraps gRPC methods with error handling
func (h *grpcHandler) withGRPCErrorHandler(fn func(context.Context, interface{}) (interface{}, error)) func(context.Context, interface{}) (interface{}, error) {
	return func(ctx context.Context, req interface{}) (interface{}, error) {
		result, err := fn(ctx, req)
		if err != nil {
			switch err {
			case security.ErrInvalidToken:
				return nil, status.Error(codes.Unauthenticated, err.Error())
			case security.ErrTokenExpired:
				return nil, status.Error(codes.PermissionDenied, err.Error())
			case service.ErrInvalidCredentials:
				return nil, status.Error(codes.Unauthenticated, err.Error())
			default:
				return nil, status.Error(codes.Internal, "internal server error")
			}
		}
		return result, nil
	}
}

// InternalLogin handles gRPC internal login request
func (h *grpcHandler) InternalLogin(ctx context.Context, req *authPb.InternalLoginRequest) (*authPb.InternalLoginResponse, error) {
	result, err := h.withGRPCErrorHandler(func(ctx context.Context, r interface{}) (interface{}, error) {
		loginReq := &dto.LoginRequest{
			Username: req.Username,
			Password: req.Password,
		}
		
		loginResp, err := h.authService.Login(ctx, loginReq)
		if err != nil {
			return nil, err
		}

		return &authPb.InternalLoginResponse{
			AccessToken:  loginResp.AccessToken,
			RefreshToken: loginResp.RefreshToken,
			ExpiresAt:    loginResp.ExpiresAt.Unix(),
			User: &authPb.UserInfo{
				Id:         loginResp.User.ID,
				Username:   loginResp.User.Username,
				FirstName:  loginResp.User.FirstName,
				MiddleName: loginResp.User.MiddleName,
				LastName:   loginResp.User.LastName,
				Roles:      loginResp.User.Roles,
			},
		}, nil
	})(ctx, req)
	if err != nil {
		return nil, err
	}
	return result.(*authPb.InternalLoginResponse), nil
}

// ValidateToken handles gRPC token validation request
func (h *grpcHandler) ValidateToken(ctx context.Context, req *authPb.ValidateTokenRequest) (*authPb.ValidateTokenResponse, error) {
	result, err := h.withGRPCErrorHandler(func(ctx context.Context, r interface{}) (interface{}, error) {
		userInfo, err := h.authService.ValidateToken(ctx, req.Token)
		if err != nil {
			return &authPb.ValidateTokenResponse{
				Valid: false,
				Error: err.Error(),
			}, nil
		}

		return &authPb.ValidateTokenResponse{
			Valid: true,
			User: &authPb.UserInfo{
				Id:         userInfo.ID,
				Username:   userInfo.Username,
				FirstName:  userInfo.FirstName,
				MiddleName: userInfo.MiddleName,
				LastName:   userInfo.LastName,
				Roles:      userInfo.Roles,
			},
		}, nil
	})(ctx, req)
	if err != nil {
		return nil, err
	}
	return result.(*authPb.ValidateTokenResponse), nil
}

// RefreshToken handles gRPC token refresh request
func (h *grpcHandler) RefreshToken(ctx context.Context, req *authPb.RefreshTokenRequest) (*authPb.RefreshTokenResponse, error) {
	result, err := h.withGRPCErrorHandler(func(ctx context.Context, r interface{}) (interface{}, error) {
		refreshReq := &dto.RefreshTokenRequest{
			RefreshToken: req.RefreshToken,
		}
		
		tokenResp, err := h.authService.RefreshToken(ctx, refreshReq)
		if err != nil {
			return nil, err
		}

		return &authPb.RefreshTokenResponse{
			AccessToken:  tokenResp.AccessToken,
			RefreshToken: tokenResp.RefreshToken,
			ExpiresAt:    tokenResp.ExpiresAt.Unix(),
		}, nil
	})(ctx, req)
	if err != nil {
		return nil, err
	}
	return result.(*authPb.RefreshTokenResponse), nil
}

// RevokeSession handles gRPC session revocation request
func (h *grpcHandler) RevokeSession(ctx context.Context, req *authPb.RevokeSessionRequest) (*authPb.RevokeSessionResponse, error) {
	result, err := h.withGRPCErrorHandler(func(ctx context.Context, r interface{}) (interface{}, error) {
		err := h.authService.Logout(ctx, req.UserId)
		if err != nil {
			return &authPb.RevokeSessionResponse{
				Success: false,
				Error:   err.Error(),
			}, nil
		}

		return &authPb.RevokeSessionResponse{
			Success: true,
		}, nil
	})(ctx, req)
	if err != nil {
		return nil, err
	}
	return result.(*authPb.RevokeSessionResponse), nil
}

// Required by gRPC generated code
// func (h *grpcHandler) mustEmbedUnimplementedAuthServiceServer() {
// 	authPb.UnimplementedAuthServiceServer(h)
// }
