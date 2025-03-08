package dto

import "time"

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
		User UserResponse `json:"user"`
		TokenResponse
	}

	RefreshTokenRequest struct {
		RefreshToken string `json:"refreshToken" validate:"required"`
	}

	TokenResponse struct {
		AccessToken  string    `json:"accessToken"`
		RefreshToken string    `json:"refreshToken"`
		ExpiresAt    time.Time `json:"expiresAt"`
	}

	UserResponse struct {
		ID         string   `json:"id"`
		Username   string   `json:"username"`
		FirstName  string   `json:"firstName"`
		MiddleName string   `json:"middleName"`
		LastName   string   `json:"lastName"`
		Roles      []string `json:"roles"`
}
)