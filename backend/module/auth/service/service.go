package service

import (
	"context"
	"errors"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/dto"
	authEntity "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/entity"
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

	// Get highest role code
	roleCode := 0
	for _, role := range user.Roles {
		if role.RoleCode > roleCode {
			roleCode = role.RoleCode
		}
	}

	// Generate tokens
	claims := &security.Claims{
		UserID: user.ID.Hex(),
		Username: user.Username,
		RoleCode: roleCode,
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
	err = s.authRepo.StoreRefreshToken(ctx, &authEntity.Auth{
		UserId: user.ID.Hex(),
		RefreshToken: refreshToken,
		ExpiresAt: expiresAt,
		LastLoginAt: time.Now(),
	})
	if err != nil {
		return nil, err
	}

	return &dto.LoginResponse{
		User: dto.UserResponse{
			ID: user.ID.Hex(),
			Username: user.Username,
			FirstName: user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName: user.Name.LastName,
			Roles: []string{getRoleTitle(roleCode)},
		},
		TokenResponse: dto.TokenResponse{
			AccessToken: accessToken,
			RefreshToken: refreshToken,
			ExpiresAt: expiresAt,
		},
	}, nil
}

func (s *authService) RefreshToken(ctx context.Context, req *dto.RefreshTokenRequest) (*dto.TokenResponse, error) {
	// Validate refresh token
	claims, err := security.ParseToken(s.cfg.Jwt.RefreshSecretKey, req.RefreshToken)
	if err != nil {
		return nil, err
	}

	// Check if token exists in database
	auth, err := s.authRepo.FindRefreshToken(ctx, req.RefreshToken)
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
	err = s.authRepo.StoreRefreshToken(ctx, &authEntity.Auth{
		UserId: auth.UserId,
		RefreshToken: refreshToken,
		ExpiresAt: expiresAt,
		LastLoginAt: time.Now(),
	})
	if err != nil {
		return nil, err
	}

	return &dto.TokenResponse{
		AccessToken: accessToken,
		RefreshToken: refreshToken,
		ExpiresAt: expiresAt,
	}, nil
}

func (s *authService) ValidateToken(ctx context.Context, token string) (*dto.UserResponse, error) {
	// Validate access token
	claims, err := security.ParseToken(s.cfg.Jwt.AccessSecretKey, token)
	if err != nil {
		return nil, err
	}

	// Get user
	user, err := s.userRepo.FindByUsername(ctx, claims.Username)
	if err != nil {
		return nil, err
	}

	return &dto.UserResponse{
		ID: user.ID.Hex(),
		Username: user.Username,
		FirstName: user.Name.FirstName,
		MiddleName: user.Name.MiddleName,
		LastName: user.Name.LastName,
		Roles: []string{getRoleTitle(claims.RoleCode)},
	}, nil
}

func (s *authService) Logout(ctx context.Context, userId string) error {
	return s.authRepo.DeleteRefreshToken(ctx, userId)
}

func getRoleTitle(roleCode int) string {
	switch roleCode {
	case 1:
		return "admin"
	default:
		return "user"
	}
}