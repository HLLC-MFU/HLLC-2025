package repository

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	contextDecorator "github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
)

var (
	ErrSessionNotFound = errors.New("session not found")
	ErrSessionExpired = errors.New("session expired")
	ErrSessionInactive = errors.New("session inactive")
)

// MongoDB document structures
type (
	refreshToken struct {
		ID           primitive.ObjectID `bson:"_id,omitempty"`
		UserID       string            `bson:"user_id"`
		Token        string            `bson:"token"`
		ExpiresAt    time.Time         `bson:"expires_at"`
		LastLoginAt  time.Time         `bson:"last_login_at"`
	}

	session struct {
		ID        primitive.ObjectID `bson:"_id,omitempty"`
		UserID    string            `bson:"user_id"`
		Token     string            `bson:"token"`
		ExpiresAt time.Time         `bson:"expires_at"`
		CreatedAt time.Time         `bson:"created_at"`
		UpdatedAt time.Time         `bson:"updated_at"`
		UserAgent string            `bson:"user_agent"`
		IP        string            `bson:"ip"`
		IsActive  bool              `bson:"is_active"`
	}
)

// Repository interface
type AuthRepositoryService interface {
	// Session management
	CreateSession(ctx context.Context, userID, token string, expiresAt time.Time, userAgent, ip string) error
	FindSessionByToken(ctx context.Context, token string) (string, error) // returns userID
	DeactivateSession(ctx context.Context, token string) error
	DeactivateAllUserSessions(ctx context.Context, userID string) error
	CleanupExpiredSessions(ctx context.Context) error

	// Refresh token management
	StoreRefreshToken(ctx context.Context, token, userID string, expiresAt time.Time) error
	FindRefreshToken(ctx context.Context, token string) (string, error) // returns userID
	DeleteRefreshToken(ctx context.Context, userID string) error
}

type authRepository struct {
	db *mongo.Client
}

func NewAuthRepository(db *mongo.Client) AuthRepositoryService {
	return &authRepository{
		db: db,
	}
}

func (r *authRepository) authDbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *authRepository) CreateSession(ctx context.Context, userID, token string, expiresAt time.Time, userAgent, ip string) error {
	_, err := contextDecorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("sessions")
		
		session := &session{
			UserID:    userID,
			Token:     token,
			ExpiresAt: expiresAt,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			UserAgent: userAgent,
			IP:        ip,
			IsActive:  true,
		}
		
		_, err := collection.InsertOne(ctx, session)
		return struct{}{}, err
	})(ctx)
	return err
}

func (r *authRepository) FindSessionByToken(ctx context.Context, token string) (string, error) {
	var session session
	_, err := contextDecorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("sessions")
		err := collection.FindOne(ctx, bson.M{
			"token": token,
			"is_active": true,
			"expires_at": bson.M{"$gt": time.Now()},
		}).Decode(&session)
		
		if err == mongo.ErrNoDocuments {
			return struct{}{}, ErrSessionNotFound
		}
		return struct{}{}, err
	})(ctx)

	if err != nil {
		return "", err
	}
	return session.UserID, nil
}

func (r *authRepository) DeactivateSession(ctx context.Context, token string) error {
	_, err := contextDecorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("sessions")
		_, err := collection.UpdateOne(
			ctx,
			bson.M{"token": token},
			bson.M{
				"$set": bson.M{
					"is_active": false,
					"updated_at": time.Now(),
				},
			},
		)
		return struct{}{}, err
	})(ctx)
	return err
}

func (r *authRepository) DeactivateAllUserSessions(ctx context.Context, userID string) error {
	_, err := contextDecorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("sessions")
		_, err := collection.UpdateMany(
			ctx,
			bson.M{"user_id": userID, "is_active": true},
			bson.M{
				"$set": bson.M{
					"is_active": false,
					"updated_at": time.Now(),
				},
			},
		)
		return struct{}{}, err
	})(ctx)
	return err
}

func (r *authRepository) CleanupExpiredSessions(ctx context.Context) error {
	_, err := contextDecorator.WithTimeout[struct{}](30*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("sessions")
		_, err := collection.DeleteMany(
			ctx,
			bson.M{"expires_at": bson.M{"$lt": time.Now()}},
		)
		return struct{}{}, err
	})(ctx)
	return err
}

func (r *authRepository) StoreRefreshToken(ctx context.Context, token, userID string, expiresAt time.Time) error {
	_, err := contextDecorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("auth_tokens")
		
		refreshToken := &refreshToken{
			UserID:      userID,
			Token:       token,
			ExpiresAt:   expiresAt,
			LastLoginAt: time.Now(),
		}
		
		opts := options.Update().SetUpsert(true)
		_, err := collection.UpdateOne(
			ctx,
			bson.M{"user_id": userID},
			bson.M{"$set": refreshToken},
			opts,
		)
		return struct{}{}, err
	})(ctx)
	return err
}

func (r *authRepository) FindRefreshToken(ctx context.Context, token string) (string, error) {
	var rt refreshToken
	_, err := contextDecorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("auth_tokens")
		err := collection.FindOne(ctx, bson.M{
			"token": token,
			"expires_at": bson.M{"$gt": time.Now()},
		}).Decode(&rt)
		
		if err == mongo.ErrNoDocuments {
			return struct{}{}, ErrSessionNotFound
		}
		return struct{}{}, err
	})(ctx)
	
	if err != nil {
		return "", err
	}
	return rt.UserID, nil
}

func (r *authRepository) DeleteRefreshToken(ctx context.Context, userID string) error {
	_, err := contextDecorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("auth_tokens")
		_, err := collection.DeleteOne(ctx, bson.M{"user_id": userID})
		return struct{}{}, err
	})(ctx)
	return err
}