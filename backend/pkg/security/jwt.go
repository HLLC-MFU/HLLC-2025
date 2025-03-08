// backend/pkg/security/jwt.go
package security

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
)

var (
    ErrInvalidToken        = errors.New("invalid token")
    ErrTokenExpired       = errors.New("token has expired")
    ErrTokenBlacklisted   = errors.New("token has been blacklisted")
    ErrInvalidSigningMethod = errors.New("invalid signing method")
)

type (
    TokenType string

    Claims struct {
        UserID   string   `json:"user_id"`
        Username string   `json:"username"`
        Roles    []string `json:"roles"`
        jwt.RegisteredClaims
    }

    TokenService interface {
        GenerateAccessToken(claims Claims) (string, error)
        GenerateRefreshToken(claims Claims) (string, time.Time, error)
        ValidateToken(token string) (*Claims, error)
        ValidateRefreshToken(token string) (*Claims, error)
        BlacklistToken(token string) error
        IsTokenBlacklisted(token string) bool
    }

    jwtService struct {
        accessSecret  []byte
        refreshSecret []byte
        issuer       string
        accessTTL    time.Duration
        refreshTTL   time.Duration
        blacklist    *redis.Client
    }
)

// NewJWTService creates a new JWT service instance
func NewJWTService(config *config.Config, redis *redis.Client) TokenService {
    return &jwtService{
        accessSecret:  []byte(config.Jwt.AccessSecretKey),
        refreshSecret: []byte(config.Jwt.RefreshSecretKey),
        issuer:       "hllc-2025",
        accessTTL:    time.Duration(config.Jwt.AccessDuration) * time.Second,
        refreshTTL:   time.Duration(config.Jwt.RefreshDuration) * time.Second,
        blacklist:    redis,
    }
}

// GenerateAccessToken generates a new access token
func (s *jwtService) GenerateAccessToken(claims Claims) (string, error) {
    now := time.Now()
    claims.RegisteredClaims = jwt.RegisteredClaims{
        ExpiresAt: jwt.NewNumericDate(now.Add(s.accessTTL)),
        IssuedAt:  jwt.NewNumericDate(now),
        NotBefore: jwt.NewNumericDate(now),
        Issuer:    s.issuer,
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(s.accessSecret)
}

// GenerateRefreshToken generates a new refresh token
func (s *jwtService) GenerateRefreshToken(claims Claims) (string, time.Time, error) {
    now := time.Now()
    expiresAt := now.Add(s.refreshTTL)
    
    claims.RegisteredClaims = jwt.RegisteredClaims{
        ExpiresAt: jwt.NewNumericDate(expiresAt),
        IssuedAt:  jwt.NewNumericDate(now),
        NotBefore: jwt.NewNumericDate(now),
        Issuer:    s.issuer,
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString(s.refreshSecret)
    if err != nil {
        return "", time.Time{}, err
    }

    return tokenString, expiresAt, nil
}

// ValidateToken validates an access token
func (s *jwtService) ValidateToken(tokenString string) (*Claims, error) {
    // Check if token is blacklisted
    if s.IsTokenBlacklisted(tokenString) {
        return nil, ErrTokenBlacklisted
    }

    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        // Validate signing method
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, ErrInvalidSigningMethod
        }
        return s.accessSecret, nil
    })

    if err != nil {
        if errors.Is(err, jwt.ErrTokenExpired) {
            return nil, ErrTokenExpired
        }
        return nil, fmt.Errorf("failed to parse token: %w", err)
    }

    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, ErrInvalidToken
    }

    return claims, nil
}

// ValidateRefreshToken validates a refresh token
func (s *jwtService) ValidateRefreshToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, ErrInvalidSigningMethod
        }
        return s.refreshSecret, nil
    })

    if err != nil {
        if errors.Is(err, jwt.ErrTokenExpired) {
            return nil, ErrTokenExpired
        }
        return nil, fmt.Errorf("failed to parse refresh token: %w", err)
    }

    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, ErrInvalidToken
    }

    return claims, nil
}

// BlacklistToken adds a token to the blacklist
func (s *jwtService) BlacklistToken(tokenString string) error {
    claims, err := s.ValidateToken(tokenString)
    if err != nil && !errors.Is(err, ErrTokenExpired) {
        return err
    }

    var expiration time.Duration
    if claims != nil && claims.ExpiresAt != nil {
        expiration = time.Until(claims.ExpiresAt.Time)
        if expiration < 0 {
            expiration = s.accessTTL
        }
    } else {
        expiration = s.accessTTL
    }

    // Store in Redis with the remaining TTL
    key := fmt.Sprintf("blacklist:%s", tokenString)
    return s.blacklist.Set(context.Background(), key, true, expiration).Err()
}

// IsTokenBlacklisted checks if a token is in the blacklist
func (s *jwtService) IsTokenBlacklisted(tokenString string) bool {
    key := fmt.Sprintf("blacklist:%s", tokenString)
    exists, err := s.blacklist.Exists(context.Background(), key).Result()
    if err != nil {
        return false // Fail open if Redis is down
    }
    return exists > 0
}

// Helper function to extract bearer token from Authorization header
func ExtractBearerToken(authHeader string) (string, error) {
    if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
        return "", errors.New("invalid authorization header format")
    }
    return authHeader[7:], nil
}