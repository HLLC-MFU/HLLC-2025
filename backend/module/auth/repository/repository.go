package repository

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	authPb "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto/generated"
	contextDecorator "github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
)

var (
	ErrSessionNotFound = errors.New("session not found")
	ErrSessionExpired = errors.New("session expired")
	ErrSessionInactive = errors.New("session inactive")
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
		
		// Create a new session using the protobuf message type
		session := &authPb.Session{
			Id:        primitive.NewObjectID().Hex(),
			UserId:    userID,
			Token:     token,
			ExpiresAt: expiresAt.Unix(),
			CreatedAt: time.Now().Unix(),
			UpdatedAt: time.Now().Unix(),
			UserAgent: userAgent,
			Ip:        ip,
			IsActive:  true,
		}
		
		// Convert to BSON for MongoDB storage
		sessionDoc := bson.M{
			"_id":        primitive.NewObjectID(),
			"user_id":    session.UserId,
			"token":      session.Token,
			"expires_at": time.Unix(session.ExpiresAt, 0),
			"created_at": time.Unix(session.CreatedAt, 0),
			"updated_at": time.Unix(session.UpdatedAt, 0),
			"user_agent": session.UserAgent,
			"ip":         session.Ip,
			"is_active":  session.IsActive,
		}
		
		_, err := collection.InsertOne(ctx, sessionDoc)
		return struct{}{}, err
	})(ctx)
	return err
}

func (r *authRepository) FindSessionByToken(ctx context.Context, token string) (string, error) {
	var result bson.M
	_, err := contextDecorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("sessions")
		err := collection.FindOne(ctx, bson.M{
			"token": token,
			"is_active": true,
			"expires_at": bson.M{"$gt": time.Now()},
		}).Decode(&result)
		
		if err == mongo.ErrNoDocuments {
			return struct{}{}, ErrSessionNotFound
		}
		return struct{}{}, err
	})(ctx)

	if err != nil {
		return "", err
	}
	
	// Convert BSON document to expected return value
	userID, ok := result["user_id"].(string)
	if !ok {
		return "", errors.New("invalid user ID format in session document")
	}
	
	return userID, nil
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
		
		// Create a refresh token using the protobuf message type
		refreshToken := &authPb.RefreshToken{
			Id:          primitive.NewObjectID().Hex(),
			UserId:      userID,
			Token:       token,
			ExpiresAt:   expiresAt.Unix(),
			LastLoginAt: time.Now().Unix(),
		}
		
		// Convert to BSON for MongoDB storage
		refreshTokenDoc := bson.M{
			"_id":          primitive.NewObjectID(),
			"user_id":      refreshToken.UserId,
			"token":        refreshToken.Token,
			"expires_at":   time.Unix(refreshToken.ExpiresAt, 0),
			"last_login_at": time.Unix(refreshToken.LastLoginAt, 0),
		}
		
		opts := options.Update().SetUpsert(true)
		_, err := collection.UpdateOne(
			ctx,
			bson.M{"user_id": userID},
			bson.M{"$set": refreshTokenDoc},
			opts,
		)
		return struct{}{}, err
	})(ctx)
	return err
}

func (r *authRepository) FindRefreshToken(ctx context.Context, token string) (string, error) {
	var result bson.M
	_, err := contextDecorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("auth_tokens")
		err := collection.FindOne(ctx, bson.M{
			"token": token,
			"expires_at": bson.M{"$gt": time.Now()},
		}).Decode(&result)
		
		if err == mongo.ErrNoDocuments {
			return struct{}{}, ErrSessionNotFound
		}
		return struct{}{}, err
	})(ctx)
	
	if err != nil {
		return "", err
	}
	
	// Convert BSON document to expected return value
	userID, ok := result["user_id"].(string)
	if !ok {
		return "", errors.New("invalid user ID format in refresh token document")
	}
	
	return userID, nil
}

func (r *authRepository) DeleteRefreshToken(ctx context.Context, userID string) error {
	_, err := contextDecorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("auth_tokens")
		_, err := collection.DeleteOne(ctx, bson.M{"user_id": userID})
		return struct{}{}, err
	})(ctx)
	return err
}