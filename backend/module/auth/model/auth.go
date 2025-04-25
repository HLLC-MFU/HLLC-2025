package auth

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

/**
 * Auth represents the auth domain entity
 * Implements: MongoDB document for auth collection
 * Used by: AuthRepository, AuthService
 */

type (
	Auth struct {
		ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		UserId       string             `bson:"user_id" json:"user_id"`
		RefreshToken string             `bson:"refresh_token" json:"refresh_token"`
		ExpiresAt    time.Time          `bson:"expires_at" json:"expires_at"`
		LastLoginAt  time.Time          `bson:"last_login_at" json:"last_login_at"`
	}

	Session struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		UserID    string            `bson:"user_id" json:"user_id"`
		Token     string            `bson:"token" json:"token"`
		ExpiresAt time.Time         `bson:"expires_at" json:"expires_at"`
		CreatedAt time.Time         `bson:"created_at" json:"created_at"`
		UpdatedAt time.Time         `bson:"updated_at" json:"updated_at"`
		UserAgent string            `bson:"user_agent" json:"user_agent"`
		IP        string            `bson:"ip" json:"ip"`
		IsActive  bool              `bson:"is_active" json:"is_active"`
	}

	RefreshToken struct {
		ID           primitive.ObjectID `bson:"_id,omitempty"`
		UserID       string            `bson:"user_id"`
		Token        string            `bson:"token"`
		ExpiresAt    time.Time         `bson:"expires_at"`
		LastLoginAt  time.Time         `bson:"last_login_at"`
	}

	SessionCookie struct {
		Name     string
		Value    string
		MaxAge   int
		Path     string
		Domain   string
		Secure   bool
		HttpOnly bool
		SameSite string
	}
)