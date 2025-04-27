package http

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/auth/repository"
	authRepository "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/repository"
)

// Secret keys (TODO: เอาไปไว้ใน config/environment)
var jwtSecret = []byte("your-super-secret")
var refreshSecret = []byte("your-refresh-secret")

// ----------- Interface -----------

type AuthService interface {
	Login(ctx context.Context, username, password string) (accessToken, refreshToken string, expiresAt time.Time, err error)
	RefreshAccessToken(ctx context.Context, refreshToken string) (newAccessToken string, expiresAt time.Time, err error)
}

// ----------- Implementation -----------

type authService struct {
	authRepo         authRepository.AuthRepository
	refreshTokenRepo authRepository.RefreshTokenRepository
}

func NewAuthService(authRepo authRepository.AuthRepository, refreshTokenRepo repository.RefreshTokenRepository) AuthService {
	return &authService{
		authRepo:         authRepo,
		refreshTokenRepo: refreshTokenRepo,
	}
}

// ----------- Login -----------

func (s *authService) Login(ctx context.Context, username, password string) (string, string, time.Time, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	user, err := s.authRepo.FindUserByUsername(ctx, username)
	if err != nil {
		return "", "", time.Time{}, errors.New("invalid username or password")
	}

	// TODO: เปลี่ยนจาก plain password check ไปใช้ hashed password check
	if user.Password != password {
		return "", "", time.Time{}, errors.New("invalid username or password")
	}

	// Create Access Token
	accessExpireAt := time.Now().Add(15 * time.Minute)
	accessClaims := jwt.MapClaims{
		"user_id":  user.Id,
		"username": user.Username,
		"roles":    user.RoleIds,
		"exp":      accessExpireAt.Unix(),
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	signedAccessToken, err := accessToken.SignedString(jwtSecret)
	if err != nil {
		return "", "", time.Time{}, err
	}

	// Create Refresh Token
	refreshExpireAt := time.Now().Add(7 * 24 * time.Hour)
	refreshClaims := jwt.MapClaims{
		"user_id": user.Id,
		"exp":     refreshExpireAt.Unix(),
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	signedRefreshToken, err := refreshToken.SignedString(refreshSecret)
	if err != nil {
		return "", "", time.Time{}, err
	}

	// Save refresh token
	err = s.refreshTokenRepo.Save(ctx, &repository.RefreshToken{
		UserID:       user.Id,
		RefreshToken: signedRefreshToken,
		ExpiresAt:    refreshExpireAt,
		CreatedAt:    time.Now(),
		Revoked:      false,
	})
	if err != nil {
		return "", "", time.Time{}, err
	}

	return signedAccessToken, signedRefreshToken, accessExpireAt, nil
}

// ----------- Refresh Access Token -----------

func (s *authService) RefreshAccessToken(ctx context.Context, refreshToken string) (string, time.Time, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rt, err := s.refreshTokenRepo.FindByToken(ctx, refreshToken)
	if err != nil || rt.Revoked || rt.ExpiresAt.Before(time.Now()) {
		return "", time.Time{}, errors.New("invalid or expired refresh token")
	}

	// Parse refresh token
	claims := jwt.MapClaims{}
	_, err = jwt.ParseWithClaims(refreshToken, claims, func(token *jwt.Token) (interface{}, error) {
		return refreshSecret, nil
	})
	if err != nil {
		return "", time.Time{}, errors.New("invalid refresh token")
	}

	userId := claims["user_id"].(string)

	// Create new Access Token
	newAccessExpire := time.Now().Add(15 * time.Minute)
	newClaims := jwt.MapClaims{
		"user_id": userId,
		"exp":     newAccessExpire.Unix(),
	}

	newToken := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
	signedAccessToken, err := newToken.SignedString(jwtSecret)
	if err != nil {
		return "", time.Time{}, err
	}

	return signedAccessToken, newAccessExpire, nil
}
