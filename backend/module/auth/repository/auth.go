package repository

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	authPb "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
)

// --- Constants ---
const (
	collectionSessions   = "sessions"
	collectionAuthTokens = "auth_tokens"
)

// AuthRepositoryService defines auth-specific operations
type (
	AuthRepositoryService interface {
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

	authRepository struct {
		db *mongo.Client
	}
)

// NewAuthRepository creates a new auth repository instance
func NewAuthRepository(db *mongo.Client) AuthRepositoryService {
	return &authRepository{db: db}
}

func (r *authRepository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *authRepository) sessionsColl(ctx context.Context) *mongo.Collection {
	return r.dbConnect(ctx).Collection(collectionSessions)
}

func (r *authRepository) authTokensColl(ctx context.Context) *mongo.Collection {
	return r.dbConnect(ctx).Collection(collectionAuthTokens)
}

// CreateSession creates a new user session with proper error handling and logging
func (r *authRepository) CreateSession(ctx context.Context, userID, token string, expiresAt time.Time, userAgent, ip string) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating session",
			logging.FieldOperation, "create_session",
			logging.FieldEntity, "session",
			logging.FieldEntityID, userID,
		)

		collection := r.sessionsColl(ctx)
		
		// Create a new session using the protobuf message type
		sessionID := primitive.NewObjectID()
		session := &authPb.Session{
			Id:        sessionID.Hex(),
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
		sessionDoc := createSessionDoc(session)
		
		_, err := collection.InsertOne(ctx, sessionDoc)
		if err != nil {
			logger.Error("Failed to create session", err,
				logging.FieldOperation, "create_session",
				logging.FieldEntity, "session",
				logging.FieldEntityID, userID,
			)
			return struct{}{}, exceptions.Internal("failed to create session", err)
		}

		logger.Info("Session created successfully",
			logging.FieldOperation, "create_session",
			logging.FieldEntity, "session",
			logging.FieldEntityID, userID,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// FindSessionByToken finds a session by token with proper error handling and logging
func (r *authRepository) FindSessionByToken(ctx context.Context, token string) (string, error) {
	return decorator.WithTimeout[string](5*time.Second)(func(ctx context.Context) (string, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding session by token",
			logging.FieldOperation, "find_session",
			logging.FieldEntity, "session",
		)

		collection := r.sessionsColl(ctx)
		
		var result bson.M
		err := collection.FindOne(ctx, bson.M{
			"token": token,
			"is_active": true,
			"expires_at": bson.M{"$gt": time.Now()},
		}).Decode(&result)
		
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("Session not found",
					logging.FieldOperation, "find_session",
					logging.FieldEntity, "session",
				)
				return "", exceptions.NotFound("session", "token", nil)
			}
			
			logger.Error("Error finding session", err,
				logging.FieldOperation, "find_session",
				logging.FieldEntity, "session",
			)
			return "", exceptions.Internal("error finding session", err)
		}
		
		// Convert BSON document to expected return value
		userID, ok := result["user_id"].(string)
		if !ok {
			logger.Error("Invalid user ID format in session document", nil,
				logging.FieldOperation, "find_session",
				logging.FieldEntity, "session",
			)
			return "", exceptions.Internal("invalid user ID format in session document", nil)
		}
		
		logger.Info("Session found",
			logging.FieldOperation, "find_session",
			logging.FieldEntity, "session",
			logging.FieldEntityID, userID,
		)
		
		return userID, nil
	})(ctx)
}

// DeactivateSession deactivates a session with proper error handling and logging
func (r *authRepository) DeactivateSession(ctx context.Context, token string) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deactivating session",
			logging.FieldOperation, "deactivate_session",
			logging.FieldEntity, "session",
		)

		collection := r.sessionsColl(ctx)
		
		result, err := collection.UpdateOne(
			ctx,
			bson.M{"token": token},
			bson.M{
				"$set": bson.M{
					"is_active": false,
					"updated_at": time.Now(),
				},
			},
		)
		
		if err != nil {
			logger.Error("Error deactivating session", err,
				logging.FieldOperation, "deactivate_session",
				logging.FieldEntity, "session",
			)
			return struct{}{}, exceptions.Internal("error deactivating session", err)
		}
		
		if result.MatchedCount == 0 {
			logger.Warn("No session found to deactivate",
				logging.FieldOperation, "deactivate_session",
				logging.FieldEntity, "session",
			)
			return struct{}{}, exceptions.NotFound("session", "token", nil)
		}
		
		logger.Info("Session deactivated successfully",
			logging.FieldOperation, "deactivate_session",
			logging.FieldEntity, "session",
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// DeactivateAllUserSessions deactivates all sessions for a user with proper error handling and logging
func (r *authRepository) DeactivateAllUserSessions(ctx context.Context, userID string) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deactivating all user sessions",
			logging.FieldOperation, "deactivate_all_sessions",
			logging.FieldEntity, "session",
			logging.FieldEntityID, userID,
		)

		collection := r.sessionsColl(ctx)
		
		result, err := collection.UpdateMany(
			ctx,
			bson.M{"user_id": userID, "is_active": true},
			bson.M{
				"$set": bson.M{
					"is_active": false,
					"updated_at": time.Now(),
				},
			},
		)
		
		if err != nil {
			logger.Error("Error deactivating all user sessions", err,
				logging.FieldOperation, "deactivate_all_sessions",
				logging.FieldEntity, "session",
				logging.FieldEntityID, userID,
			)
			return struct{}{}, exceptions.Internal("error deactivating all user sessions", err)
		}
		
		logger.Info("All user sessions deactivated successfully",
			logging.FieldOperation, "deactivate_all_sessions",
			logging.FieldEntity, "session",
			logging.FieldEntityID, userID,
			"count", result.ModifiedCount,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// CleanupExpiredSessions removes expired sessions with proper error handling and logging
func (r *authRepository) CleanupExpiredSessions(ctx context.Context) error {
	_, err := decorator.WithTimeout[struct{}](30*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Cleaning up expired sessions",
			logging.FieldOperation, "cleanup_sessions",
			logging.FieldEntity, "session",
		)

		collection := r.sessionsColl(ctx)
		
		result, err := collection.DeleteMany(
			ctx,
			bson.M{"expires_at": bson.M{"$lt": time.Now()}},
		)
		
		if err != nil {
			logger.Error("Error cleaning up expired sessions", err,
				logging.FieldOperation, "cleanup_sessions",
				logging.FieldEntity, "session",
			)
			return struct{}{}, exceptions.Internal("error cleaning up expired sessions", err)
		}
		
		logger.Info("Expired sessions cleaned up successfully",
			logging.FieldOperation, "cleanup_sessions",
			logging.FieldEntity, "session",
			"count", result.DeletedCount,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// StoreRefreshToken stores a refresh token with proper error handling and logging
func (r *authRepository) StoreRefreshToken(ctx context.Context, token, userID string, expiresAt time.Time) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Storing refresh token",
			logging.FieldOperation, "store_refresh_token",
			logging.FieldEntity, "refresh_token",
			logging.FieldUserID, userID,
			"token_length", len(token),
			"expires_at", expiresAt.Format(time.RFC3339),
		)

		// Debug log database connection details
		db := r.dbConnect(ctx)
		collection := r.authTokensColl(ctx)
		logger.Debug("Database connection details",
			logging.FieldOperation, "store_refresh_token",
			"database_name", db.Name(),
			"collection_name", collection.Name(),
		)

		// Check if a refresh token already exists for this user
		var existingToken bson.M
		err := collection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&existingToken)
		
		id := primitive.NewObjectID()
		now := time.Now()
		
		if err == nil {
			// Update existing token
			logger.Info("Updating existing refresh token",
				logging.FieldOperation, "store_refresh_token",
				logging.FieldEntity, "refresh_token",
				logging.FieldUserID, userID,
				"token_id", existingToken["id"],
			)
			
			result, err := collection.UpdateOne(
				ctx,
				bson.M{"user_id": userID},
				bson.M{
					"$set": bson.M{
						"refreshToken":   token,
						"expires_at":    expiresAt,
						"last_login_at": now,
					},
				},
			)
			
			if err != nil {
				logger.Error("Failed to update refresh token", err,
					logging.FieldOperation, "store_refresh_token",
					logging.FieldEntity, "refresh_token",
					logging.FieldUserID, userID,
				)
				return struct{}{}, exceptions.Internal("failed to update refresh token: "+err.Error(), err)
			}
			
			logger.Info("Successfully updated refresh token",
				logging.FieldOperation, "store_refresh_token", 
				logging.FieldEntity, "refresh_token",
				logging.FieldUserID, userID,
				"matched_count", result.MatchedCount,
				"modified_count", result.ModifiedCount,
			)
			
			return struct{}{}, nil
		}
		
		// Create new token since one doesn't exist
		if errors.Is(err, mongo.ErrNoDocuments) {
			logger.Info("Creating new refresh token",
				logging.FieldOperation, "store_refresh_token",
				logging.FieldEntity, "refresh_token",
				logging.FieldUserID, userID,
			)
			
			newToken := &authPb.RefreshToken{
				Id:          id.Hex(),
				UserId:      userID,
				Token:       token,
				ExpiresAt:   expiresAt.Unix(),
				LastLoginAt: now.Unix(),
			}
			
			doc := createRefreshTokenDoc(newToken)
			
			result, err := collection.InsertOne(ctx, doc)
			if err != nil {
				logger.Error("Failed to insert refresh token", err,
					logging.FieldOperation, "store_refresh_token",
					logging.FieldEntity, "refresh_token",
					logging.FieldUserID, userID,
				)
				return struct{}{}, exceptions.Internal("failed to insert refresh token: "+err.Error(), err)
			}
			
			logger.Info("Successfully inserted refresh token",
				logging.FieldOperation, "store_refresh_token",
				logging.FieldEntity, "refresh_token", 
				logging.FieldUserID, userID,
				"inserted_id", result.InsertedID,
			)
			
			return struct{}{}, nil
		}
		
		logger.Error("Failed to check existing refresh token", err,
			logging.FieldOperation, "store_refresh_token",
			logging.FieldEntity, "refresh_token",
			logging.FieldUserID, userID,
		)
		
		return struct{}{}, exceptions.Internal("failed to check existing refresh token: "+err.Error(), err)
	})(ctx)
	
	return err
}

// FindRefreshToken finds a refresh token with proper error handling and logging
func (r *authRepository) FindRefreshToken(ctx context.Context, token string) (string, error) {
	var userID string
	
	_, findErr := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		
		logger.Info("Finding refresh token",
			logging.FieldOperation, "find_refresh_token",
			logging.FieldEntity, "refresh_token",
			"token_length", len(token),
		)
		
		collection := r.authTokensColl(ctx)
		
		var tokenDoc bson.M
		err := collection.FindOne(ctx, bson.M{"refreshToken": token}).Decode(&tokenDoc)
		if err != nil {
			if errors.Is(err, mongo.ErrNoDocuments) {
				logger.Warn("Refresh token not found",
					logging.FieldOperation, "find_refresh_token",
					logging.FieldEntity, "refresh_token",
				)
				return struct{}{}, exceptions.NotFound("refresh token", "token", err)
			}
			
			logger.Error("Failed to find refresh token", err,
				logging.FieldOperation, "find_refresh_token",
				logging.FieldEntity, "refresh_token",
			)
			return struct{}{}, exceptions.Internal("failed to find refresh token: "+err.Error(), err)
		}
		
		// Check if token has expired
		expiresAt, ok := tokenDoc["expires_at"].(primitive.DateTime)
		if ok {
			expiresTime := expiresAt.Time()
			if expiresTime.Before(time.Now()) {
				logger.Warn("Refresh token has expired",
					logging.FieldOperation, "find_refresh_token", 
					logging.FieldEntity, "refresh_token",
					"expires_at", expiresTime.Format(time.RFC3339),
				)
				return struct{}{}, exceptions.Unauthorized("refresh token has expired", nil)
			}
		}
		
		userID, _ = tokenDoc["user_id"].(string)
		
		logger.Info("Refresh token found successfully",
			logging.FieldOperation, "find_refresh_token",
			logging.FieldEntity, "refresh_token",
			logging.FieldUserID, userID,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	if findErr != nil {
		return "", findErr
	}
	
	return userID, nil
}

// DeleteRefreshToken deletes a refresh token with proper error handling and logging
func (r *authRepository) DeleteRefreshToken(ctx context.Context, userID string) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		
		logger.Info("Deleting refresh token",
			logging.FieldOperation, "delete_refresh_token",
			logging.FieldEntity, "refresh_token",
			logging.FieldUserID, userID,
		)
		
		collection := r.authTokensColl(ctx)
		
		result, err := collection.DeleteMany(ctx, bson.M{"user_id": userID})
		if err != nil {
			logger.Error("Failed to delete refresh token", err,
				logging.FieldOperation, "delete_refresh_token",
				logging.FieldEntity, "refresh_token",
				logging.FieldUserID, userID,
			)
			return struct{}{}, exceptions.Internal("failed to delete refresh token: "+err.Error(), err)
		}
		
		if result.DeletedCount == 0 {
			logger.Warn("No refresh tokens found for user",
				logging.FieldOperation, "delete_refresh_token",
				logging.FieldEntity, "refresh_token",
				logging.FieldUserID, userID,
			)
			// Not returning an error since no tokens is not an error condition
		} else {
			logger.Info("Successfully deleted refresh tokens",
				logging.FieldOperation, "delete_refresh_token",
				logging.FieldEntity, "refresh_token",
				logging.FieldUserID, userID,
				"deleted_count", result.DeletedCount,
			)
		}
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}
// --- Helpers ---

func createSessionDoc(session *authPb.Session) bson.M {
	return bson.M{
		"_id":        primitive.NewObjectID(),
		"id":         session.Id,
		"user_id":    session.UserId,
		"token":      session.Token,
		"expires_at": time.Unix(session.ExpiresAt, 0),
		"created_at": time.Unix(session.CreatedAt, 0),
		"updated_at": time.Unix(session.UpdatedAt, 0),
		"user_agent": session.UserAgent,
		"ip":         session.Ip,
		"is_active":  session.IsActive,
	}
}

func createRefreshTokenDoc(token *authPb.RefreshToken) bson.M {
	return bson.M{
		"id":           token.Id,
		"user_id":      token.UserId,
		"refreshToken": token.Token,
		"expires_at":   primitive.NewDateTimeFromTime(time.Unix(token.ExpiresAt, 0)),
		"last_login_at": primitive.NewDateTimeFromTime(time.Unix(token.LastLoginAt, 0)),
	}
}