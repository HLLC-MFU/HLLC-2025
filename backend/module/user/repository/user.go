package repository

import (
	"context"
	"fmt"
	"time"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

const (
	collectionUsers = "users"
)

// UserRepositoryService defines user-specific operations
type (
	UserRepositoryService interface {
		CreateUser(ctx context.Context, user *userPb.User) error
		FindByID(ctx context.Context, id primitive.ObjectID) (*userPb.User, error)
		FindByUsername(ctx context.Context, username string) (*userPb.User, error)
		FindAll(ctx context.Context) ([]*userPb.User, error)
		FindAllPaginated(ctx context.Context, page, limit int32) ([]*userPb.User, int32, error)
		UpdateUser(ctx context.Context, user *userPb.User) error
		UpdatePassword(ctx context.Context, userID primitive.ObjectID, password string) error
		DeleteUser(ctx context.Context, id primitive.ObjectID) error
		ValidatePassword(ctx context.Context, username, password string) (bool, error)
	}

	userRepository struct {
		db *mongo.Client
	}
)

// NewUserRepository creates a new user repository instance
func NewUserRepository(db *mongo.Client) UserRepositoryService {
	return &userRepository{db: db}
}

func (r *userRepository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *userRepository) usersColl(ctx context.Context) *mongo.Collection {
	return r.dbConnect(ctx).Collection(collectionUsers)
}

// CreateUser creates a new user with proper error handling and structured logging
func (r *userRepository) CreateUser(ctx context.Context, user *userPb.User) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating user",
			logging.FieldOperation, "create_user",
			logging.FieldEntity, "user",
			"username", user.Username,
		)
		
		usersColl := r.usersColl(ctx)
		
		// Check if user already exists by username
		var existingUser userPb.User
		err := usersColl.FindOne(ctx, bson.M{"username": user.Username}).Decode(&existingUser)
		if err == nil {
			logger.Warn("User already exists",
				logging.FieldOperation, "create_user",
				logging.FieldEntity, "user",
				"username", user.Username,
			)
			return struct{}{}, exceptions.AlreadyExists(
				"user", "username", user.Username, nil,
				exceptions.WithOperation("create"),
			)
		} else if err != mongo.ErrNoDocuments {
			logger.Error("Error checking existing user", err,
				logging.FieldOperation, "create_user",
				logging.FieldEntity, "user",
				"username", user.Username,
			)
			return struct{}{}, exceptions.Internal("error checking existing user", err)
		}
		
		// Hash password if provided
		if user.Password != "" {
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
			if err != nil {
				logger.Error("Error hashing password", err,
					logging.FieldOperation, "create_user",
					logging.FieldEntity, "user",
					"username", user.Username,
				)
				return struct{}{}, exceptions.Internal("error hashing password", err)
			}
			user.Password = string(hashedPassword)
		}
		
		// Convert string ID to ObjectID for MongoDB
		var objectID primitive.ObjectID
		if user.Id == "" {
			objectID = primitive.NewObjectID()
			user.Id = objectID.Hex()
		} else {
			var err error
			objectID, err = primitive.ObjectIDFromHex(user.Id)
			if err != nil {
				logger.Error("Invalid user ID format", err,
					logging.FieldOperation, "create_user",
					logging.FieldEntity, "user",
					"user_id", user.Id,
				)
				return struct{}{}, exceptions.InvalidInput(fmt.Sprintf("invalid user ID format: %s", user.Id), err)
			}
		}
		
		// Create document
		doc := bson.M{
			"_id":          objectID,
			"id":           user.Id,
			"username":     user.Username,
			"password":     user.Password,
			"name":         user.Name,
			"role_ids":     user.RoleIds,
			"major_id":     user.MajorId,
			"is_activated": user.IsActivated,
			"created_at":   user.CreatedAt,
			"updated_at":   user.UpdatedAt,
		}
		
		// Insert user
		_, err = usersColl.InsertOne(ctx, doc)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				logger.Warn("Duplicate key error when creating user", 
					logging.FieldOperation, "create_user",
					logging.FieldEntity, "user",
					"username", user.Username,
				)
				return struct{}{}, exceptions.AlreadyExists("user", "username", user.Username, err)
			}
			
			logger.Error("Error creating user", err,
				logging.FieldOperation, "create_user",
				logging.FieldEntity, "user",
				"username", user.Username,
			)
			return struct{}{}, exceptions.Internal("error creating user", err)
		}
		
		logger.Info("User created successfully",
			logging.FieldOperation, "create_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, user.Id,
			"username", user.Username,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// FindByID finds a user by ID with proper error handling and logging
func (r *userRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*userPb.User, error) {
	return decorator.WithTimeout[*userPb.User](5*time.Second)(func(ctx context.Context) (*userPb.User, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding user by ID",
			logging.FieldOperation, "find_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, id.Hex(),
		)
		
		usersColl := r.usersColl(ctx)
		
		// Create filter that can match either _id or id field
		filter := bson.M{
			"$or": []bson.M{
				{"_id": id},
				{"id": id.Hex()},
			},
		}
		
		var user userPb.User
		err := usersColl.FindOne(ctx, filter).Decode(&user)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("User not found",
					logging.FieldOperation, "find_user",
					logging.FieldEntity, "user",
					logging.FieldEntityID, id.Hex(),
				)
				return nil, exceptions.NotFound("user", id.Hex(), err)
			}
			
			logger.Error("Error finding user", err,
				logging.FieldOperation, "find_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, id.Hex(),
			)
			return nil, exceptions.Internal("error finding user", err)
		}
		
		logger.Info("User found",
			logging.FieldOperation, "find_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, id.Hex(),
			"username", user.Username,
		)
		
		// Don't return the password hash
		user.Password = ""
		
		return &user, nil
	})(ctx)
}

// FindByUsername finds a user by username with proper error handling and logging
func (r *userRepository) FindByUsername(ctx context.Context, username string) (*userPb.User, error) {
	return decorator.WithTimeout[*userPb.User](5*time.Second)(func(ctx context.Context) (*userPb.User, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding user by username",
			logging.FieldOperation, "find_user",
			logging.FieldEntity, "user",
			"username", username,
		)
		
		usersColl := r.usersColl(ctx)
		
		var user userPb.User
		err := usersColl.FindOne(ctx, bson.M{"username": username}).Decode(&user)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("User not found by username",
					logging.FieldOperation, "find_user",
					logging.FieldEntity, "user",
					"username", username,
				)
				return nil, exceptions.NotFound("user", username, err, 
					exceptions.WithContext(map[string]interface{}{
						"identifier": "username",
					}))
			}
			
			logger.Error("Error finding user by username", err,
				logging.FieldOperation, "find_user",
				logging.FieldEntity, "user",
				"username", username,
			)
			return nil, exceptions.Internal("error finding user by username", err)
		}
		
		logger.Info("User found by username",
			logging.FieldOperation, "find_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, user.Id,
			"username", username,
		)
		
		// Don't return the password hash unless explicitly needed
		user.Password = ""
		
		return &user, nil
	})(ctx)
}

// FindAll finds all users with proper error handling and logging
func (r *userRepository) FindAll(ctx context.Context) ([]*userPb.User, error) {
	return decorator.WithTimeout[[]*userPb.User](10*time.Second)(func(ctx context.Context) ([]*userPb.User, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding all users",
			logging.FieldOperation, "find_all_users",
			logging.FieldEntity, "user",
		)
		
		usersColl := r.usersColl(ctx)
		
		// Find all users
		cursor, err := usersColl.Find(ctx, bson.M{})
		if err != nil {
			logger.Error("Error finding all users", err,
				logging.FieldOperation, "find_all_users",
				logging.FieldEntity, "user",
			)
			return nil, exceptions.Internal("error finding all users", err)
		}
		defer cursor.Close(ctx)
		
		var users []*userPb.User
		if err := cursor.All(ctx, &users); err != nil {
			logger.Error("Error decoding users", err,
				logging.FieldOperation, "find_all_users",
				logging.FieldEntity, "user",
			)
			return nil, exceptions.Internal("error decoding users", err)
		}
		
		// Return empty array instead of nil
		if users == nil {
			users = []*userPb.User{}
		}
		
		// Don't return password hashes
		for _, user := range users {
			user.Password = ""
		}
		
		logger.Info("Found users",
			logging.FieldOperation, "find_all_users",
			logging.FieldEntity, "user",
			"count", len(users),
		)
		
		return users, nil
	})(ctx)
}

// FindAllPaginated finds paginated users with proper error handling and logging
func (r *userRepository) FindAllPaginated(ctx context.Context, page, limit int32) ([]*userPb.User, int32, error) {
	type result struct {
		users      []*userPb.User
		totalCount int32
	}
	
	res, err := decorator.WithTimeout[result](10*time.Second)(func(ctx context.Context) (result, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding paginated users",
			logging.FieldOperation, "find_paginated_users",
			logging.FieldEntity, "user",
			"page", page,
			"limit", limit,
		)
		
		// Default pagination values
		if page < 1 {
			page = 1
		}
		if limit < 1 {
			limit = 10
		}
		
		usersColl := r.usersColl(ctx)
		
		// Calculate total count
		totalCount, err := usersColl.CountDocuments(ctx, bson.M{})
		if err != nil {
			logger.Error("Error counting users", err,
				logging.FieldOperation, "find_paginated_users",
				logging.FieldEntity, "user",
			)
			return result{}, exceptions.Internal("error counting users", err)
		}
		
		// Find paginated users
		skip := (page - 1) * limit
		findOptions := options.Find().
			SetSkip(int64(skip)).
			SetLimit(int64(limit))
		
		cursor, err := usersColl.Find(ctx, bson.M{}, findOptions)
		if err != nil {
			logger.Error("Error finding paginated users", err,
				logging.FieldOperation, "find_paginated_users",
				logging.FieldEntity, "user",
				"page", page,
				"limit", limit,
			)
			return result{}, exceptions.Internal("error finding paginated users", err)
		}
		defer cursor.Close(ctx)
		
		var users []*userPb.User
		if err := cursor.All(ctx, &users); err != nil {
			logger.Error("Error decoding paginated users", err,
				logging.FieldOperation, "find_paginated_users",
				logging.FieldEntity, "user",
			)
			return result{}, exceptions.Internal("error decoding paginated users", err)
		}
		
		// Return empty array instead of nil
		if users == nil {
			users = []*userPb.User{}
		}
		
		// Don't return password hashes
		for _, user := range users {
			user.Password = ""
		}
		
		logger.Info("Found paginated users",
			logging.FieldOperation, "find_paginated_users",
			logging.FieldEntity, "user",
			"count", len(users),
			"page", page,
			"limit", limit,
			"total_count", totalCount,
		)
		
		return result{users: users, totalCount: int32(totalCount)}, nil
	})(ctx)
	
	if err != nil {
		return nil, 0, err
	}
	
	return res.users, res.totalCount, nil
}

// UpdateUser updates a user with proper error handling and logging
func (r *userRepository) UpdateUser(ctx context.Context, user *userPb.User) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Updating user",
			logging.FieldOperation, "update_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, user.Id,
			"username", user.Username,
		)
		
		usersColl := r.usersColl(ctx)
		
		// Convert string ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(user.Id)
		if err != nil {
			logger.Error("Invalid user ID format", err,
				logging.FieldOperation, "update_user",
				logging.FieldEntity, "user",
				"user_id", user.Id,
			)
			return struct{}{}, exceptions.InvalidInput(fmt.Sprintf("invalid user ID format: %s", user.Id), err)
		}
		
		// Check if user exists
		filter := bson.M{
			"$or": []bson.M{
				{"_id": objectID},
				{"id": user.Id},
			},
		}
		
		var existingUser userPb.User
		err = usersColl.FindOne(ctx, filter).Decode(&existingUser)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("User not found for update",
					logging.FieldOperation, "update_user",
					logging.FieldEntity, "user",
					logging.FieldEntityID, user.Id,
				)
				return struct{}{}, exceptions.NotFound("user", user.Id, err)
			}
			
			logger.Error("Error finding user for update", err,
				logging.FieldOperation, "update_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, user.Id,
			)
			return struct{}{}, exceptions.Internal("error finding user for update", err)
		}
		
		// Prepare update document (don't update password here)
		update := bson.M{
			"$set": bson.M{
				"username":     user.Username,
				"name":         user.Name,
				"role_ids":     user.RoleIds,
				"major_id":     user.MajorId,
				"is_activated": user.IsActivated,
				"updated_at":   user.UpdatedAt,
			},
		}
		
		// If username is changing, check for duplicates
		if user.Username != existingUser.Username {
			// Check if the new username already exists for another user
			var duplicateUser userPb.User
			err = usersColl.FindOne(ctx, bson.M{
				"username": user.Username,
				"_id": bson.M{"$ne": objectID},
			}).Decode(&duplicateUser)
			
			if err == nil {
				logger.Warn("Username already taken",
					logging.FieldOperation, "update_user",
					logging.FieldEntity, "user",
					"username", user.Username,
				)
				return struct{}{}, exceptions.AlreadyExists("user", "username", user.Username, nil)
			} else if err != mongo.ErrNoDocuments {
				logger.Error("Error checking username uniqueness", err,
					logging.FieldOperation, "update_user",
					logging.FieldEntity, "user",
					"username", user.Username,
				)
				return struct{}{}, exceptions.Internal("error checking username uniqueness", err)
			}
		}
		
		// Update user
		result, err := usersColl.UpdateOne(ctx, filter, update)
		if err != nil {
			logger.Error("Error updating user", err,
				logging.FieldOperation, "update_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, user.Id,
			)
			return struct{}{}, exceptions.Internal("error updating user", err)
		}
		
		if result.MatchedCount == 0 {
			logger.Warn("User not found for update after check",
				logging.FieldOperation, "update_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, user.Id,
			)
			return struct{}{}, exceptions.NotFound("user", user.Id, nil)
		}
		
		logger.Info("User updated successfully",
			logging.FieldOperation, "update_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, user.Id,
			"username", user.Username,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// UpdatePassword updates a user's password with proper error handling and logging
func (r *userRepository) UpdatePassword(ctx context.Context, userID primitive.ObjectID, password string) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Updating user password",
			logging.FieldOperation, "update_password",
			logging.FieldEntity, "user",
			logging.FieldEntityID, userID.Hex(),
		)
		
		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			logger.Error("Error hashing password", err,
				logging.FieldOperation, "update_password",
				logging.FieldEntity, "user",
				logging.FieldEntityID, userID.Hex(),
			)
			return struct{}{}, exceptions.Internal("error hashing password", err)
		}
		
		usersColl := r.usersColl(ctx)
		
		// Update password
		filter := bson.M{
			"$or": []bson.M{
				{"_id": userID},
				{"id": userID.Hex()},
			},
		}
		
		update := bson.M{
			"$set": bson.M{
				"password":   string(hashedPassword),
				"updated_at": time.Now().Format(time.RFC3339),
			},
		}
		
		result, err := usersColl.UpdateOne(ctx, filter, update)
		if err != nil {
			logger.Error("Error updating password", err,
				logging.FieldOperation, "update_password",
				logging.FieldEntity, "user",
				logging.FieldEntityID, userID.Hex(),
			)
			return struct{}{}, exceptions.Internal("error updating password", err)
		}
		
		if result.MatchedCount == 0 {
			logger.Warn("User not found for password update",
				logging.FieldOperation, "update_password",
				logging.FieldEntity, "user",
				logging.FieldEntityID, userID.Hex(),
			)
			return struct{}{}, exceptions.NotFound("user", userID.Hex(), nil)
		}
		
		logger.Info("Password updated successfully",
			logging.FieldOperation, "update_password",
			logging.FieldEntity, "user",
			logging.FieldEntityID, userID.Hex(),
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// DeleteUser deletes a user with proper error handling and logging
func (r *userRepository) DeleteUser(ctx context.Context, id primitive.ObjectID) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deleting user",
			logging.FieldOperation, "delete_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, id.Hex(),
		)
		
		usersColl := r.usersColl(ctx)
		
		// Find user first for better logging and error reporting
		filter := bson.M{
			"$or": []bson.M{
				{"_id": id},
				{"id": id.Hex()},
			},
		}
		
		var user userPb.User
		err := usersColl.FindOne(ctx, filter).Decode(&user)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("User not found for deletion",
					logging.FieldOperation, "delete_user",
					logging.FieldEntity, "user",
					logging.FieldEntityID, id.Hex(),
				)
				return struct{}{}, exceptions.NotFound("user", id.Hex(), err)
			}
			
			logger.Error("Error finding user for deletion", err,
				logging.FieldOperation, "delete_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, id.Hex(),
			)
			return struct{}{}, exceptions.Internal("error finding user for deletion", err)
		}
		
		// Delete user
		result, err := usersColl.DeleteOne(ctx, filter)
		if err != nil {
			logger.Error("Error deleting user", err,
				logging.FieldOperation, "delete_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, id.Hex(),
				"username", user.Username,
			)
			return struct{}{}, exceptions.Internal("error deleting user", err)
		}
		
		if result.DeletedCount == 0 {
			logger.Warn("User not deleted after found",
				logging.FieldOperation, "delete_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, id.Hex(),
				"username", user.Username,
			)
			return struct{}{}, exceptions.Internal("user not deleted after found", nil)
		}
		
		logger.Info("User deleted successfully",
			logging.FieldOperation, "delete_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, id.Hex(),
			"username", user.Username,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// ValidatePassword validates a user's password with proper error handling and logging
func (r *userRepository) ValidatePassword(ctx context.Context, username, password string) (bool, error) {
	return decorator.WithTimeout[bool](5*time.Second)(func(ctx context.Context) (bool, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Validating password",
			logging.FieldOperation, "validate_password",
			logging.FieldEntity, "user",
			"username", username,
		)
		
		usersColl := r.usersColl(ctx)
		
		// Find user by username (including password hash)
		var user userPb.User
		err := usersColl.FindOne(ctx, bson.M{"username": username}).Decode(&user)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("User not found for password validation",
					logging.FieldOperation, "validate_password",
					logging.FieldEntity, "user",
					"username", username,
				)
				return false, exceptions.NotFound("user", username, err)
			}
			
			logger.Error("Error finding user for password validation", err,
				logging.FieldOperation, "validate_password",
				logging.FieldEntity, "user",
				"username", username,
			)
			return false, exceptions.Internal("error finding user for password validation", err)
		}
		
		// Check if user is activated
		if !user.IsActivated {
			logger.Warn("Attempted password validation for inactive user",
				logging.FieldOperation, "validate_password",
				logging.FieldEntity, "user",
				logging.FieldEntityID, user.Id,
				"username", username,
			)
			return false, exceptions.Unauthorized("user account is not activated", nil,
				exceptions.WithOperation("validate_password"))
		}
		
		// Check if password is valid
		err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
		if err != nil {
			logger.Info("Invalid password",
				logging.FieldOperation, "validate_password",
				logging.FieldEntity, "user",
				logging.FieldEntityID, user.Id,
				"username", username,
				"valid", false,
			)
			return false, nil // Invalid password but not an error
		}
		
		logger.Info("Password validated successfully",
			logging.FieldOperation, "validate_password",
			logging.FieldEntity, "user",
			logging.FieldEntityID, user.Id,
			"username", username,
			"valid", true,
		)
		
		return true, nil
	})(ctx)
} 