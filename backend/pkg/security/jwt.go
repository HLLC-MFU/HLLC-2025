// backend/pkg/security/jwt.go
package security

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/grpc/metadata"
)

var (
	ErrInvalidToken        = errors.New("invalid token")
	ErrTokenExpired       = errors.New("token has expired")
	ErrTokenBlacklisted   = errors.New("token has been blacklisted")
	ErrInvalidSigningMethod = errors.New("invalid signing method")
)

type (
	AuthFactory interface {
		SignToken() string
	}

	Claims struct {
		UserID   string   `json:"user_id"`
		Username string   `json:"username"`
		RoleCode int      `json:"role_code"`
		jwt.RegisteredClaims
	}

	authConcrete struct {
		Secret []byte
		Claims *Claims
	}

	accessToken  struct{ *authConcrete }
	refreshToken struct{ *authConcrete }
	apiKey      struct{ *authConcrete }
)

func now() time.Time {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	return time.Now().In(loc)
}

func jwtTimeDurationCal(t int64) *jwt.NumericDate {
	return jwt.NewNumericDate(now().Add(time.Duration(t * int64(math.Pow10(9)))))
}

func jwtTimeRepeatAdapter(t int64) *jwt.NumericDate {
	return jwt.NewNumericDate(time.Unix(t, 0))
}

func (a *authConcrete) SignToken() string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, a.Claims)
	ss, _ := token.SignedString(a.Secret)
	return ss
}

func NewAccessToken(secret string, expiredAt int64, claims *Claims) AuthFactory {
	claims.RegisteredClaims = jwt.RegisteredClaims{
		Issuer:    "hllc-2025.com",
		Subject:   "access-token",
		Audience:  []string{"hllc-2025.com"},
		ExpiresAt: jwtTimeDurationCal(expiredAt),
		NotBefore: jwt.NewNumericDate(now()),
		IssuedAt:  jwt.NewNumericDate(now()),
	}
	
	return &accessToken{
		authConcrete: &authConcrete{
			Secret: []byte(secret),
			Claims: claims,
		},
	}
}

func NewRefreshToken(secret string, expiredAt int64, claims *Claims) AuthFactory {
	claims.RegisteredClaims = jwt.RegisteredClaims{
		Issuer:    "hllc-2025.com",
		Subject:   "refresh-token",
		Audience:  []string{"hllc-2025.com"},
		ExpiresAt: jwtTimeDurationCal(expiredAt),
		NotBefore: jwt.NewNumericDate(now()),
		IssuedAt:  jwt.NewNumericDate(now()),
	}
	
	return &refreshToken{
		authConcrete: &authConcrete{
			Secret: []byte(secret),
			Claims: claims,
		},
	}
}

func ReloadToken(secret string, expiredAt int64, claims *Claims) string {
	claims.RegisteredClaims = jwt.RegisteredClaims{
		Issuer:    "hllc-2025.com",
		Subject:   "refresh-token",
		Audience:  []string{"hllc-2025.com"},
		ExpiresAt: jwtTimeRepeatAdapter(expiredAt),
		NotBefore: jwt.NewNumericDate(now()),
		IssuedAt:  jwt.NewNumericDate(now()),
	}
	
	obj := &refreshToken{
		authConcrete: &authConcrete{
			Secret: []byte(secret),
			Claims: claims,
		},
	}

	return obj.SignToken()
}

func ParseToken(secret string, tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidSigningMethod
		}
		return []byte(secret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenMalformed) {
			return nil, fmt.Errorf("token format is invalid: %w", err)
		} else if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, fmt.Errorf("token is invalid: %w", err)
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, ErrInvalidToken
}

// API Key management
var (
	apiKeyInstance string
	apiKeyOnce sync.Once
)

func SetApiKey(secret string) {
	apiKeyOnce.Do(func() {
		claims := &Claims{}
		claims.RegisteredClaims = jwt.RegisteredClaims{
			Issuer:    "hllc-2025.com",
			Subject:   "api-key",
			Audience:  []string{"hllc-2025.com"},
			ExpiresAt: jwtTimeDurationCal(31560000), // 1 year
			NotBefore: jwt.NewNumericDate(now()),
			IssuedAt:  jwt.NewNumericDate(now()),
		}
		
		apiKey := &apiKey{
			authConcrete: &authConcrete{
				Secret: []byte(secret),
				Claims: claims,
			},
		}
		apiKeyInstance = apiKey.SignToken()
	})
}

func SetApiKeyInContext(pctx *context.Context) {
	*pctx = metadata.NewOutgoingContext(*pctx, metadata.Pairs("auth", apiKeyInstance))
}

// ExtractBearerToken extracts the token from Authorization header
func ExtractBearerToken(authHeader string) (string, error) {
	if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		return "", errors.New("invalid authorization header format")
	}
	return authHeader[7:], nil
}