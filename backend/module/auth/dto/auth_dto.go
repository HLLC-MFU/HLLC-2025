package dto

// ----------- Request DTOs -----------

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// ----------- Response DTOs -----------

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    string `json:"expires_at"` // ISO8601 format
}

type RefreshTokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresAt   string `json:"expires_at"` // ISO8601 format
}

type ValidateTokenRequest struct {
	Token string `json:"token" validate:"required"`
}
