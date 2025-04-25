package http

import (
	"context"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/dto"
	authPb "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto/generated"
	authRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/repository"
	userRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	userService "github.com/HLLC-MFU/HLLC-2025/backend/module/user/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/security"
)

type (
	AuthService interface {
		// HTTP service methods
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
		cfg         *config.Config
		userRepo    userRepo.UserRepositoryService
		authRepo    authRepo.AuthRepositoryService
		userService userService.UserService
	}
)

// NewAuthService creates a new auth service instance
func NewAuthService(
	cfg *config.Config, 
	userRepo userRepo.UserRepositoryService, 
	authRepo authRepo.AuthRepositoryService,
	userService userService.UserService,
) AuthService {
	return &authService{
		cfg:         cfg,
		userRepo:    userRepo,
		authRepo:    authRepo,
		userService: userService,
	}
}

// Login authenticates a user and returns access and refresh tokens
func (s *authService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error) {
	return decorator.WithTimeout[*dto.LoginResponse](5*time.Second)(func(ctx context.Context) (*dto.LoginResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Processing login request",
			logging.FieldOperation, "login",
			logging.FieldEntity, "user",
			"username", req.Username,
		)

		// Get user by username from user service
		user, err := s.userService.GetUserByUsername(ctx, req.Username)
		if err != nil {
			logger.Error("Failed to get user by username", err,
				logging.FieldOperation, "login",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return nil, err
		}

		// Validate password
		isValid, err := s.userService.ValidatePassword(ctx, req.Username, req.Password)
		if err != nil {
			logger.Error("Password validation error", err,
				logging.FieldOperation, "login",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return nil, err
		}
		if !isValid {
			logger.Warn("Invalid credentials attempt",
				logging.FieldOperation, "login",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return nil, exceptions.Unauthorized("invalid credentials", nil)
		}

		// Initialize empty arrays to avoid null in response
		roleIDs := make([]string, 0)
		roleCodes := make([]string, 0)

		// Get role IDs and codes for JWT claims
		for _, role := range user.Roles {
			roleIDs = append(roleIDs, role.Id)
			roleCodes = append(roleCodes, role.Code)
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

		// Store refresh token in repository
		clientIP := ctx.Value("client_ip")
		userAgent := ctx.Value("user_agent")
		clientIPStr := ""
		userAgentStr := ""
		
		if clientIP != nil {
			clientIPStr = clientIP.(string)
		}
		
		if userAgent != nil {
			userAgentStr = userAgent.(string)
		}
		
		// Create a session for the user
		sessionExpiresAt := time.Now().Add(time.Duration(s.cfg.Jwt.AccessDuration) * time.Second)
		err = s.authRepo.CreateSession(ctx, user.ID, accessToken, sessionExpiresAt, userAgentStr, clientIPStr)
		if err != nil {
			logger.Error("Failed to create session", err,
				logging.FieldOperation, "login",
				logging.FieldEntity, "session",
				logging.FieldEntityID, user.ID,
			)
			return nil, exceptions.Internal("failed to create session", err)
		}

		// Store refresh token
		refreshExpiresAt := time.Now().Add(time.Duration(s.cfg.Jwt.RefreshDuration) * time.Second)
		err = s.authRepo.StoreRefreshToken(ctx, refreshToken, user.ID, refreshExpiresAt)
		if err != nil {
			logger.Error("Failed to store refresh token", err,
				logging.FieldOperation, "login",
				logging.FieldEntity, "refresh_token",
				logging.FieldEntityID, user.ID,
			)
			return nil, exceptions.Internal("failed to store refresh token", err)
		}

		logger.Info("Login successful",
			logging.FieldOperation, "login",
			logging.FieldEntity, "user",
			logging.FieldEntityID, user.ID,
			"username", user.Username,
		)

		// Return login response with tokens only
		return &dto.LoginResponse{
			Status: true,
			Data: dto.LoginResponseData{
				AccessToken:  accessToken,
				RefreshToken: refreshToken,
				ExpiresAt:    expiresAt.Format(time.RFC3339),
			},
		}, nil
	})(ctx)
}

// RefreshToken generates new access and refresh tokens using the provided refresh token
func (s *authService) RefreshToken(ctx context.Context, req *dto.RefreshTokenRequest) (*dto.TokenResponse, error) {
	return decorator.WithTimeout[*dto.TokenResponse](5*time.Second)(func(ctx context.Context) (*dto.TokenResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Processing refresh token request",
			logging.FieldOperation, "refresh_token",
			logging.FieldEntity, "token",
		)

		// Validate refresh token
		claims, err := security.ParseToken(s.cfg.Jwt.RefreshSecretKey, req.RefreshToken)
		if err != nil {
			logger.Error("Invalid refresh token", err,
				logging.FieldOperation, "refresh_token",
				logging.FieldEntity, "token",
			)
			return nil, exceptions.Unauthorized("invalid refresh token", err)
		}

		// Check if token exists in database
		userID, err := s.authRepo.FindRefreshToken(ctx, req.RefreshToken)
		if err != nil {
			logger.Error("Refresh token not found in database", err,
				logging.FieldOperation, "refresh_token",
				logging.FieldEntity, "token",
			)
			return nil, exceptions.Unauthorized("invalid refresh token", err)
		}

		// Get user to ensure roles are up to date
		user, err := s.userService.GetUserByUsername(ctx, claims.Username)
		if err != nil {
			logger.Error("Failed to get user for refresh token", err,
				logging.FieldOperation, "refresh_token",
				logging.FieldEntity, "user",
				"username", claims.Username,
			)
			return nil, exceptions.Internal("failed to get user information", err)
		}

		// Update role IDs and codes from current user data
		roleIDs := make([]string, 0)
		roleCodes := make([]string, 0)
		for _, role := range user.Roles {
			roleIDs = append(roleIDs, role.Id)
			roleCodes = append(roleCodes, role.Code)
		}

		// Generate new tokens
		newClaims := &security.Claims{
			UserID:    user.ID,
			Username:  user.Username,
			RoleIds:   roleIDs,
			RoleCodes: roleCodes,
		}

		accessToken := security.NewAccessToken(
			s.cfg.Jwt.AccessSecretKey,
			s.cfg.Jwt.AccessDuration,
			newClaims,
		).SignToken()

		newRefreshToken := security.NewRefreshToken(
			s.cfg.Jwt.RefreshSecretKey,
			s.cfg.Jwt.RefreshDuration,
			newClaims,
		).SignToken()

		// Delete the old refresh token and store the new one
		err = s.authRepo.DeleteRefreshToken(ctx, userID)
		if err != nil {
			logger.Error("Failed to delete old refresh token", err,
				logging.FieldOperation, "refresh_token",
				logging.FieldEntity, "refresh_token",
				logging.FieldEntityID, userID,
			)
			// Continue even if delete fails
		}

		expiresAt := time.Now().Add(time.Duration(s.cfg.Jwt.RefreshDuration) * time.Second)
		err = s.authRepo.StoreRefreshToken(ctx, newRefreshToken, userID, expiresAt)
		if err != nil {
			logger.Error("Failed to store new refresh token", err,
				logging.FieldOperation, "refresh_token",
				logging.FieldEntity, "refresh_token",
				logging.FieldEntityID, userID,
			)
			return nil, exceptions.Internal("failed to store new refresh token", err)
		}

		logger.Info("Refresh token successful",
			logging.FieldOperation, "refresh_token",
			logging.FieldEntity, "user",
			logging.FieldEntityID, userID,
		)

		return &dto.TokenResponse{
			AccessToken:  accessToken,
			RefreshToken: newRefreshToken,
			ExpiresAt:    expiresAt,
		}, nil
	})(ctx)
}

// ValidateToken validates the access token and returns user information
func (s *authService) ValidateToken(ctx context.Context, token string) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](5*time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Validating token",
			logging.FieldOperation, "validate_token",
			logging.FieldEntity, "token",
		)

		// Parse the token to get claims
		claims, err := security.ParseToken(s.cfg.Jwt.AccessSecretKey, token)
		if err != nil {
			logger.Error("Invalid token", err,
				logging.FieldOperation, "validate_token",
				logging.FieldEntity, "token",
			)
			return nil, exceptions.Unauthorized("invalid token", err)
		}

		// Get user information
		user, err := s.userService.GetUserByID(ctx, claims.UserID)
		if err != nil {
			logger.Error("Failed to get user for token validation", err,
				logging.FieldOperation, "validate_token",
				logging.FieldEntity, "user",
				logging.FieldEntityID, claims.UserID,
			)
			return nil, exceptions.Internal("failed to get user information", err)
		}

		logger.Info("Token validated successfully",
			logging.FieldOperation, "validate_token",
			logging.FieldEntity, "user",
			logging.FieldEntityID, user.ID,
		)

		return &dto.UserResponse{
			ID: user.ID,
			Username: user.Username,
			FirstName: user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName: user.Name.LastName,
		}, nil
	})(ctx)
}

// Logout invalidates all user sessions and removes refresh tokens
func (s *authService) Logout(ctx context.Context, userID string) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Processing logout",
			logging.FieldOperation, "logout",
			logging.FieldEntity, "user",
			logging.FieldEntityID, userID,
		)

		// Deactivate all user sessions
		if err := s.authRepo.DeactivateAllUserSessions(ctx, userID); err != nil {
			logger.Error("Failed to deactivate sessions", err,
				logging.FieldOperation, "logout",
				logging.FieldEntity, "session",
				logging.FieldEntityID, userID,
			)
			return struct{}{}, exceptions.Internal("failed to deactivate sessions", err)
		}

		// Delete refresh token
		if err := s.authRepo.DeleteRefreshToken(ctx, userID); err != nil {
			logger.Error("Failed to delete refresh token", err,
				logging.FieldOperation, "logout",
				logging.FieldEntity, "refresh_token",
				logging.FieldEntityID, userID,
			)
			return struct{}{}, exceptions.Internal("failed to delete refresh token", err)
		}

		logger.Info("Logout successful",
			logging.FieldOperation, "logout",
			logging.FieldEntity, "user",
			logging.FieldEntityID, userID,
		)

		return struct{}{}, nil
	})(ctx)

	return err
}

// InternalLogin handles login requests from internal services
func (s *authService) InternalLogin(ctx context.Context, req *authPb.InternalLoginRequest) (*authPb.InternalLoginResponse, error) {
	return decorator.WithTimeout[*authPb.InternalLoginResponse](5*time.Second)(func(ctx context.Context) (*authPb.InternalLoginResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Processing internal login request",
			logging.FieldOperation, "internal_login",
			logging.FieldEntity, "user",
			"username", req.Username,
		)

		// Get user by username
		user, err := s.userRepo.FindByUsername(ctx, req.Username)
		if err != nil {
			logger.Error("Failed to find user", err,
				logging.FieldOperation, "internal_login",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return nil, exceptions.NotFound("user", req.Username, err)
		}

		// Validate password
		isValid, err := s.userRepo.ValidatePassword(ctx, req.Username, req.Password)
		if err != nil {
			logger.Error("Password validation error", err,
				logging.FieldOperation, "internal_login",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return nil, exceptions.Internal("password validation error", err)
		}

		if !isValid {
			logger.Warn("Invalid credentials attempt",
				logging.FieldOperation, "internal_login",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return nil, exceptions.Unauthorized("invalid credentials", nil)
		}

		// Get user with roles
		userWithRoles, err := s.userService.GetUserByUsername(ctx, req.Username)
		if err != nil {
			logger.Error("Failed to get user with roles", err,
				logging.FieldOperation, "internal_login",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return nil, exceptions.Internal("failed to get user with roles", err)
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
			logger.Error("Failed to store refresh token", err,
				logging.FieldOperation, "internal_login",
				logging.FieldEntity, "refresh_token",
				logging.FieldEntityID, user.Id,
			)
			return nil, exceptions.Internal("failed to store refresh token", err)
		}

		// Create user response for gRPC
		pbUser := &authPb.UserInfo{
			Id:         user.Id,
			Username:   user.Username,
			FirstName:  user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName:   user.Name.LastName,
			Roles:      roleIDs,
		}
		
		// Add major ID if available
		if userWithRoles.MajorID != "" {
			pbUser.MajorId = userWithRoles.MajorID
		}

		logger.Info("Internal login successful",
			logging.FieldOperation, "internal_login",
			logging.FieldEntity, "user",
			logging.FieldEntityID, user.Id,
			"username", user.Username,
		)

		return &authPb.InternalLoginResponse{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresAt:    expiresAt.Unix(),
			User:         pbUser,
		}, nil
	})(ctx)
}

// ValidateTokenGRPC validates a token for gRPC requests
func (s *authService) ValidateTokenGRPC(ctx context.Context, req *authPb.ValidateTokenRequest) (*authPb.ValidateTokenResponse, error) {
	return decorator.WithTimeout[*authPb.ValidateTokenResponse](5*time.Second)(func(ctx context.Context) (*authPb.ValidateTokenResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Validating token for gRPC",
			logging.FieldOperation, "validate_token_grpc",
			logging.FieldEntity, "token",
		)

		// Parse and validate the token
		claims, err := security.ParseToken(s.cfg.Jwt.AccessSecretKey, req.Token)
		if err != nil {
			logger.Error("Invalid token", err,
				logging.FieldOperation, "validate_token_grpc",
				logging.FieldEntity, "token",
			)
			return nil, exceptions.Unauthorized("invalid token", err)
		}

		// Get full user details
		user, err := s.userService.GetUserByID(ctx, claims.UserID)
		if err != nil {
			logger.Error("Failed to get user for token validation", err,
				logging.FieldOperation, "validate_token_grpc",
				logging.FieldEntity, "user",
				logging.FieldEntityID, claims.UserID,
			)
			return nil, exceptions.Internal("failed to get user information", err)
		}

		// Convert to UserInfo for gRPC response
		userInfo := &authPb.UserInfo{
			Id:         user.ID,
			Username:   user.Username,
			FirstName:  user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName:   user.Name.LastName,
		}

		// Add roles
		roles := make([]string, 0)
		roleCodes := make([]string, 0)
		for _, role := range user.Roles {
			roles = append(roles, role.Id)
			roleCodes = append(roleCodes, role.Code)
		}
		userInfo.Roles = roles

		// Add major if available
		if user.MajorID != "" {
			userInfo.MajorId = user.MajorID
		}

		logger.Info("Token validated successfully for gRPC",
			logging.FieldOperation, "validate_token_grpc",
			logging.FieldEntity, "user",
			logging.FieldEntityID, user.ID,
		)

		return &authPb.ValidateTokenResponse{
			Valid: true,
			User:  userInfo,
		}, nil
	})(ctx)
}

// RefreshTokenGRPC refreshes a token for gRPC requests
func (s *authService) RefreshTokenGRPC(ctx context.Context, req *authPb.RefreshTokenRequest) (*authPb.RefreshTokenResponse, error) {
	return decorator.WithTimeout[*authPb.RefreshTokenResponse](5*time.Second)(func(ctx context.Context) (*authPb.RefreshTokenResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Refreshing token for gRPC",
			logging.FieldOperation, "refresh_token_grpc",
			logging.FieldEntity, "token",
		)

		// Validate refresh token
		claims, err := security.ParseToken(s.cfg.Jwt.RefreshSecretKey, req.RefreshToken)
		if err != nil {
			logger.Error("Invalid refresh token", err,
				logging.FieldOperation, "refresh_token_grpc",
				logging.FieldEntity, "token",
			)
			return nil, exceptions.Unauthorized("invalid refresh token", err)
		}

		// Check if token exists in database
		userID, err := s.authRepo.FindRefreshToken(ctx, req.RefreshToken)
		if err != nil {
			logger.Error("Refresh token not found in database", err,
				logging.FieldOperation, "refresh_token_grpc",
				logging.FieldEntity, "token",
			)
			return nil, exceptions.Unauthorized("invalid refresh token", err)
		}

		// Get user for up-to-date roles
		user, err := s.userService.GetUserByUsername(ctx, claims.Username)
		if err != nil {
			logger.Error("Failed to get user for refresh token", err,
				logging.FieldOperation, "refresh_token_grpc",
				logging.FieldEntity, "user",
				"username", claims.Username,
			)
			return nil, exceptions.Internal("failed to get user information", err)
		}

		// Update role IDs and codes from current user data
		roleIDs := make([]string, 0)
		roleCodes := make([]string, 0)
		for _, role := range user.Roles {
			roleIDs = append(roleIDs, role.Id)
			roleCodes = append(roleCodes, role.Code)
		}

		// Generate new tokens
		newClaims := &security.Claims{
			UserID:    user.ID,
			Username:  user.Username,
			RoleIds:   roleIDs,
			RoleCodes: roleCodes,
		}

		accessToken := security.NewAccessToken(
			s.cfg.Jwt.AccessSecretKey,
			s.cfg.Jwt.AccessDuration,
			newClaims,
		).SignToken()

		newRefreshToken := security.NewRefreshToken(
			s.cfg.Jwt.RefreshSecretKey,
			s.cfg.Jwt.RefreshDuration,
			newClaims,
		).SignToken()

		// Delete the old refresh token and store the new one
		err = s.authRepo.DeleteRefreshToken(ctx, userID)
		if err != nil {
			logger.Error("Failed to delete old refresh token", err,
				logging.FieldOperation, "refresh_token_grpc",
				logging.FieldEntity, "refresh_token",
				logging.FieldEntityID, userID,
			)
			// Continue even if delete fails
		}

		expiresAt := time.Now().Add(time.Duration(s.cfg.Jwt.RefreshDuration) * time.Second)
		err = s.authRepo.StoreRefreshToken(ctx, newRefreshToken, userID, expiresAt)
		if err != nil {
			logger.Error("Failed to store new refresh token", err,
				logging.FieldOperation, "refresh_token_grpc",
				logging.FieldEntity, "refresh_token",
				logging.FieldEntityID, userID,
			)
			return nil, exceptions.Internal("failed to store new refresh token", err)
		}

		logger.Info("Refresh token successful for gRPC",
			logging.FieldOperation, "refresh_token_grpc",
			logging.FieldEntity, "user",
			logging.FieldEntityID, userID,
		)

		return &authPb.RefreshTokenResponse{
			AccessToken:  accessToken,
			RefreshToken: newRefreshToken,
			ExpiresAt:    expiresAt.Unix(),
		}, nil
	})(ctx)
}

// RevokeSession revokes a user session
func (s *authService) RevokeSession(ctx context.Context, req *authPb.RevokeSessionRequest) (*authPb.RevokeSessionResponse, error) {
	return decorator.WithTimeout[*authPb.RevokeSessionResponse](5*time.Second)(func(ctx context.Context) (*authPb.RevokeSessionResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Revoking session",
			logging.FieldOperation, "revoke_session",
			logging.FieldEntity, "user",
			logging.FieldEntityID, req.UserId,
		)

		// Revoke all sessions for user
		err := s.authRepo.DeactivateAllUserSessions(ctx, req.UserId)
		if err != nil {
			logger.Error("Failed to revoke sessions", err,
				logging.FieldOperation, "revoke_session",
				logging.FieldEntity, "session",
				logging.FieldEntityID, req.UserId,
			)
			return nil, exceptions.Internal("failed to revoke sessions", err)
		}

		// Delete refresh tokens
		err = s.authRepo.DeleteRefreshToken(ctx, req.UserId)
		if err != nil {
			logger.Error("Failed to delete refresh tokens", err,
				logging.FieldOperation, "revoke_session",
				logging.FieldEntity, "refresh_token",
				logging.FieldEntityID, req.UserId,
			)
			return nil, exceptions.Internal("failed to delete refresh tokens", err)
		}

		logger.Info("Sessions revoked successfully",
			logging.FieldOperation, "revoke_session",
			logging.FieldEntity, "user",
			logging.FieldEntityID, req.UserId,
		)

		return &authPb.RevokeSessionResponse{
			Success: true,
		}, nil
	})(ctx)
}