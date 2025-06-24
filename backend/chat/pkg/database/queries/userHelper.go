package queries

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserInfo struct {
	ID       primitive.ObjectID `bson:"_id" json:"_id"`
	Username string            `bson:"username" json:"username"`
	Name     struct {
		First string `bson:"first" json:"first"`
		Last  string `bson:"last" json:"last"`
	} `bson:"name" json:"name"`
}

// GetEnrichedUserInfo fetches user information from MongoDB and returns it in a structured format
func GetEnrichedUserInfo(ctx context.Context, db *mongo.Database, userID primitive.ObjectID) (map[string]interface{}, error) {
	var user UserInfo
	err := db.Collection("users").FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		log.Printf("[WARN] Failed to get user details: %v", err)
		return nil, err
	}

	return map[string]interface{}{
		"_id":      user.ID.Hex(),
		"username": user.Username,
		"name":     user.Name,
	}, nil
}

// GetEnrichedUserInfoWithFallback fetches user information but falls back to userID if not found
func GetEnrichedUserInfoWithFallback(ctx context.Context, db *mongo.Database, userID primitive.ObjectID) interface{} {
	enriched, err := GetEnrichedUserInfo(ctx, db, userID)
	if err != nil {
		// Fallback to just the user ID if we can't get user details
		return userID.Hex()
	}
	return enriched
}

// GetEnrichedUserInfoBatch fetches user information for multiple users at once
func GetEnrichedUserInfoBatch(ctx context.Context, db *mongo.Database, userIDs []primitive.ObjectID) (map[string]interface{}, error) {
	var users []UserInfo
	cursor, err := db.Collection("users").Find(ctx, bson.M{
		"_id": bson.M{"$in": userIDs},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err := cursor.All(ctx, &users); err != nil {
		return nil, err
	}

	result := make(map[string]interface{})
	for _, user := range users {
		result[user.ID.Hex()] = map[string]interface{}{
			"_id":      user.ID.Hex(),
			"username": user.Username,
			"name":     user.Name,
		}
	}

	return result, nil
} 