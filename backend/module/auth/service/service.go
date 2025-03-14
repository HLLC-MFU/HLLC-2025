package service

import (
	"context"
	"errors"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/dto"
	authPb "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto/generated"
	authRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/repository"
	userRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	userService "github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
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
		userService userService.UserService
	}
)

func NewAuthService(
	cfg *config.Config, 
	userRepo userRepo.UserRepositoryService, 
	authRepo authRepo.AuthRepositoryService,
	userService userService.UserService,
) AuthService {
	return &authService{
		cfg: cfg,
		userRepo: userRepo,
		authRepo: authRepo,
		userService: userService,
	}
}

func (s *authService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error) {
	return decorator.WithTimeout[*dto.LoginResponse](5*time.Second)(func(ctx context.Context) (*dto.LoginResponse, error) {
		// Get user by username from user service
		user, err := s.userService.GetUserByUsername(ctx, req.Username)
		if err != nil {
			return nil, err
		}

		// Validate password
		isValid, err := s.userService.ValidatePassword(ctx, req.Username, req.Password)
		if err != nil {
			return nil, err
		}
		if !isValid {
			return nil, ErrInvalidCredentials
		}

		// Initialize empty arrays to avoid null in response
		roleIDs := make([]string, 0)
		roleCodes := make([]string, 0)
		roles := make([]dto.Role, 0)

		// Get role IDs, codes and objects for response
		for _, role := range user.Roles {
			roleIDs = append(roleIDs, role.Id)
			roleCodes = append(roleCodes, role.Code)
			roles = append(roles, dto.Role{
				ID:          role.Id,
				Name:        role.Name,
				Code:        role.Code,
				Description: role.Description,
			})
		}

		// Generate tokens
		claims := &security.Claims{
			UserID:    user.ID,
			Username:  user.Username,
			RoleIds:   roleIDs,
			RoleCodes: roleCodes,
		}

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

		expiresAt := time.Now().Add(time.Duration(s.cfg.Jwt.AccessDuration) * time.Second)

		// Store refresh token
		err = s.authRepo.StoreRefreshToken(ctx, refreshToken, user.ID, expiresAt)
		if err != nil {
			return nil, err
		}

		// Convert user response
		authUser := &dto.UserResponse{
			ID:         user.ID,
			Username:   user.Username,
			FirstName:  user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName:   user.Name.LastName,
			Roles:      roles,
		}

		return &dto.LoginResponse{
			Status: true,
			Data: dto.LoginResponseData{
				User:         authUser,
				AccessToken:  accessToken,
				RefreshToken: refreshToken,
				ExpiresAt:    expiresAt.Format(time.RFC3339),
			},
		}, nil
	})(ctx)
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

	// Get user roles to extract role codes
	userWithRoles, err := s.userService.GetUserByUsername(ctx, req.Username)
	if err != nil {
		return nil, err
	}

	// Initialize empty arrays to avoid null in response
	roleIDs := make([]string, 0)
	roleCodes := make([]string, 0)

	// Get role IDs and codes
	for _, role := range userWithRoles.Roles {
		roleIDs = append(roleIDs, role.Id)
		roleCodes = append(roleCodes, role.Code)
	}

	// Generate tokens
	claims := &security.Claims{
		UserID:    user.Id,
		Username:  user.Username,
		RoleIds:   roleIDs,
		RoleCodes: roleCodes,
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
			Roles:      roleIDs,
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

	// Get user to ensure roles are up to date
	user, err := s.userService.GetUserByUsername(ctx, claims.Username)
	if err != nil {
		return nil, err
	}

	// Update role IDs and codes from current user data
	roleIDs := make([]string, 0)
	roleCodes := make([]string, 0)
	for _, role := range user.Roles {
		roleIDs = append(roleIDs, role.Id)
		roleCodes = append(roleCodes, role.Code)
	}

	// Update claims with current role information
	claims.RoleIds = roleIDs
	claims.RoleCodes = roleCodes

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

	// Get user with roles
	user, err := s.userService.GetUserByUsername(ctx, grpcResp.User.Username)
	if err != nil {
		return nil, err
	}

	// Map roles to auth DTO format
	roles := make([]dto.Role, 0)
	for _, role := range user.Roles {
		roles = append(roles, dto.Role{
			ID:          role.Id,
			Name:        role.Name,
			Code:        role.Code,
			Description: role.Description,
		})
	}

	return &dto.UserResponse{
		ID:         grpcResp.User.Id,
		Username:   grpcResp.User.Username,
		FirstName:  grpcResp.User.FirstName,
		MiddleName: grpcResp.User.MiddleName,
		LastName:   grpcResp.User.LastName,
		Roles:      roles,
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