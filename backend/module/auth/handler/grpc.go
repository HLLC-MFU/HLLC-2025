package handler

// import (
// 	"context"

// 	"github.com/HLLC-MFU/HLLC-2025/backend/config"
// 	authPb "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto/generated"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/service"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/security"
// 	"google.golang.org/grpc/codes"
// 	"google.golang.org/grpc/status"
// )

// // GRPCHandler handles gRPC requests for auth service
// type GRPCHandler interface {
// 	authPb.AuthServiceServer
// }

// type grpcHandler struct {
// 	cfg         *config.Config
// 	authService service.AuthService
// 	authPb.UnimplementedAuthServiceServer
// }

// // NewGRPCHandler creates a new gRPC handler
// func NewGRPCHandler(cfg *config.Config, authService service.AuthService) authPb.AuthServiceServer {
// 	return &grpcHandler{
// 		cfg:         cfg,
// 		authService: authService,
// 	}
// }

// // withGRPCErrorHandler wraps gRPC methods with error handling
// func (h *grpcHandler) withGRPCErrorHandler(fn func(context.Context, interface{}) (interface{}, error)) func(context.Context, interface{}) (interface{}, error) {
// 	return func(ctx context.Context, req interface{}) (interface{}, error) {
// 		result, err := fn(ctx, req)
// 		if err != nil {
// 			switch err {
// 			case security.ErrInvalidToken:
// 				return nil, status.Error(codes.Unauthenticated, err.Error())
// 			case security.ErrTokenExpired:
// 				return nil, status.Error(codes.PermissionDenied, err.Error())
// 			case service.ErrInvalidCredentials:
// 				return nil, status.Error(codes.Unauthenticated, err.Error())
// 			default:
// 				return nil, status.Error(codes.Internal, "internal server error")
// 			}
// 		}
// 		return result, nil
// 	}
// }

// // InternalLogin handles gRPC internal login request
// func (h *grpcHandler) InternalLogin(ctx context.Context, req *authPb.InternalLoginRequest) (*authPb.InternalLoginResponse, error) {
// 	resp, err := h.authService.InternalLogin(ctx, req)
// 	if err != nil {
// 		switch err {
// 		case service.ErrInvalidCredentials:
// 			return nil, status.Error(codes.Unauthenticated, "invalid credentials")
// 		default:
// 			return nil, status.Error(codes.Internal, err.Error())
// 		}
// 	}
// 	return resp, nil
// }

// // ValidateToken handles gRPC token validation request
// func (h *grpcHandler) ValidateToken(ctx context.Context, req *authPb.ValidateTokenRequest) (*authPb.ValidateTokenResponse, error) {
// 	resp, err := h.authService.ValidateTokenGRPC(ctx, req)
// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}
// 	return resp, nil
// }

// // RefreshToken handles gRPC token refresh request
// func (h *grpcHandler) RefreshToken(ctx context.Context, req *authPb.RefreshTokenRequest) (*authPb.RefreshTokenResponse, error) {
// 	resp, err := h.authService.RefreshTokenGRPC(ctx, req)
// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}
// 	return resp, nil
// }

// // RevokeSession handles gRPC session revocation request
// func (h *grpcHandler) RevokeSession(ctx context.Context, req *authPb.RevokeSessionRequest) (*authPb.RevokeSessionResponse, error) {
// 	resp, err := h.authService.RevokeSession(ctx, req)
// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}
// 	return resp, nil
// }

// // Required by gRPC generated code
// func (h *grpcHandler) mustEmbedUnimplementedAuthServiceServer() {}
