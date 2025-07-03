package utils

import (
	"chat/module/chat/model"
	userModel "chat/module/user/model"
	"context"
	"fmt"
	"log"
	"regexp"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// MentionParser handles mention parsing and validation
type MentionParser struct {
	mongo *mongo.Database
}

func NewMentionParser(mongo *mongo.Database) *MentionParser {
	return &MentionParser{
		mongo: mongo,
	}
}

// ParseMentions extracts @username mentions from message text
func (mp *MentionParser) ParseMentions(ctx context.Context, messageText string) ([]model.MentionInfo, []string, error) {
	// Regex to match @username pattern (alphanumeric, underscore, hyphen)
	mentionRegex := regexp.MustCompile(`@([a-zA-Z0-9_-]+)`)
	matches := mentionRegex.FindAllStringSubmatch(messageText, -1)
	
	if len(matches) == 0 {
		return []model.MentionInfo{}, []string{}, nil
	}

	var mentions []model.MentionInfo
	var userIDs []string
	processedUsernames := make(map[string]bool) // To avoid duplicate mentions

	for _, match := range matches {
		if len(match) < 2 {
			continue
		}

		username := match[1]
		if processedUsernames[username] {
			continue // Skip duplicate username mentions
		}

		// Find position of this mention in the text
		position := strings.Index(messageText, "@"+username)
		
		// Look up user by username
		user, err := mp.getUserByUsername(ctx, username)
		if err != nil {
			log.Printf("[MentionParser] User not found for username: %s", username)
			continue // Skip if user not found
		}

		mentions = append(mentions, model.MentionInfo{
			UserID:   user.ID.Hex(),
			Username: user.Username,
			Position: position,
			Length:   len("@" + username),
		})

		userIDs = append(userIDs, user.ID.Hex())
		processedUsernames[username] = true
	}

	return mentions, userIDs, nil
}

// ValidateMentionUsers checks if mentioned users exist and are valid
func (mp *MentionParser) ValidateMentionUsers(ctx context.Context, userIDs []string) ([]userModel.User, error) {
	if len(userIDs) == 0 {
		return []userModel.User{}, nil
	}

	objectIDs := make([]primitive.ObjectID, len(userIDs))
	for i, userID := range userIDs {
		objID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			return nil, fmt.Errorf("invalid user ID: %s", userID)
		}
		objectIDs[i] = objID
	}

	cursor, err := mp.mongo.Collection("users").Find(ctx, bson.M{
		"_id": bson.M{"$in": objectIDs},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to find users: %w", err)
	}
	defer cursor.Close(ctx)

	var users []userModel.User
	if err = cursor.All(ctx, &users); err != nil {
		return nil, fmt.Errorf("failed to decode users: %w", err)
	}

	return users, nil
}
// getUserByUsername finds a user by username
func (mp *MentionParser) getUserByUsername(ctx context.Context, username string) (*userModel.User, error) {
	var user userModel.User
	err := mp.mongo.Collection("users").FindOne(ctx, bson.M{
		"username": username,
	}).Decode(&user)
	
	if err != nil {
		return nil, err
	}
	
	return &user, nil
} 