package auth

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

/**
 * Auth represents the auth domain entity
 * Implements: MongoDB document for auth collection
 * Used by: AuthRepository, AuthService
 *
 * @author Dev. Bengi (Backend Team)
 */

type (

	Auth struct {
		ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		UserId       string             `bson:"user_id" json:"user_id"`
		RefreshToken string             `bson:"refresh_token" json:"refresh_token"`
		ExpiresAt    time.Time         `bson:"expiresAt" json:"expiresAt"`
    	LastLoginAt  time.Time         `bson:"lastLoginAt" json:"lastLoginAt"`
	}
)