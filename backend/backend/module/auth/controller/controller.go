package controller

import (
	"net/http"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/dto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/request"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/response"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/security"
	"github.com/gofiber/fiber/v2"
)

type (
	AuthController interface {
		RegisterPublicRoutes(router fiber.Router)
		RegisterProtectedRoutes(router fiber.Router)
		RegisterAdminRoutes(router fiber.Router)
		Login(c *fiber.Ctx) error
		RefreshToken(c *fiber.Ctx) error
		Logout(c *fiber.Ctx) error
		ValidateToken(c *fiber.Ctx) error
		RevokeUserSessions(c *fiber.Ctx) error
	}

	authController struct {
		cfg         *config.Config
		authService service.AuthService
	}
)

func NewAuthController(cfg *config.Config, authService service.AuthService) AuthController {
	return &authController{
		cfg:         cfg,
		authService: authService,
	}
}

// RegisterPublicRoutes registers public routes that don't require authentication
func (c *authController) RegisterPublicRoutes(router fiber.Router) {
	router.Post("/auth/login", c.Login)
	router.Post("/auth/refresh", c.RefreshToken)
}

// RegisterProtectedRoutes registers routes that require authentication
func (c *authController) RegisterProtectedRoutes(router fiber.Router) {
	router.Post("/auth/logout", c.Logout)
	router.Get("/auth/validate", c.ValidateToken)
}

// RegisterAdminRoutes registers routes that require admin role
func (c *authController) RegisterAdminRoutes(router fiber.Router) {
	router.Post("/auth/revoke/:userId", c.RevokeUserSessions)
}

// Login handles user authentication and returns tokens
func (c *authController) Login(ctx *fiber.Ctx) error {
	wrapper := request.NewContextWrapper(ctx)

	var req dto.LoginRequest
	if err := wrapper.Bind(&req); err != nil {
		return response.Error(ctx, http.StatusBadRequest, err.Error())
	}

	result, err := c.authService.Login(ctx.Context(), &req)
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

	return response.Success(ctx, http.StatusOK, result.Data)
}

// RefreshToken handles token refresh requests
func (c *authController) RefreshToken(ctx *fiber.Ctx) error {
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

	result, err := c.authService.RefreshToken(ctx.Context(), &req)
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

	// Update cookies
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

// Logout handles user logout
func (c *authController) Logout(ctx *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID := ctx.Locals("user_id").(string)
	if userID == "" {
		return response.Error(ctx, http.StatusUnauthorized, "unauthorized")
	}

	if err := c.authService.Logout(ctx.Context(), userID); err != nil {
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

	return response.Success(ctx, http.StatusOK, nil)
}

// ValidateToken validates the current token
func (c *authController) ValidateToken(ctx *fiber.Ctx) error {
	userID := ctx.Locals("user_id").(string)
	username := ctx.Locals("username").(string)

	user, err := c.authService.ValidateToken(ctx.Context(), ctx.Get("Authorization"))
	if err != nil {
		return response.Error(ctx, http.StatusUnauthorized, err.Error())
	}

	if user.ID != userID || user.Username != username {
		return response.Error(ctx, http.StatusUnauthorized, "invalid token")
	}

	return response.Success(ctx, http.StatusOK, user)
}

// RevokeUserSessions revokes all sessions for a user (admin only)
func (c *authController) RevokeUserSessions(ctx *fiber.Ctx) error {
	userID := ctx.Params("userId")
	if userID == "" {
		return response.Error(ctx, http.StatusBadRequest, "user ID is required")
	}

	if err := c.authService.Logout(ctx.Context(), userID); err != nil {
		return response.Error(ctx, http.StatusInternalServerError, err.Error())
	}

	return response.Success(ctx, http.StatusOK, nil)
}