package handler

import (
	"context"
	"strings"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/dto"
	authPb "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto/generated"
	authService "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/response"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"github.com/gofiber/fiber/v2"
)

// CookieConfig defines cookie settings
type CookieConfig struct {
	Name     string
	Path     string
	MaxAge   int
	Secure   bool
	HttpOnly bool
}

// Token types
const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
)

// GetCookieConfig returns cookie configuration for token types
func GetCookieConfig(tokenType string, secure bool) CookieConfig {
	switch tokenType {
	case TokenTypeAccess:
		return CookieConfig{
			Name:     "access_token",
			Path:     "/",
			MaxAge:   3600, // 1 hour
			Secure:   secure,
			HttpOnly: true,
		}
	case TokenTypeRefresh:
		return CookieConfig{
			Name:     "refresh_token",
			Path:     "/",
			MaxAge:   604800, // 7 days
			Secure:   secure,
			HttpOnly: true,
		}
	default:
		return CookieConfig{
			Name:     tokenType + "_token",
			Path:     "/",
			MaxAge:   3600,
			Secure:   secure,
			HttpOnly: true,
		}
	}
}

type (
	AuthHttpHandler interface {
		Login(c *fiber.Ctx) error
		RefreshToken(c *fiber.Ctx) error
		ValidateToken(c *fiber.Ctx) error
		Logout(c *fiber.Ctx) error
		RevokeUserSessions(c *fiber.Ctx) error
	}

	authHttpHandler struct {
		cfg         *config.Config
		authService authService.AuthService
	}
)

// NewAuthHTTPHandler creates a new auth HTTP handler instance
func NewAuthHTTPHandler(cfg *config.Config, authService authService.AuthService) AuthHttpHandler {
	return &authHttpHandler{
		cfg:         cfg,
		authService: authService,
	}
}

// Login handles user authentication and returns access and refresh tokens
// POST /auth/login
func (h *authHttpHandler) Login(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithRecovery(),
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.LoginRequest](func(c *fiber.Ctx, req *dto.LoginRequest) error {
		logger := logging.DefaultLogger.WithContext(c.Context())
		logger.Info("Processing login request",
			logging.FieldOperation, "login_handler",
			logging.FieldEntity, "user",
			"username", req.Username,
		)

		// Add request metadata to context
		ctx := context.WithValue(c.Context(), "client_ip", c.IP())
		ctx = context.WithValue(ctx, "user_agent", c.Get("User-Agent"))
		
		// Set context timeout
		ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()

		result, err := h.authService.Login(ctx, req)
		if err != nil {
			logger.Error("Login failed", err,
				logging.FieldOperation, "login_handler",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return exceptions.HandleError(c, err)
		}

		// Determine if we should use Secure cookies based on environment
		// In development, we typically use HTTP so Secure should be false
		isProduction := strings.Contains(h.cfg.App.Url, "https://")
		
		// Set cookies for web clients
		accessCookie := GetCookieConfig(TokenTypeAccess, isProduction)
		refreshCookie := GetCookieConfig(TokenTypeRefresh, isProduction)

		c.Cookie(&fiber.Cookie{
			Name:     accessCookie.Name,
			Value:    result.Data.AccessToken,
			Path:     accessCookie.Path,
			MaxAge:   accessCookie.MaxAge,
			Secure:   accessCookie.Secure,
			HTTPOnly: accessCookie.HttpOnly,
			SameSite: fiber.CookieSameSiteLaxMode,
		})

		c.Cookie(&fiber.Cookie{
			Name:     refreshCookie.Name,
			Value:    result.Data.RefreshToken,
			Path:     refreshCookie.Path,
			MaxAge:   refreshCookie.MaxAge,
			Secure:   refreshCookie.Secure,
			HTTPOnly: refreshCookie.HttpOnly,
			SameSite: fiber.CookieSameSiteLaxMode, // Changed from StrictMode to LaxMode for better compatibility
		})

		// Return only tokens, not user data, for better security
		tokenResponse := fiber.Map{
			"access_token":  result.Data.AccessToken,
			"refresh_token": result.Data.RefreshToken,
			"expires_at":    result.Data.ExpiresAt,
		}

		logger.Info("Login successful",
			logging.FieldOperation, "login_handler",
			logging.FieldEntity, "user",
			"username", req.Username,
		)

		return response.Success(c, fiber.StatusOK, tokenResponse)
	}))

	return handler(c)
}

// RefreshToken generates new tokens using a valid refresh token
// POST /auth/refresh-token
func (h *authHttpHandler) RefreshToken(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithRecovery(),
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.RefreshTokenRequest](func(c *fiber.Ctx, req *dto.RefreshTokenRequest) error {
		logger := logging.DefaultLogger.WithContext(c.Context())
		logger.Info("Processing refresh token request",
			logging.FieldOperation, "refresh_token_handler",
			logging.FieldEntity, "token",
		)

		// If no refresh token in body, try to get from cookie
		if req.RefreshToken == "" {
			cookie := c.Cookies("refresh_token")
			if cookie == "" {
				logger.Warn("No refresh token provided",
					logging.FieldOperation, "refresh_token_handler",
					logging.FieldEntity, "token",
				)
				return exceptions.HandleError(c, exceptions.InvalidInput("refresh token is required", nil))
			}
			req.RefreshToken = cookie
		}

		// Set context timeout
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		result, err := h.authService.RefreshToken(ctx, req)
		if err != nil {
			logger.Error("Refresh token failed", err,
				logging.FieldOperation, "refresh_token_handler",
				logging.FieldEntity, "token",
			)
			return exceptions.HandleError(c, err)
		}

		// Determine if we should use Secure cookies based on environment
		isProduction := strings.Contains(h.cfg.App.Url, "https://")
		
		// Set new cookies
		accessCookie := GetCookieConfig(TokenTypeAccess, isProduction)
		refreshCookie := GetCookieConfig(TokenTypeRefresh, isProduction)

		c.Cookie(&fiber.Cookie{
			Name:     accessCookie.Name,
			Value:    result.AccessToken,
			Path:     accessCookie.Path,
			MaxAge:   accessCookie.MaxAge,
			Secure:   accessCookie.Secure,
			HTTPOnly: accessCookie.HttpOnly,
			SameSite: fiber.CookieSameSiteLaxMode,
		})

		c.Cookie(&fiber.Cookie{
			Name:     refreshCookie.Name,
			Value:    result.RefreshToken,
			Path:     refreshCookie.Path,
			MaxAge:   refreshCookie.MaxAge,
			Secure:   refreshCookie.Secure,
			HTTPOnly: refreshCookie.HttpOnly,
			SameSite: fiber.CookieSameSiteLaxMode,
		})

		// Return token data in response
		tokenResponse := fiber.Map{
			"access_token":  result.AccessToken,
			"refresh_token": result.RefreshToken,
			"expires_at":    result.ExpiresAt.Format(time.RFC3339),
		}

		logger.Info("Refresh token successful",
			logging.FieldOperation, "refresh_token_handler",
			logging.FieldEntity, "token",
		)

		return response.Success(c, fiber.StatusOK, tokenResponse)
	}))

	return handler(c)
}

// ValidateToken validates the access token
// GET /auth/validate
func (h *authHttpHandler) ValidateToken(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithRecovery(),
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		logger := logging.DefaultLogger.WithContext(c.Context())
		logger.Info("Processing token validation",
			logging.FieldOperation, "validate_token_handler",
			logging.FieldEntity, "token",
		)

		// Get token from Authorization header or cookie
		var token string
		authHeader := c.Get("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			token = c.Cookies("access_token")
		}

		if token == "" {
			logger.Warn("No token provided",
				logging.FieldOperation, "validate_token_handler",
				logging.FieldEntity, "token",
			)
			return exceptions.HandleError(c, exceptions.Unauthorized("no authentication token provided", nil))
		}

		// Set context timeout
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		result, err := h.authService.ValidateToken(ctx, token)
		if err != nil {
			logger.Error("Token validation failed", err,
				logging.FieldOperation, "validate_token_handler",
				logging.FieldEntity, "token",
			)
			return exceptions.HandleError(c, err)
		}

		logger.Info("Token validation successful",
			logging.FieldOperation, "validate_token_handler",
			logging.FieldEntity, "token",
			"user_id", result.ID,
		)

		return response.Success(c, fiber.StatusOK, result)
	})

	return handler(c)
}

// Logout invalidates the user's tokens
// POST /auth/logout
func (h *authHttpHandler) Logout(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithRecovery(),
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		logger := logging.DefaultLogger.WithContext(c.Context())
		logger.Info("Processing logout request",
			logging.FieldOperation, "logout_handler",
			logging.FieldEntity, "user",
		)

		// Get token from Authorization header or cookie
		var token string
		authHeader := c.Get("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			token = c.Cookies("access_token")
		}

		// Set context timeout
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		// Determine if we should use Secure cookies based on environment
		isProduction := strings.Contains(h.cfg.App.Url, "https://")

		if token == "" {
			logger.Warn("No token provided for logout",
				logging.FieldOperation, "logout_handler",
				logging.FieldEntity, "user",
			)
			// Clear cookies anyway
			accessCookie := GetCookieConfig(TokenTypeAccess, isProduction)
			refreshCookie := GetCookieConfig(TokenTypeRefresh, isProduction)

			c.Cookie(&fiber.Cookie{
				Name:     accessCookie.Name,
				Value:    "",
				Path:     accessCookie.Path,
				MaxAge:   -1,
				Secure:   accessCookie.Secure,
				HTTPOnly: accessCookie.HttpOnly,
				SameSite: fiber.CookieSameSiteLaxMode,
			})

			c.Cookie(&fiber.Cookie{
				Name:     refreshCookie.Name,
				Value:    "",
				Path:     refreshCookie.Path,
				MaxAge:   -1,
				Secure:   refreshCookie.Secure,
				HTTPOnly: refreshCookie.HttpOnly,
				SameSite: fiber.CookieSameSiteLaxMode,
			})

			return response.Success(c, fiber.StatusOK, fiber.Map{"message": "Logged out successfully"})
		}

		err := h.authService.Logout(ctx, token)
		if err != nil {
			logger.Error("Logout failed", err,
				logging.FieldOperation, "logout_handler",
				logging.FieldEntity, "user",
			)
			return exceptions.HandleError(c, err)
		}

		// Clear cookies
		accessCookie := GetCookieConfig(TokenTypeAccess, isProduction)
		refreshCookie := GetCookieConfig(TokenTypeRefresh, isProduction)

		c.Cookie(&fiber.Cookie{
			Name:     accessCookie.Name,
			Value:    "",
			Path:     accessCookie.Path,
			MaxAge:   -1,
			Secure:   accessCookie.Secure,
			HTTPOnly: accessCookie.HttpOnly,
			SameSite: fiber.CookieSameSiteLaxMode,
		})

		c.Cookie(&fiber.Cookie{
			Name:     refreshCookie.Name,
			Value:    "",
			Path:     refreshCookie.Path,
			MaxAge:   -1,
			Secure:   refreshCookie.Secure,
			HTTPOnly: refreshCookie.HttpOnly,
			SameSite: fiber.CookieSameSiteLaxMode,
		})

		logger.Info("Logout successful",
			logging.FieldOperation, "logout_handler",
			logging.FieldEntity, "user",
		)

		return response.Success(c, fiber.StatusOK, fiber.Map{"message": "Logged out successfully"})
	})

	return handler(c)
}

// RevokeUserSessions revokes all sessions for a user (admin only)
// POST /auth/revoke-sessions/:userId
func (h *authHttpHandler) RevokeUserSessions(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithRecovery(),
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		logger := logging.DefaultLogger.WithContext(c.Context())
		
		// Get user ID from params
		userId := c.Params("userId")
		if userId == "" {
			logger.Warn("No user ID provided",
				logging.FieldOperation, "revoke_sessions_handler",
				logging.FieldEntity, "user",
			)
			return exceptions.HandleError(c, exceptions.InvalidInput("userId is required", nil))
		}
		
		logger.Info("Processing session revocation request",
			logging.FieldOperation, "revoke_sessions_handler",
			logging.FieldEntity, "user",
			"target_user_id", userId,
		)

		// Check if caller has admin role
		callerData, exists := c.Locals("user").(map[string]interface{})
		if !exists || callerData == nil {
			logger.Warn("Unauthorized access attempt - no user data",
				logging.FieldOperation, "revoke_sessions_handler",
				logging.FieldEntity, "user",
				"target_user_id", userId,
			)
			return exceptions.HandleError(c, exceptions.Unauthorized("admin role required", nil))
		}
		
		// Check if caller has roles
		callerRoles, hasRoles := callerData["roles"].([]string)
		if !hasRoles || len(callerRoles) == 0 {
			logger.Warn("Unauthorized access attempt - no roles",
				logging.FieldOperation, "revoke_sessions_handler",
				logging.FieldEntity, "user",
				"target_user_id", userId,
			)
			return exceptions.HandleError(c, exceptions.Unauthorized("admin role required", nil))
		}
		
		// Check specifically for ADMIN role
		hasAdminRole := false
		for _, role := range callerRoles {
			if role == "ADMIN" {
				hasAdminRole = true
				break
			}
		}
		
		if !hasAdminRole {
			logger.Warn("Unauthorized access attempt - not admin",
				logging.FieldOperation, "revoke_sessions_handler",
				logging.FieldEntity, "user",
				"target_user_id", userId,
				"caller_roles", callerRoles,
			)
			return exceptions.HandleError(c, exceptions.Unauthorized("admin role required", nil))
		}

		// Set context timeout
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		_, err := h.authService.RevokeSession(ctx, &authPb.RevokeSessionRequest{
			UserId: userId,
		})

		if err != nil {
			logger.Error("Session revocation failed", err,
				logging.FieldOperation, "revoke_sessions_handler",
				logging.FieldEntity, "user",
				"target_user_id", userId,
			)
			return exceptions.HandleError(c, err)
		}

		logger.Info("Session revocation successful",
			logging.FieldOperation, "revoke_sessions_handler",
			logging.FieldEntity, "user",
			"target_user_id", userId,
		)

		return response.Success(c, fiber.StatusOK, fiber.Map{
			"message": "All sessions for user have been revoked successfully",
			"userId":  userId,
		})
	})

	return handler(c)
}
