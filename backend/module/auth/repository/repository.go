package repository

import (
	"context"
	"time"

	entity "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/entity"
	contextDecorator "github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type (

	AuthRepositoryService interface {
		StoreRefreshToken (ctx context.Context, auth *entity.Auth) error 
		FindRefreshToken (ctx context.Context, token string) (*entity.Auth, error)
		DeleteRefreshToken(ctx context.Context, userID string) error
	}

	authRepository struct {
		db *mongo.Client
	}
)

func NewAuthRepository(db *mongo.Client) AuthRepositoryService {
	return &authRepository{
		db: db,
	}
}

func (r *authRepository) authDbConnect(ctx context.Context) *mongo.Database {
    return r.db.Database("hllc-2025")
}

func (r *authRepository) StoreRefreshToken(ctx context.Context, auth *entity.Auth) error {
    return contextDecorator.WithTimeout(10*time.Second)(func(ctx context.Context) error {
        collection := r.authDbConnect(ctx).Collection("users")
        
        update := bson.M{
            "$set": bson.M{
                "refresh_token": auth.RefreshToken,
                "expires_at": auth.ExpiresAt,
                "last_login_at": time.Now(),
                "updated_at": time.Now(),
            },
        }
        
        _, err := collection.UpdateOne(
            ctx,
            bson.M{"_id": auth.UserId},
            update,
        )
        return err
    })(ctx)
}

func (r *authRepository) FindRefreshToken(ctx context.Context, token string) (*entity.Auth, error) {
    var auth entity.Auth
    err := contextDecorator.WithTimeout(10*time.Second)(func(ctx context.Context) error {
        collection := r.authDbConnect(ctx).Collection("users")
        return collection.FindOne(ctx, bson.M{
            "refresh_token": token,
            "expires_at": bson.M{"$gt": time.Now()},
        }).Decode(&auth)
    })(ctx)
    
    if err != nil {
        return nil, err
    }
    return &auth, nil
}

func (r *authRepository) DeleteRefreshToken(ctx context.Context, userID string) error {
    return contextDecorator.WithTimeout(10*time.Second)(func(ctx context.Context) error {
        collection := r.authDbConnect(ctx).Collection("users")
        
        update := bson.M{
            "$set": bson.M{
                "refresh_token": nil,
                "expires_at": nil,
                "updated_at": time.Now(),
            },
        }
        
        _, err := collection.UpdateOne(
            ctx,
            bson.M{"_id": userID},
            update,
        )
        return err
    })(ctx)
}

func (r *authRepository) FindByUsername(ctx context.Context, username string) (*entity.Auth, error) {
    var auth entity.Auth
    err := contextDecorator.WithTimeout(10*time.Second)(func(ctx context.Context) error {
        collection := r.authDbConnect(ctx).Collection("users")
        return collection.FindOne(ctx, bson.M{"username": username}).Decode(&auth)
    })(ctx)
    
    if err != nil {
        return nil, err
    }
    return &auth, nil
}

func (r *authRepository) UpdateRefreshToken(ctx context.Context, userID string, refreshToken string) error {
    return contextDecorator.WithTimeout(10*time.Second)(func(ctx context.Context) error {
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
        return err
    })(ctx)
}