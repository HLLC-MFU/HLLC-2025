package service

import (
	"context"
	"errors"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/dto"
	authPb "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto"
	authRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/repository"
	userRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/security"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
)

type (
	AuthService interface {
		Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error)
		RefreshToken(ctx context.Context, req *dto.RefreshTokenRequest) (*dto.TokenResponse, error)
		ValidateToken(ctx context.Context, token string) (*dto.UserResponse, error)
		Logout(ctx context.Context, userId string) error
		
		// gRPC service methods
		InternalLogin(ctx context.Context, req *authPb.InternalLoginRequest) (*authPb.InternalLoginResponse, error)
		ValidateTokenGRPC(ctx context.Context, req *authPb.ValidateTokenRequest) (*authPb.ValidateTokenResponse, error)
		RefreshTokenGRPC(ctx context.Context, req *authPb.RefreshTokenRequest) (*authPb.RefreshTokenResponse, error)
		RevokeSession(ctx context.Context, req *authPb.RevokeSessionRequest) (*authPb.RevokeSessionResponse, error)
	}

	authService struct {
		cfg *config.Config
		userRepo userRepo.UserRepositoryService
		authRepo authRepo.AuthRepositoryService
	}
)

func NewAuthService(cfg *config.Config, userRepo userRepo.UserRepositoryService, authRepo authRepo.AuthRepositoryService) AuthService {
	return &authService{
		cfg: cfg,
		userRepo: userRepo,
		authRepo: authRepo,
	}
}

func (s *authService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error) {
	// Use internal login
	internalReq := &authPb.InternalLoginRequest{
		Username: req.Username,
		Password: req.Password,
	}

	internalResp, err := s.InternalLogin(ctx, internalReq)
	if err != nil {
		return nil, err
	}

	// Convert to DTO response
	return &dto.LoginResponse{
		User: dto.UserResponse{
			ID:         internalResp.User.Id,
			Username:   internalResp.User.Username,
			FirstName:  internalResp.User.FirstName,
			MiddleName: internalResp.User.MiddleName,
			LastName:   internalResp.User.LastName,
			Roles:      internalResp.User.Roles,
		},
		TokenResponse: dto.TokenResponse{
			AccessToken:  internalResp.AccessToken,
			RefreshToken: internalResp.RefreshToken,
			ExpiresAt:    time.Unix(internalResp.ExpiresAt, 0),
		},
	}, nil
}

func (s *authService) InternalLogin(ctx context.Context, req *authPb.InternalLoginRequest) (*authPb.InternalLoginResponse, error) {
	// Validate credentials
	user, err := s.userRepo.FindByUsername(ctx, req.Username)
	if err != nil {
		return nil, err
	}

	isValid, err := s.userRepo.ValidatePassword(ctx, req.Username, req.Password)
	if err != nil {
		return nil, err
	}
	if !isValid {
		return nil, ErrInvalidCredentials
	}

	// Generate tokens
	claims := &security.Claims{
		UserID:   user.Id,
		Username: user.Username,
		RoleIds:  user.RoleIds,
	}

	// Generate access token
	accessToken := security.NewAccessToken(
		s.cfg.Jwt.AccessSecretKey,
		s.cfg.Jwt.AccessDuration,
		claims,
	).SignToken()

	// Generate refresh token
	refreshToken := security.NewRefreshToken(
		s.cfg.Jwt.RefreshSecretKey,
		s.cfg.Jwt.RefreshDuration,
		claims,
	).SignToken()

	// Store refresh token
	expiresAt := time.Now().Add(time.Duration(s.cfg.Jwt.RefreshDuration) * time.Second)
	err = s.authRepo.StoreRefreshToken(ctx, refreshToken, user.Id, expiresAt)
	if err != nil {
		return nil, err
	}

	return &authPb.InternalLoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt.Unix(),
		User: &authPb.UserInfo{
			Id:         user.Id,
			Username:   user.Username,
			FirstName:  user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName:   user.Name.LastName,
			Roles:      user.RoleIds,
		},
	}, nil
}

func (s *authService) RefreshToken(ctx context.Context, req *dto.RefreshTokenRequest) (*dto.TokenResponse, error) {
	// Use gRPC refresh token
	grpcReq := &authPb.RefreshTokenRequest{
		RefreshToken: req.RefreshToken,
	}

	grpcResp, err := s.RefreshTokenGRPC(ctx, grpcReq)
	if err != nil {
		return nil, err
	}

	return &dto.TokenResponse{
		AccessToken:  grpcResp.AccessToken,
		RefreshToken: grpcResp.RefreshToken,
		ExpiresAt:    time.Unix(grpcResp.ExpiresAt, 0),
	}, nil
}

func (s *authService) RefreshTokenGRPC(ctx context.Context, req *authPb.RefreshTokenRequest) (*authPb.RefreshTokenResponse, error) {
	// Validate refresh token
	claims, err := security.ParseToken(s.cfg.Jwt.RefreshSecretKey, req.RefreshToken)
	if err != nil {
		return nil, err
	}

	// Check if token exists in database
	userId, err := s.authRepo.FindRefreshToken(ctx, req.RefreshToken)
	if err != nil {
		return nil, err
	}

	// Generate new tokens
	accessToken := security.NewAccessToken(
		s.cfg.Jwt.AccessSecretKey,
		s.cfg.Jwt.AccessDuration,
		claims,
	).SignToken()

	refreshToken := security.NewRefreshToken(
		s.cfg.Jwt.RefreshSecretKey,
		s.cfg.Jwt.RefreshDuration,
		claims,
	).SignToken()

	// Update refresh token in database
	expiresAt := time.Now().Add(time.Duration(s.cfg.Jwt.RefreshDuration) * time.Second)
	err = s.authRepo.StoreRefreshToken(ctx, refreshToken, userId, expiresAt)
	if err != nil {
		return nil, err
	}

	return &authPb.RefreshTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt.Unix(),
	}, nil
}

func (s *authService) ValidateToken(ctx context.Context, token string) (*dto.UserResponse, error) {
	// Use gRPC validate token
	grpcReq := &authPb.ValidateTokenRequest{
		Token: token,
	}

	grpcResp, err := s.ValidateTokenGRPC(ctx, grpcReq)
	if err != nil {
		return nil, err
	}

	if !grpcResp.Valid {
		return nil, errors.New(grpcResp.Error)
	}

	return &dto.UserResponse{
		ID:         grpcResp.User.Id,
		Username:   grpcResp.User.Username,
		FirstName:  grpcResp.User.FirstName,
		MiddleName: grpcResp.User.MiddleName,
		LastName:   grpcResp.User.LastName,
		Roles:      grpcResp.User.Roles,
	}, nil
}

func (s *authService) ValidateTokenGRPC(ctx context.Context, req *authPb.ValidateTokenRequest) (*authPb.ValidateTokenResponse, error) {
	// Validate access token
	claims, err := security.ParseToken(s.cfg.Jwt.AccessSecretKey, req.Token)
	if err != nil {
		return &authPb.ValidateTokenResponse{
			Valid: false,
			Error: err.Error(),
		}, nil
	}

	// Get user
	user, err := s.userRepo.FindByUsername(ctx, claims.Username)
	if err != nil {
		return &authPb.ValidateTokenResponse{
			Valid: false,
			Error: "user not found",
		}, nil
	}

	return &authPb.ValidateTokenResponse{
		Valid: true,
		User: &authPb.UserInfo{
			Id:         user.Id,
			Username:   user.Username,
			FirstName:  user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName:   user.Name.LastName,
			Roles:      user.RoleIds,
		},
	}, nil
}

func (s *authService) Logout(ctx context.Context, userId string) error {
	_, err := s.RevokeSession(ctx, &authPb.RevokeSessionRequest{
		UserId: userId,
	})
	return err
}

func (s *authService) RevokeSession(ctx context.Context, req *authPb.RevokeSessionRequest) (*authPb.RevokeSessionResponse, error) {
	err := s.authRepo.DeleteRefreshToken(ctx, req.UserId)
	if err != nil {
		return &authPb.RevokeSessionResponse{
			Success: false,
			Error:   err.Error(),
		}, nil
	}

	return &authPb.RevokeSessionResponse{
		Success: true,
	}, nil
}