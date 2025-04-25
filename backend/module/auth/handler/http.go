package handler

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/dto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/request"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/response"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/security"
	"github.com/gofiber/fiber/v2"
)

type (
	AuthHttpHandler interface {
		Login(c *fiber.Ctx) error
		RefreshToken(c *fiber.Ctx) error
		ValidateToken(c *fiber.Ctx) error
		Logout(c *fiber.Ctx) error
		RevokeUserSessions(ctx *fiber.Ctx) error
	}

	authHttpHandler struct {
		cfg         *config.Config
		authService service.AuthService
	}
)

func NewAuthHttpHandler(cfg *config.Config, authService service.AuthService) AuthHttpHandler {
	return &authHttpHandler{
		cfg:         cfg,
		authService: authService,
	}
}

// POST /auth/login
func (c *authHttpHandler) Login(ctx *fiber.Ctx) error {
	wrapper := request.NewContextWrapper(ctx)

	var req dto.LoginRequest
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(ctx, http.StatusBadRequest, err.Error())
	}

	loginWithTimeout := decorator.WithTimeout[*dto.LoginResponse](5 * time.Second)(func(innerCtx context.Context) (*dto.LoginResponse, error) {
		return c.authService.Login(innerCtx, &req)
	})

	result, err := loginWithTimeout(ctx.Context())
	if err != nil {
		switch err {
		case service.ErrInvalidCredentials:
			return response.Error(ctx, http.StatusUnauthorized, "invalid credentials")
		default:
			return response.Error(ctx, http.StatusInternalServerError, err.Error())
		}
	}

	// Set cookies for web clients
	accessCookie := security.GetCookieConfig(security.TokenTypeAccess, true)
	refreshCookie := security.GetCookieConfig(security.TokenTypeRefresh, true)

	ctx.Cookie(&fiber.Cookie{
		Name:     accessCookie.Name,
		Value:    result.Data.AccessToken,
		Path:     accessCookie.Path,
		MaxAge:   accessCookie.MaxAge,
		Secure:   accessCookie.Secure,
		HTTPOnly: accessCookie.HttpOnly,
		SameSite: fiber.CookieSameSiteLaxMode,
	})

	ctx.Cookie(&fiber.Cookie{
		Name:     refreshCookie.Name,
		Value:    result.Data.RefreshToken,
		Path:     refreshCookie.Path,
		MaxAge:   refreshCookie.MaxAge,
		Secure:   refreshCookie.Secure,
		HTTPOnly: refreshCookie.HttpOnly,
		SameSite: fiber.CookieSameSiteStrictMode,
	})

	// Return only tokens, not user data, for better security
	tokenResponse := map[string]interface{}{
		"access_token":  result.Data.AccessToken,
		"refresh_token": result.Data.RefreshToken,
		"expires_at":    result.Data.ExpiresAt,
	}

	return response.Success(ctx, http.StatusOK, tokenResponse)
}

// POST /auth/refresh-token
func (h *authHttpHandler) RefreshToken(ctx *fiber.Ctx) error {
	wrapper := request.NewContextWrapper(ctx)

	var req dto.RefreshTokenRequest
	if err := wrapper.Bind(&req); err != nil {
		// Try to get refresh token from cookie if not in body
		cookie := ctx.Cookies("refresh_token")
		if cookie == "" {
			return response.Error(ctx, http.StatusBadRequest, "refresh token is required")
		}
		req.RefreshToken = cookie
	}

	refreshWithTimeout := decorator.WithTimeout[*dto.TokenResponse](5 * time.Second)(func(innerCtx context.Context) (*dto.TokenResponse, error) {
		return h.authService.RefreshToken(innerCtx, &req)
	})

	result, err := refreshWithTimeout(ctx.Context())
	if err != nil {
		switch err {
		case security.ErrTokenExpired:
			return response.Error(ctx, http.StatusUnauthorized, "refresh token expired")
		case security.ErrInvalidToken:
			return response.Error(ctx, http.StatusBadRequest, "invalid refresh token")
		default:
			return response.Error(ctx, http.StatusInternalServerError, err.Error())
		}
	}

	accessCookie := security.GetCookieConfig(security.TokenTypeAccess, true)
	refreshCookie := security.GetCookieConfig(security.TokenTypeRefresh, true)

	ctx.Cookie(&fiber.Cookie{
		Name:     accessCookie.Name,
		Value:    result.AccessToken,
		Path:     accessCookie.Path,
		MaxAge:   accessCookie.MaxAge,
		Secure:   accessCookie.Secure,
		HTTPOnly: accessCookie.HttpOnly,
		SameSite: fiber.CookieSameSiteLaxMode,
	})

	ctx.Cookie(&fiber.Cookie{
		Name:     refreshCookie.Name,
		Value:    result.RefreshToken,
		Path:     refreshCookie.Path,
		MaxAge:   refreshCookie.MaxAge,
		Secure:   refreshCookie.Secure,
		HTTPOnly: refreshCookie.HttpOnly,
		SameSite: fiber.CookieSameSiteStrictMode,
	})

	return response.Success(ctx, http.StatusOK, result)
}


// GET /auth/validate-token
func (h *authHttpHandler) Logout(ctx *fiber.Ctx) error {

	// Get user ID from context (set by auth middleware)
	userIDValue := ctx.Locals("user_id")
	userID, ok := userIDValue.(string)
	if ! ok || userID == "" {
		return response.Error(ctx, http.StatusUnauthorized, "unauthorized")
	}

	// Calling decorator.WuthTimeout
	logoutWithTimeout := decorator.WithTimeout[error](5 * time.Second)(func(innerCtx context.Context) (error, error) {
	
		err := h.authService.Logout(innerCtx, userID)
		return nil, err
	})

	if _, err := logoutWithTimeout(ctx.Context()); err != nil {
		return response.Error(ctx, http.StatusInternalServerError, err.Error())
	}

	// Clear cookies
	ctx.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		Secure:   true,
		HTTPOnly: true,
	})

	ctx.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		Secure:   true,
		HTTPOnly: true,
	})

	return response.Success(ctx, http.StatusOK, "logout successful")
}

func (h *authHttpHandler) ValidateToken(ctx *fiber.Ctx) error {
	// Extract token from Authorization header
	authHeader := ctx.Get("Authorization")
	if authHeader == "" {
		return response.Error(ctx, fiber.StatusUnauthorized, "no authorization header provided")
	}

	// Extract token from Bearer scheme
	var token string
	if strings.HasPrefix(authHeader, "Bearer ") && len(authHeader) > 7 {
		token = strings.TrimSpace(authHeader[7:])
	} else {
		token = strings.TrimSpace(authHeader) // Allow raw token
	}

	if token == "" {
		return response.Error(ctx, fiber.StatusUnauthorized, "no token provided")
	}

	// Use decorator.WithTimeout to wrap ValidateToken call
	validateWithTimeout := decorator.WithTimeout[*dto.UserResponse](5 * time.Second)(func(innerCtx context.Context) (*dto.UserResponse, error) {
		return h.authService.ValidateToken(innerCtx, token)
	})

	user, err := validateWithTimeout(ctx.Context())
	if err != nil {
		return response.Error(ctx, fiber.StatusUnauthorized, err.Error())
	}

	// Return user info
	return response.Success(ctx, fiber.StatusOK, user)
}

func (h *authHttpHandler) RevokeUserSessions(ctx *fiber.Ctx) error {
	userID := ctx.Params("userId")
	if userID == "" {
		return response.Error(ctx, http.StatusBadRequest, "user ID is required")
	}

	if err := h.authService.Logout(ctx.Context(), userID); err != nil {
		return response.Error(ctx, http.StatusInternalServerError, err.Error())
	}

	return response.Success(ctx, http.StatusOK, nil)
}
