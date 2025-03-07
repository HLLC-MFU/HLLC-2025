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
		AccessToken  string `json:"accessToken"`
		TokenType    string `json:"tokenType"`
		ExpiresAt    time.Time `json:"expiresAt"`
		UserID       string `json:"userId"`
	}

	RefreshTokenRequest struct {
		RefreshToken string `json:"refreshToken" validate:"required"`
	}

	RefreshTokenResponse struct {
		AccessToken  string `json:"accessToken"`
		TokenType    string `json:"tokenType"`
		ExpiresAt    time.Time `json:"expiresAt"`
	}

	RevokeTokenRequest struct {
		RefreshToken string `json:"refreshToken" validate:"required"`
	}

	RevokeTokenResponse struct {
		Message string `json:"message"`
	}
)