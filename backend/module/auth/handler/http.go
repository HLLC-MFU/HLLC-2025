package handler

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/dto"
	authServiceHttp "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
)

// ----------- Interface -----------

type AuthHTTPHandler interface {
	Login(c *fiber.Ctx) error
	RefreshToken(c *fiber.Ctx) error
}

// ----------- Implementation -----------

type authHTTPHandler struct {
	authService authServiceHttp.AuthService
}

func NewAuthHTTPHandler(authService authServiceHttp.AuthService) AuthHTTPHandler {
	return &authHTTPHandler{authService: authService}
}

// ----------- Login Handler -----------

func (h *authHTTPHandler) Login(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid request body", err))
	}

	accessToken, refreshToken, expiresAt, err := h.authService.Login(ctx, req.Username, req.Password)
	if err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid credentials", err))
	}

	return c.Status(fiber.StatusOK).JSON(dto.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt.Format(time.RFC3339),
	})
}

// ----------- Refresh Token Handler -----------

func (h *authHTTPHandler) RefreshToken(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	var req dto.RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid request body", err))
	}

	newAccessToken, expiresAt, err := h.authService.RefreshAccessToken(ctx, req.RefreshToken)
	if err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid refresh token", err))
	}

	return c.Status(fiber.StatusOK).JSON(dto.RefreshTokenResponse{
		AccessToken: newAccessToken,
		ExpiresAt:   expiresAt.Format(time.RFC3339),
	})
}
