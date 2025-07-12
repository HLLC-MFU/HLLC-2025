package utils

import (
	"chat/module/chat/model"
	userModel "chat/module/user/model"
	"chat/pkg/database/queries"
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// UserInfoService handles user information retrieval and processing
type UserInfoService struct {
	mongo *mongo.Database
}

// NewUserInfoService creates a new UserInfoService
func NewUserInfoService(mongo *mongo.Database) *UserInfoService {
	return &UserInfoService{
		mongo: mongo,
	}
}

// GetUserInfo retrieves user information with proper fallback handling
func (s *UserInfoService) GetUserInfo(ctx context.Context, userID primitive.ObjectID) (model.UserInfo, error) {
	log.Printf("[DEBUG] Getting user info for ID: %s", userID.Hex())

	user, err := s.FetchUserFromDB(ctx, userID)
	if err != nil {
		log.Printf("[WARN] Failed to fetch user %s: %v, using fallback", userID.Hex(), err)
		return s.CreateFallbackUserInfo(userID), nil
	}

	userInfo := s.BuildUserInfo(user)

	// Add role information if available
	if user.Role != primitive.NilObjectID {
		if roleInfo := s.FetchUserRole(ctx, user.Role); roleInfo != nil {
			userInfo.Role = roleInfo
		}
	}

	log.Printf("[SUCCESS] Built userInfo: ID=%s, Username=%s", userInfo.ID, userInfo.Username)
	return userInfo, nil
}

// fetchUserFromDB retrieves user data from database
func (s *UserInfoService) FetchUserFromDB(ctx context.Context, userID primitive.ObjectID) (*userModel.User, error) {
	userService := queries.NewBaseService[userModel.User](s.mongo.Collection("users"))
	result, err := userService.FindOne(ctx, bson.M{"_id": userID})

	if err != nil {
		return nil, fmt.Errorf("database query failed: %w", err)
	}

	if len(result.Data) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	return &result.Data[0], nil
}

// buildUserInfo constructs UserInfo from user data with validation
func (s *UserInfoService) BuildUserInfo(user *userModel.User) model.UserInfo {
	// Ensure username is not empty
	username := user.Username
	if username == "" {
		username = "user_" + user.ID.Hex()[:8]
		log.Printf("[WARN] User %s has empty username, using fallback", user.ID.Hex())
	}

	// Ensure name fields are not empty
	firstName := user.Name.First
	lastName := user.Name.Last
	if firstName == "" && lastName == "" {
		firstName = "User"
		lastName = user.ID.Hex()[:8]
		log.Printf("[WARN] User %s has empty name, using fallback", user.ID.Hex())
	}

	return model.UserInfo{
		ID:       user.ID.Hex(),
		Username: username,
		Name: map[string]interface{}{
			"first":  firstName,
			"middle": user.Name.Middle,
			"last":   lastName,
		},
	}
}

// fetchUserRole retrieves role information for a user
func (s *UserInfoService) FetchUserRole(ctx context.Context, roleID primitive.ObjectID) *model.RoleInfo {
	log.Printf("[DEBUG] Getting role for user, role ID: %s", roleID.Hex())

	roleService := queries.NewBaseService[interface{}](s.mongo.Collection("roles"))
	roleResult, err := roleService.FindOne(ctx, bson.M{"_id": roleID})
	if err != nil {
		log.Printf("[WARNING] Failed to get role %s: %v", roleID.Hex(), err)
		return nil
	}

	if len(roleResult.Data) == 0 {
		log.Printf("[WARNING] Role %s not found", roleID.Hex())
		return nil
	}

	roleData, ok := roleResult.Data[0].(map[string]interface{})
	if !ok {
		log.Printf("[WARNING] Invalid role data format for %s", roleID.Hex())
		return nil
	}

	roleIDField, exists := roleData["_id"]
	if !exists {
		log.Printf("[WARNING] Role %s missing _id field", roleID.Hex())
		return nil
	}

	roleName, exists := roleData["name"]
	if !exists {
		log.Printf("[WARNING] Role %s missing name field", roleID.Hex())
		return nil
	}

	roleObjectID, ok := roleIDField.(primitive.ObjectID)
	if !ok {
		log.Printf("[WARNING] Invalid role ID format for %s", roleID.Hex())
		return nil
	}

	roleNameStr, ok := roleName.(string)
	if !ok {
		log.Printf("[WARNING] Invalid role name format for %s", roleID.Hex())
		return nil
	}

	log.Printf("[DEBUG] Successfully added role: %s", roleNameStr)
	return &model.RoleInfo{
		ID:   roleObjectID.Hex(),
		Name: roleNameStr,
	}
}

// CreateFallbackUserInfo creates a fallback user info when database lookup fails
func (s *UserInfoService) CreateFallbackUserInfo(userID primitive.ObjectID) model.UserInfo {
	return model.UserInfo{
		ID:       userID.Hex(),
		Username: "user_" + userID.Hex()[:8],
		Name: map[string]interface{}{
			"first":  "User",
			"middle": "",
			"last":   userID.Hex()[:8],
		},
	}
}

// BuildSenderInfo creates sender information from user model
func (s *UserInfoService) BuildSenderInfo(sender *userModel.User) model.UserInfo {
	return model.UserInfo{
		ID:       sender.ID.Hex(),
		Username: sender.Username,
		Name: map[string]interface{}{
			"first":  sender.Name.First,
			"middle": sender.Name.Middle,
			"last":   sender.Name.Last,
		},
	}
}
