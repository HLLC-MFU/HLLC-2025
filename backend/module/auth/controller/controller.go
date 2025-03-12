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
		RegisterRoutes(router fiber.Router)
		Login(c *fiber.Ctx) error
		RefreshToken(c *fiber.Ctx) error
		Logout(c *fiber.Ctx) error
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

// RegisterRoutes registers all HTTP routes for auth service
func (c *authController) RegisterRoutes(router fiber.Router) {
	router.Post("/auth/login", c.Login)
	router.Post("/auth/refresh", c.RefreshToken)
	router.Post("/auth/logout", c.Logout)
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

	// Return only the data part of the response to avoid double nesting
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