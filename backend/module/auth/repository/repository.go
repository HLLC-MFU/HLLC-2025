package repository

import (
	"context"
	"errors"
	"time"

	entity "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/entity"
	contextDecorator "github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ErrSessionNotFound = errors.New("session not found")
	ErrSessionExpired = errors.New("session expired")
	ErrSessionInactive = errors.New("session inactive")
)

type (
	AuthRepository interface {
		CreateSession(ctx context.Context, session *entity.Session) error
		FindSessionByID(ctx context.Context, id primitive.ObjectID) (*entity.Session, error)
		FindSessionByToken(ctx context.Context, token string) (*entity.Session, error)
		UpdateSession(ctx context.Context, session *entity.Session) error
		DeactivateSession(ctx context.Context, id primitive.ObjectID) error
		DeactivateAllUserSessions(ctx context.Context, userID string) error
		CleanupExpiredSessions(ctx context.Context) error
		StoreRefreshToken(ctx context.Context, auth *entity.Auth) error
		FindRefreshToken(ctx context.Context, token string) (*entity.Auth, error)
		DeleteRefreshToken(ctx context.Context, userID string) error
	}

	AuthRepositoryService interface {
		StoreRefreshToken (ctx context.Context, auth *entity.Auth) error 
		FindRefreshToken (ctx context.Context, token string) (*entity.Auth, error)
		DeleteRefreshToken(ctx context.Context, userID string) error
	}

	authRepository struct {
		db *mongo.Client
	}
)

func NewAuthRepository(db *mongo.Client) AuthRepository {
	return &authRepository{
		db: db,
	}
}

func (r *authRepository) authDbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *authRepository) CreateSession(ctx context.Context, session *entity.Session) error {
	_, err := contextDecorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("sessions")
		_, err := collection.InsertOne(ctx, session)
		return struct{}{}, err
	})(ctx)
	return err
}

func (r *authRepository) FindSessionByID(ctx context.Context, id primitive.ObjectID) (*entity.Session, error) {
	var session entity.Session
	_, err := contextDecorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("sessions")
		err := collection.FindOne(ctx, bson.M{
			"_id": id,
			"is_active": true,
			"expires_at": bson.M{"$gt": time.Now()},
		}).Decode(&session)
		
		if err == mongo.ErrNoDocuments {
			return struct{}{}, ErrSessionNotFound
		}
		return struct{}{}, err
	})(ctx)

	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *authRepository) FindSessionByToken(ctx context.Context, token string) (*entity.Session, error) {
	var session entity.Session
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
		return nil, err
	}
	return &session, nil
}

func (r *authRepository) UpdateSession(ctx context.Context, session *entity.Session) error {
	_, err := contextDecorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("sessions")
		session.UpdatedAt = time.Now()
		
		_, err := collection.UpdateOne(
			ctx,
			bson.M{"_id": session.ID},
			bson.M{"$set": session},
		)
		return struct{}{}, err
	})(ctx)
	return err
}

func (r *authRepository) DeactivateSession(ctx context.Context, id primitive.ObjectID) error {
	_, err := contextDecorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("sessions")
		_, err := collection.UpdateOne(
			ctx,
			bson.M{"_id": id},
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

func (r *authRepository) StoreRefreshToken(ctx context.Context, auth *entity.Auth) error {
	_, err := contextDecorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("auth_tokens")
		
		update := bson.M{
			"$set": bson.M{
				"refresh_token": auth.RefreshToken,
				"expires_at":    auth.ExpiresAt,
				"user_id":       auth.UserId,
				"updated_at":    time.Now(),
			},
		}
		
		opts := options.Update().SetUpsert(true)
		_, err := collection.UpdateOne(
			ctx,
			bson.M{"user_id": auth.UserId},
			update,
			opts,
		)
		return struct{}{}, err
	})(ctx)
	return err
}

func (r *authRepository) FindRefreshToken(ctx context.Context, token string) (*entity.Auth, error) {
	var auth entity.Auth
	_, err := contextDecorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("auth_tokens")
		err := collection.FindOne(ctx, bson.M{
			"refresh_token": token,
			"expires_at": bson.M{"$gt": time.Now()},
		}).Decode(&auth)
		
		if err == mongo.ErrNoDocuments {
			return struct{}{}, ErrSessionNotFound
		}
		return struct{}{}, err
	})(ctx)
	
	if err != nil {
		return nil, err
	}
	return &auth, nil
}

func (r *authRepository) DeleteRefreshToken(ctx context.Context, userID string) error {
	_, err := contextDecorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("auth_tokens")
		_, err := collection.DeleteOne(ctx, bson.M{"user_id": userID})
		return struct{}{}, err
	})(ctx)
	return err
}

func (r *authRepository) FindByUsername(ctx context.Context, username string) (*entity.Auth, error) {
	var auth entity.Auth
	_, err := contextDecorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("users")
		err := collection.FindOne(ctx, bson.M{"username": username}).Decode(&auth)
		return struct{}{}, err
	})(ctx)
	
	if err != nil {
		return nil, err
	}
	return &auth, nil
}

func (r *authRepository) UpdateRefreshToken(ctx context.Context, userID string, refreshToken string) error {
	_, err := contextDecorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.authDbConnect(ctx).Collection("users")
		
		update := bson.M{
			"$set": bson.M{
				"refresh_token": refreshToken,
				"expires_at": time.Now().Add(7 * 24 * time.Hour), // 7 days
				"last_login_at": time.Now(),
				"updated_at": time.Now(),
			},
		}
		
		_, err := collection.UpdateOne(
			ctx,
			bson.M{"_id": userID},
			update,
		)
		return struct{}{}, err
	})(ctx)
	return err
}