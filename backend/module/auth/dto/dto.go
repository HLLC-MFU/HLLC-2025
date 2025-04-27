package dto

import (
	"time"

	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
)

/**
 * Auth DTOs
 *
 * @author Dev. Bengi (Backend Team)
 */

type (

	LoginRequest struct {
		Username string `json:"username" validate:"required"`
		Password string `json:"password" validate:"required"`
	}

	LoginResponse struct {
		Status bool             `json:"status"`
		Data   LoginResponseData `json:"data"`
	}

	LoginResponseData struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresAt    string `json:"expires_at"`
	}

	RefreshTokenRequest struct {
		RefreshToken string `json:"refresh_token" validate:"required"`
	}

	TokenResponse struct {
		AccessToken  string    `json:"access_token"`
		RefreshToken string    `json:"refresh_token"`
		ExpiresAt    time.Time `json:"expires_at"`
	}

	RevokeSessionRequest struct {
		UserID string `json:"userId" validate:"required"`
	}

	RevokeSessionResponse struct {
		Status bool `json:"status"`
	}

	UserResponse struct {
		ID         string        `json:"id"`
		Username   string        `json:"username"`
		FirstName  string        `json:"firstName"`
		MiddleName string        `json:"middleName"`
		LastName   string        `json:"lastName"`
		Roles      []Role        `json:"roles,omitempty"`
		MajorID    string        `json:"majorId,omitempty"`
		Major      *majorPb.Major `json:"major,omitempty"`
	}

	Role struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Code        string `json:"code"`
		Description string `json:"description"`
	}
)