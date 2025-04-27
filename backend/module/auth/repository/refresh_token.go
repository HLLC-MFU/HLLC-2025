package repository

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// ----------- Entity -----------

type RefreshToken struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	UserID       string             `bson:"user_id"`
	RefreshToken string             `bson:"refresh_token"`
	ExpiresAt    time.Time          `bson:"expires_at"`
	CreatedAt    time.Time          `bson:"created_at"`
	Revoked      bool               `bson:"revoked"`
}

// ----------- Interface -----------

type RefreshTokenRepository interface {
	Save(ctx context.Context, token *RefreshToken) error
	FindByToken(ctx context.Context, token string) (*RefreshToken, error)
	RevokeToken(ctx context.Context, token string) error
}

// ----------- Mongo Implementation -----------

type refreshTokenRepository struct {
	refreshCollection *mongo.Collection
}

// NewRefreshTokenRepository creates a new refresh token repository
func NewRefreshTokenRepository(db *mongo.Database) RefreshTokenRepository {
	return &refreshTokenRepository{
		refreshCollection: db.Collection("refresh_tokens"),
	}
}

func (r *refreshTokenRepository) Save(ctx context.Context, token *RefreshToken) error {
	_, err := r.refreshCollection.InsertOne(ctx, token)
	return err
}

func (r *refreshTokenRepository) FindByToken(ctx context.Context, token string) (*RefreshToken, error) {
	var result RefreshToken
	err := r.refreshCollection.FindOne(ctx, bson.M{
		"refresh_token": token,
		"revoked":       false,
	}).Decode(&result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (r *refreshTokenRepository) RevokeToken(ctx context.Context, token string) error {
	_, err := r.refreshCollection.UpdateOne(ctx, bson.M{"refresh_token": token}, bson.M{
		"$set": bson.M{"revoked": true},
	})
	return err
}
