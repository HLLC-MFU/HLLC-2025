package service

import (
	"context"
	"errors"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/dto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/security"
)

type (
	AuthService interface {
		Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error)
		RefreshToken(ctx context.Context, req *dto.RefreshTokenRequest) (*dto.TokenResponse, error)
		ValidateToken(ctx context.Context, token string) (*dto.UserResponse, error)
	}

	authService struct {
		userRepo repository.UserRepositoryService
		jwtService security.TokenService
	}
)

func NewAuthService(userRepo repository.UserRepositoryService, jwtService security.TokenService) AuthService {
	return &authService{
		userRepo: userRepo,
		jwtService: jwtService,
	}
}

func (s *authService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error) {
	// Find user
	user, err := s.userRepo.FindByUsername(ctx, req.Username)
	if err != nil {
		return nil, err
	}

	// Validate password
	isValid, err := s.userRepo.ValidatePassword(ctx, req.Username, req.Password)
	if err != nil {
		return nil, err
	}
	if !isValid {
		return nil, errors.New("invalid credentials")
	}

	// Convert role IDs to strings
	roleIDs := make([]string, len(user.Role))
	for i, id := range user.Role {
		roleIDs[i] = id.ID.Hex()
	}

	// Generate tokens
	claims := security.Claims{
		UserID: user.ID.Hex(),
		Username: user.Username,
		Roles: roleIDs,
	}

	accessToken, err := s.jwtService.GenerateAccessToken(claims)
	if err != nil {
		return nil, err
	}

	refreshToken, expiresAt, err := s.jwtService.GenerateRefreshToken(claims)
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
			Roles: roleIDs,
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
	claims, err := s.jwtService.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		return nil, err
	}

	// Generate new tokens
	accessToken, err := s.jwtService.GenerateAccessToken(*claims)
	if err != nil {
		return nil, err
	}

	refreshToken, expiresAt, err := s.jwtService.GenerateRefreshToken(*claims)
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
	// Validate token
	claims, err := s.jwtService.ValidateToken(token)
	if err != nil {
		return nil, err
	}

	// Get user
	user, err := s.userRepo.FindByUsername(ctx, claims.Username)
	if err != nil {
		return nil, err
	}

	// Convert role IDs to strings
	roleIDs := make([]string, len(user.Role))
	for i, id := range user.Role {
		roleIDs[i] = id.ID.Hex()
	}

	return &dto.UserResponse{
		ID: user.ID.Hex(),
		Username: user.Username,
		FirstName: user.Name.FirstName,
		MiddleName: user.Name.MiddleName,
		LastName: user.Name.LastName,
		Roles: roleIDs,
	}, nil
}