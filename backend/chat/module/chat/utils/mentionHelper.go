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

// ParseMentions extracts @username mentions from message text, including @All
func (mp *MentionParser) ParseMentions(ctx context.Context, messageText string) ([]model.MentionInfo, []string, error) {
	// Regex to match @username pattern (alphanumeric, underscore, hyphen) and @All
	mentionRegex := regexp.MustCompile(`@([a-zA-Z0-9_-]+|All)`)
	matches := mentionRegex.FindAllStringSubmatch(messageText, -1)
	
	if len(matches) == 0 {
		return []model.MentionInfo{}, []string{}, nil
	}

	var mentions []model.MentionInfo
	var userIDs []string
	processedUsernames := make(map[string]bool) // To avoid duplicate mentions
	hasAllMention := false

	for _, match := range matches {
		if len(match) < 2 {
			continue
		}

		username := match[1]
		if processedUsernames[username] {
			continue // Skip duplicate username mentions
		}

		// Check for @All mention
		if strings.EqualFold(username, "All") {
			hasAllMention = true
			mentions = append(mentions, model.MentionInfo{
				UserID:   "all",
				Username: "All",
			})
			userIDs = append(userIDs, "all")
			processedUsernames[username] = true
			continue
		}

		// Look up user by username
		user, err := mp.getUserByUsername(ctx, username)
		if err != nil {
			log.Printf("[MentionParser] User not found for username: %s", username)
			continue // Skip if user not found
		}

		mentions = append(mentions, model.MentionInfo{
			UserID:   user.ID.Hex(),
			Username: user.Username,
		})

		userIDs = append(userIDs, user.ID.Hex())
		processedUsernames[username] = true
	}

	// If @All is mentioned, we don't need individual user mentions
	if hasAllMention {
		// Filter out individual mentions when @All is present
		var allMentions []model.MentionInfo
		var allUserIDs []string
		
		for i, mention := range mentions {
			if mention.UserID == "all" {
				allMentions = append(allMentions, mention)
				allUserIDs = append(allUserIDs, userIDs[i])
			}
		}
		
		return allMentions, allUserIDs, nil
	}

	return mentions, userIDs, nil
}

// ValidateMentionUsers checks if mentioned users exist and are valid
func (mp *MentionParser) ValidateMentionUsers(ctx context.Context, userIDs []string) ([]userModel.User, error) {
	if len(userIDs) == 0 {
		return []userModel.User{}, nil
	}

	// Filter out "all" from userIDs for validation
	var validUserIDs []string
	for _, userID := range userIDs {
		if userID != "all" {
			validUserIDs = append(validUserIDs, userID)
		}
	}

	if len(validUserIDs) == 0 {
		return []userModel.User{}, nil
	}

	objectIDs := make([]primitive.ObjectID, len(validUserIDs))
	for i, userID := range validUserIDs {
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