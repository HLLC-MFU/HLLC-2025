package http

import (
	"context"
	"time"

	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type (
	UserService interface {
		CreateUser(ctx context.Context, req *dto.CreateUserRequest) (*dto.UserResponse, error)
		GetUserByID(ctx context.Context, id string) (*dto.UserResponse, error)
		GetUserByUsername(ctx context.Context, username string) (*dto.UserResponse, error)
		GetAllUsers(ctx context.Context) ([]*dto.UserResponse, error)
		UpdateUser(ctx context.Context, id string, req *dto.UpdateUserRequest) (*dto.UserResponse, error)
		DeleteUser(ctx context.Context, id string) error
		ValidatePassword(ctx context.Context, username, password string) (bool, error)
		CheckUsername(ctx context.Context, req *dto.CheckUsernameRequest) (*dto.CheckUsernameResponse, error)
		SetPassword(ctx context.Context, req *dto.SetPasswordRequest) (*dto.SetPasswordResponse, error)

		GetMajor(ctx context.Context, majorID string) (*majorPb.Major, error)

		ActivateUser(ctx context.Context, req *dto.ActivateUserRequest) (*dto.ActivateUserResponse, error)
	}

	userService struct {
		userRepository       repository.UserRepositoryService
		roleRepository       repository.RoleRepositoryService
		permissionRepository repository.PermissionRepositoryService
	}
)

func NewUserService(
	userRepository repository.UserRepositoryService,
	roleRepository repository.RoleRepositoryService,
	permissionRepository repository.PermissionRepositoryService,
) UserService {
	return &userService{
		userRepository:       userRepository,
		roleRepository:       roleRepository,
		permissionRepository: permissionRepository,
	}
}

func (s *userService) CreateUser(ctx context.Context, req *dto.CreateUserRequest) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](10 * time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating new user",
			logging.FieldOperation, "create_user",
			logging.FieldEntity, "user",
			"username", req.Username,
		)

		// Check if user exists
		existingUser, err := s.userRepository.FindByUsername(ctx, req.Username)
		if err != nil && !exceptions.IsNotFound(err) {
			logger.Error("Failed to check for existing user", err,
				logging.FieldOperation, "create_user",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return nil, err
		}
		if existingUser != nil {
			logger.Warn("User with username already exists",
				logging.FieldOperation, "create_user",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return nil, exceptions.AlreadyExists("user", "username", req.Username, nil,
				exceptions.WithOperation("create_user"))
		}

		var hashedPassword string
		isActivated := req.IsActivated

		// If password is provided and user should be activated
		if req.Password != "" && isActivated {
			hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			if err != nil {
				logger.Error("Failed to hash password", err,
					logging.FieldOperation, "create_user",
					logging.FieldEntity, "user",
					"username", req.Username,
				)
				return nil, exceptions.Internal("failed to hash password", err,
					exceptions.WithOperation("create_user"))
			}
			hashedPassword = string(hashed)
		}

		// Create user entity
		newUser := &userPb.User{
			Id:       primitive.NewObjectID().Hex(),
			Username: req.Username,
			Password: hashedPassword,
			RoleIds:  req.RoleIDs,
			MajorId:  req.MajorID,
			Name: &userPb.Name{
				FirstName:  req.Name.FirstName,
				MiddleName: req.Name.MiddleName,
				LastName:   req.Name.LastName,
			},
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
			IsActivated: isActivated,
		}

		// Save user
		if err := s.userRepository.CreateUser(ctx, newUser); err != nil {
			logger.Error("Failed to save user to database", err,
				logging.FieldOperation, "create_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, newUser.Id,
				"username", newUser.Username,
			)
			return nil, err
		}

		logger.Info("User created successfully",
			logging.FieldOperation, "create_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, newUser.Id,
			"username", newUser.Username,
		)

		// Get roles for response
		roles := make([]*userPb.Role, 0)
		for _, roleID := range req.RoleIDs {
			objectID, err := primitive.ObjectIDFromHex(roleID)
			if err != nil {
				logger.Warn("Invalid role ID format, skipping role",
					logging.FieldOperation, "create_user",
					logging.FieldEntity, "role",
					"role_id", roleID,
					"username", newUser.Username,
				)
				continue
			}
			role, err := s.roleRepository.FindRoleByID(ctx, objectID)
			if err != nil {
				logger.Warn("Failed to get role, skipping",
					logging.FieldOperation, "create_user",
					logging.FieldEntity, "role",
					"role_id", roleID,
					"username", newUser.Username,
				)
				continue
			}
			roles = append(roles, role)
		}

		// Get major information if provided
		var major *majorPb.Major
		var majorID string
		if req.MajorID != "" {
			logger.Info("Retrieving major data for new user",
				logging.FieldOperation, "create_user",
				logging.FieldEntity, "user",
				"username", newUser.Username,
				"major_id", req.MajorID,
			)

			major, err = s.GetMajor(ctx, req.MajorID)
			if err != nil {
				// Log error but continue - major is optional
				logger.Warn("Failed to get major data, continuing without it",
					logging.FieldOperation, "create_user",
					logging.FieldEntity, "major",
					logging.FieldEntityID, req.MajorID,
					"username", newUser.Username,
				)
				// Continue without major info
			} else if major != nil {
				logger.Info("Retrieved major data for new user",
					logging.FieldOperation, "create_user", 
					logging.FieldEntity, "major",
					logging.FieldEntityID, req.MajorID,
					"username", newUser.Username,
				)
				majorID = req.MajorID
			}
		}

		response := &dto.UserResponse{
			ID:       newUser.Id,
			Username: newUser.Username,
			Name: dto.Name{
				FirstName:  req.Name.FirstName,
				MiddleName: req.Name.MiddleName,
				LastName:   req.Name.LastName,
			},
			Roles:       roles,
			MajorID:     majorID,
			Major:       major,
			IsActivated: newUser.IsActivated,
		}

		logger.Info("User creation completed",
			logging.FieldOperation, "create_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, newUser.Id,
			"username", newUser.Username,
		)
		return response, nil
	})(ctx)
}

func (s *userService) GetUserByID(ctx context.Context, id string) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](5 * time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting user by ID",
			logging.FieldOperation, "get_user_by_id",
			logging.FieldEntity, "user",
			logging.FieldEntityID, id,
		)
		
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid user ID format", err,
				logging.FieldOperation, "get_user_by_id",
				logging.FieldEntity, "user",
				logging.FieldEntityID, id,
			)
			return nil, exceptions.InvalidInput("invalid user ID format", err,
				exceptions.WithOperation("get_user_by_id"),
				exceptions.WithEntity("user", id))
		}

		user, err := s.userRepository.FindByID(ctx, objectID)
		if err != nil {
			logger.Error("Failed to find user", err,
				logging.FieldOperation, "get_user_by_id",
				logging.FieldEntity, "user",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		// Get roles
		roles := make([]*userPb.Role, 0)
		for _, roleID := range user.RoleIds {
			objectID, err := primitive.ObjectIDFromHex(roleID)
			if err != nil {
				logger.Warn("Invalid role ID format, skipping role",
					logging.FieldOperation, "get_user_by_id",
					logging.FieldEntity, "role",
					"role_id", roleID,
					"username", user.Username,
				)
				continue
			}
			role, err := s.roleRepository.FindRoleByID(ctx, objectID)
			if err != nil {
				logger.Warn("Failed to get role, skipping",
					logging.FieldOperation, "get_user_by_id",
					logging.FieldEntity, "role",
					"role_id", roleID,
					"username", user.Username,
				)
				continue
			}
			roles = append(roles, role)
		}

		// Get major information if provided
		var major *majorPb.Major
		var majorID string
		if user.MajorId != "" {
			logger.Info("Retrieving major data for user",
				logging.FieldOperation, "get_user_by_id",
				logging.FieldEntity, "user",
				"username", user.Username,
				"major_id", user.MajorId,
			)

			major, err = s.GetMajor(ctx, user.MajorId)
			if err != nil {
				// Log error but continue - major is optional
				logger.Warn("Failed to get major data, continuing without it",
					logging.FieldOperation, "get_user_by_id",
					logging.FieldEntity, "major",
					logging.FieldEntityID, user.MajorId,
					"username", user.Username,
				)
				// Continue without major info
			} else if major != nil {
				logger.Info("Retrieved major data for user",
					logging.FieldOperation, "get_user_by_id",
					logging.FieldEntity, "major",
					logging.FieldEntityID, user.MajorId,
					"username", user.Username,
				)
				majorID = user.MajorId
			}
		}

		// Initialize name object if nil
		name := user.Name
		if name == nil {
			name = &userPb.Name{}
		}

		response := &dto.UserResponse{
			ID:       user.Id,
			Username: user.Username,
			Name: dto.Name{
				FirstName:  name.FirstName,
				MiddleName: name.MiddleName,
				LastName:   name.LastName,
			},
			Roles:       roles,
			MajorID:     majorID,
			Major:       major,
			IsActivated: user.IsActivated,
		}

		logger.Info("Retrieved user successfully",
			logging.FieldOperation, "get_user_by_id",
			logging.FieldEntity, "user",
			logging.FieldEntityID, user.Id,
			"username", user.Username,
		)
		return response, nil
	})(ctx)
}

func (s *userService) GetUserByUsername(ctx context.Context, username string) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](5 * time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting user by username",
			logging.FieldOperation, "get_user_by_username",
			logging.FieldEntity, "user",
			"username", username,
		)

		user, err := s.userRepository.FindByUsername(ctx, username)
		if err != nil {
			logger.Error("Failed to find user by username", err,
				logging.FieldOperation, "get_user_by_username",
				logging.FieldEntity, "user",
				"username", username,
			)
			return nil, err
		}

		// Get roles
		roles := make([]*userPb.Role, 0)
		for _, roleID := range user.RoleIds {
			objectID, err := primitive.ObjectIDFromHex(roleID)
			if err != nil {
				logger.Warn("Invalid role ID format, skipping role",
					logging.FieldOperation, "get_user_by_username",
					logging.FieldEntity, "role",
					"role_id", roleID,
					"username", username,
				)
				continue
			}
			role, err := s.roleRepository.FindRoleByID(ctx, objectID)
			if err != nil {
				logger.Warn("Failed to get role, skipping",
					logging.FieldOperation, "get_user_by_username",
					logging.FieldEntity, "role",
					"role_id", roleID,
					"username", username,
				)
				continue
			}
			roles = append(roles, role)
		}

		// Get major information if provided
		var major *majorPb.Major
		var majorID string
		if user.MajorId != "" {
			logger.Info("Retrieving major data for user",
				logging.FieldOperation, "get_user_by_username",
				logging.FieldEntity, "user",
				"username", user.Username,
				"major_id", user.MajorId,
			)

			major, err = s.GetMajor(ctx, user.MajorId)
			if err != nil {
				// Log error but continue - major is optional
				logger.Warn("Failed to get major data, continuing without it",
					logging.FieldOperation, "get_user_by_username",
					logging.FieldEntity, "major",
					logging.FieldEntityID, user.MajorId,
					"username", user.Username,
				)
				// Continue without major info
			} else if major != nil {
				logger.Info("Retrieved major data for user",
					logging.FieldOperation, "get_user_by_username",
					logging.FieldEntity, "major",
					logging.FieldEntityID, user.MajorId,
					"username", user.Username,
				)
				majorID = user.MajorId
			}
		}

		// Initialize name object if nil
		name := user.Name
		if name == nil {
			name = &userPb.Name{}
		}

		response := &dto.UserResponse{
			ID:       user.Id,
			Username: user.Username,
			Name: dto.Name{
				FirstName:  name.FirstName,
				MiddleName: name.MiddleName,
				LastName:   name.LastName,
			},
			Roles:       roles,
			MajorID:     majorID,
			Major:       major,
			IsActivated: user.IsActivated,
		}

		logger.Info("Retrieved user successfully",
			logging.FieldOperation, "get_user_by_username",
			logging.FieldEntity, "user",
			logging.FieldEntityID, user.Id,
			"username", user.Username,
		)
		return response, nil
	})(ctx)
}

func (s *userService) GetAllUsers(ctx context.Context) ([]*dto.UserResponse, error) {
	return decorator.WithTimeout[[]*dto.UserResponse](10 * time.Second)(func(ctx context.Context) ([]*dto.UserResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting all users",
			logging.FieldOperation, "get_all_users",
			logging.FieldEntity, "user",
		)

		users, err := s.userRepository.FindAll(ctx)
		if err != nil {
			logger.Error("Failed to find all users", err,
				logging.FieldOperation, "get_all_users",
				logging.FieldEntity, "user",
			)
			return nil, err
		}

		// Process users into response objects
		var userResponses []*dto.UserResponse
		for _, user := range users {
			// Get roles for each user
			roles := make([]*userPb.Role, 0)
			for _, roleID := range user.RoleIds {
				objectID, err := primitive.ObjectIDFromHex(roleID)
				if err != nil {
					logger.Warn("Invalid role ID format, skipping role",
						logging.FieldOperation, "get_all_users",
						logging.FieldEntity, "role",
						"role_id", roleID,
						"username", user.Username,
					)
					continue
				}
				role, err := s.roleRepository.FindRoleByID(ctx, objectID)
				if err != nil {
					logger.Warn("Failed to get role, skipping",
						logging.FieldOperation, "get_all_users",
						logging.FieldEntity, "role",
						"role_id", roleID,
						"username", user.Username,
					)
					continue
				}
				roles = append(roles, role)
			}

			// Initialize name object if nil
			name := user.Name
			if name == nil {
				name = &userPb.Name{}
			}

			// Get major data if provided
			var major *majorPb.Major
			var majorID string
			if user.MajorId != "" {
				major, err = s.GetMajor(ctx, user.MajorId)
				if err != nil {
					// Log but continue - major is optional
					logger.Warn("Failed to get major data for user, continuing without it",
						logging.FieldOperation, "get_all_users",
						logging.FieldEntity, "major",
						logging.FieldEntityID, user.MajorId,
						"username", user.Username,
					)
				} else if major != nil {
					majorID = user.MajorId
				}
			}

			// Create response object for this user
			userResponse := &dto.UserResponse{
				ID:       user.Id,
				Username: user.Username,
				Name: dto.Name{
					FirstName:  name.FirstName,
					MiddleName: name.MiddleName,
					LastName:   name.LastName,
				},
				Roles:       roles,
				MajorID:     majorID,
				Major:       major,
				IsActivated: user.IsActivated,
			}
			userResponses = append(userResponses, userResponse)
		}

		logger.Info("Retrieved all users successfully",
			logging.FieldOperation, "get_all_users",
			logging.FieldEntity, "user",
			"count", len(userResponses),
		)
		return userResponses, nil
	})(ctx)
}

func (s *userService) UpdateUser(ctx context.Context, id string, req *dto.UpdateUserRequest) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](10 * time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Updating user",
			logging.FieldOperation, "update_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, id,
		)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid user ID format", err,
				logging.FieldOperation, "update_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, id,
			)
			return nil, exceptions.InvalidInput("invalid user ID format", err,
				exceptions.WithOperation("update_user"),
				exceptions.WithEntity("user", id))
		}

		// Get the existing user
		user, err := s.userRepository.FindByID(ctx, objectID)
		if err != nil {
			logger.Error("Failed to find user for update", err,
				logging.FieldOperation, "update_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		// Check username uniqueness if changing
		if req.Username != "" && req.Username != user.Username {
			existingUser, err := s.userRepository.FindByUsername(ctx, req.Username)
			if err != nil && !exceptions.IsNotFound(err) {
				logger.Error("Failed to check username uniqueness", err,
					logging.FieldOperation, "update_user",
					logging.FieldEntity, "user",
					"username", req.Username,
				)
				return nil, err
			}
			if existingUser != nil {
				logger.Warn("Username already exists",
					logging.FieldOperation, "update_user",
					logging.FieldEntity, "user",
					"username", req.Username,
				)
				return nil, exceptions.AlreadyExists("user", "username", req.Username, nil,
					exceptions.WithOperation("update_user"))
			}
		}

		// Update user fields based on request
		if req.Username != "" {
			user.Username = req.Username
		}
		if req.RoleIDs != nil {
			user.RoleIds = req.RoleIDs
		}
		if req.MajorID != user.MajorId {
			user.MajorId = req.MajorID
		}
		
		// Update name if provided
		if req.FirstName != "" || req.MiddleName != "" || req.LastName != "" {
			if user.Name == nil {
				user.Name = &userPb.Name{}
			}
			if req.FirstName != "" {
				user.Name.FirstName = req.FirstName
			}
			if req.MiddleName != "" {
				user.Name.MiddleName = req.MiddleName
			}
			if req.LastName != "" {
				user.Name.LastName = req.LastName
			}
		}

		// Set isActivated if provided
		if req.IsActivated != nil {
			user.IsActivated = *req.IsActivated
		}

		user.UpdatedAt = time.Now().Format(time.RFC3339)

		// Update user in repository
		if err := s.userRepository.UpdateUser(ctx, user); err != nil {
			logger.Error("Failed to update user in database", err,
				logging.FieldOperation, "update_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, id,
				"username", user.Username,
			)
			return nil, err
		}

		logger.Info("User updated successfully",
			logging.FieldOperation, "update_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, id,
			"username", user.Username,
		)

		// Get roles for response
		roles := make([]*userPb.Role, 0)
		for _, roleID := range user.RoleIds {
			objectID, err := primitive.ObjectIDFromHex(roleID)
			if err != nil {
				logger.Warn("Invalid role ID format, skipping role",
					logging.FieldOperation, "update_user",
					logging.FieldEntity, "role",
					"role_id", roleID,
					"username", user.Username,
				)
				continue
			}
			role, err := s.roleRepository.FindRoleByID(ctx, objectID)
			if err != nil {
				logger.Warn("Failed to get role, skipping",
					logging.FieldOperation, "update_user",
					logging.FieldEntity, "role",
					"role_id", roleID,
					"username", user.Username,
				)
				continue
			}
			roles = append(roles, role)
		}

		// Get major information if provided
		var major *majorPb.Major
		var majorID string
		if user.MajorId != "" {
			logger.Info("Retrieving major data for updated user",
				logging.FieldOperation, "update_user",
				logging.FieldEntity, "user",
				"username", user.Username,
				"major_id", user.MajorId,
			)

			major, err = s.GetMajor(ctx, user.MajorId)
			if err != nil {
				// Log error but continue - major is optional
				logger.Warn("Failed to get major data, continuing without it",
					logging.FieldOperation, "update_user",
					logging.FieldEntity, "major",
					logging.FieldEntityID, user.MajorId,
					"username", user.Username,
				)
				// Continue without major info
			} else if major != nil {
				logger.Info("Retrieved major data for updated user",
					logging.FieldOperation, "update_user",
					logging.FieldEntity, "major",
					logging.FieldEntityID, user.MajorId,
					"username", user.Username,
				)
				majorID = user.MajorId
			}
		}

		response := &dto.UserResponse{
			ID:       user.Id,
			Username: user.Username,
			Name: dto.Name{
				FirstName:  user.Name.FirstName,
				MiddleName: user.Name.MiddleName,
				LastName:   user.Name.LastName,
			},
			Roles:       roles,
			MajorID:     majorID,
			Major:       major,
			IsActivated: user.IsActivated,
		}

		return response, nil
	})(ctx)
}

func (s *userService) DeleteUser(ctx context.Context, id string) error {
	_, err := decorator.WithTimeout[struct{}](5 * time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deleting user",
			logging.FieldOperation, "delete_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, id,
		)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid user ID format", err,
				logging.FieldOperation, "delete_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, id,
			)
			return struct{}{}, exceptions.InvalidInput("invalid user ID format", err,
				exceptions.WithOperation("delete_user"),
				exceptions.WithEntity("user", id))
		}

		if err := s.userRepository.DeleteUser(ctx, objectID); err != nil {
			logger.Error("Failed to delete user", err,
				logging.FieldOperation, "delete_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, id,
			)
			return struct{}{}, err
		}

		logger.Info("User deleted successfully",
			logging.FieldOperation, "delete_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, id,
		)

		return struct{}{}, nil
	})(ctx)

	return err
}

func (s *userService) ValidatePassword(ctx context.Context, username, password string) (bool, error) {
	return decorator.WithTimeout[bool](5 * time.Second)(func(ctx context.Context) (bool, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Validating password",
			logging.FieldOperation, "validate_password",
			logging.FieldEntity, "user",
			"username", username,
		)

		// Directly use the repository's ValidatePassword method which retrieves the user
		// with the password hash and does the comparison
		isValid, err := s.userRepository.ValidatePassword(ctx, username, password)
		if err != nil {
			logger.Error("Failed to validate password", err,
				logging.FieldOperation, "validate_password",
				logging.FieldEntity, "user",
				"username", username,
			)
			return false, err
		}

		if !isValid {
			logger.Warn("Invalid password attempt",
				logging.FieldOperation, "validate_password",
				logging.FieldEntity, "user",
				"username", username,
			)
			return false, nil
		}

		logger.Info("Password validated successfully",
			logging.FieldOperation, "validate_password",
			logging.FieldEntity, "user",
			"username", username,
		)
		return true, nil
	})(ctx)
}

func (s *userService) CheckUsername(ctx context.Context, req *dto.CheckUsernameRequest) (*dto.CheckUsernameResponse, error) {
	return decorator.WithTimeout[*dto.CheckUsernameResponse](5 * time.Second)(func(ctx context.Context) (*dto.CheckUsernameResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Checking username availability",
			logging.FieldOperation, "check_username",
			logging.FieldEntity, "user",
			"username", req.Username,
		)

		// Check if username exists
		existingUser, err := s.userRepository.FindByUsername(ctx, req.Username)
		if err != nil && !exceptions.IsNotFound(err) {
			logger.Error("Failed to check username availability", err,
				logging.FieldOperation, "check_username",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return nil, err
		}

		exists := existingUser != nil
		var userInfo *dto.UserInfo
		
		if exists {
			userInfo = &dto.UserInfo{
				ID:         existingUser.Id,
				Username:   existingUser.Username,
				IsActivated: existingUser.IsActivated,
			}
			
			// Set name if available
			if existingUser.Name != nil {
				userInfo.Name = dto.Name{
					FirstName:  existingUser.Name.FirstName,
					MiddleName: existingUser.Name.MiddleName,
					LastName:   existingUser.Name.LastName,
				}
		}

			// Get major if available
			if existingUser.MajorId != "" {
				major, majorErr := s.GetMajor(ctx, existingUser.MajorId)
				if majorErr == nil && major != nil {
					userInfo.MajorID = existingUser.MajorId
				userInfo.Major = major
				}
			}
		}

		response := &dto.CheckUsernameResponse{
			Exists: exists,
			User:   userInfo,
		}

		if exists {
			logger.Info("Username is not available",
				logging.FieldOperation, "check_username",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
		} else {
			logger.Info("Username is available",
				logging.FieldOperation, "check_username",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
		}

		return response, nil
	})(ctx)
}

func (s *userService) SetPassword(ctx context.Context, req *dto.SetPasswordRequest) (*dto.SetPasswordResponse, error) {
	return decorator.WithTimeout[*dto.SetPasswordResponse](5 * time.Second)(func(ctx context.Context) (*dto.SetPasswordResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Setting user password",
			logging.FieldOperation, "set_password",
			logging.FieldEntity, "user",
			"username", req.Username,
		)

		// Find user
		user, err := s.userRepository.FindByUsername(ctx, req.Username)
		if err != nil {
			logger.Error("Failed to find user for password setting", err,
				logging.FieldOperation, "set_password",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return nil, err
		}

		// Hash and set new password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			logger.Error("Failed to hash new password", err,
				logging.FieldOperation, "set_password",
				logging.FieldEntity, "user",
				"username", req.Username,
			)
			return nil, exceptions.Internal("failed to hash password", err,
				exceptions.WithOperation("set_password"))
		}

		user.Password = string(hashedPassword)
		user.IsActivated = true
		user.UpdatedAt = time.Now().Format(time.RFC3339)

		// Update user with new password
		if err := s.userRepository.UpdateUser(ctx, user); err != nil {
			logger.Error("Failed to update user with new password", err,
				logging.FieldOperation, "set_password",
				logging.FieldEntity, "user",
				logging.FieldEntityID, user.Id,
				"username", req.Username,
			)
			return nil, err
		}

		logger.Info("Password set successfully",
			logging.FieldOperation, "set_password",
			logging.FieldEntity, "user",
			logging.FieldEntityID, user.Id,
			"username", req.Username,
		)

		return &dto.SetPasswordResponse{
			Success: true,
			Message: "Password set successfully",
		}, nil
	})(ctx)
}

func (s *userService) GetMajor(ctx context.Context, majorID string) (*majorPb.Major, error) {
	return decorator.WithTimeout[*majorPb.Major](3*time.Second)(func(ctx context.Context) (*majorPb.Major, error) {
		logger := logging.DefaultLogger.WithContext(ctx)

		logger.Info("Getting major details from service",
			logging.FieldOperation, "get_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, majorID,
		)

		// Get the major client
		majorClient, err := core.GetMajorServiceClient(ctx)
		if err != nil {
			logger.Error("Failed to get major client", err,
				logging.FieldOperation, "get_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, majorID,
			)
			return nil, exceptions.Internal("failed to connect to major service", err,
				exceptions.WithOperation("get_major"))
		}

		// Create a context with timeout for the gRPC call
		grpcCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
		defer cancel()

		// Make the gRPC call
		resp, err := majorClient.GetMajor(grpcCtx, &majorPb.GetMajorRequest{
			Id: majorID,
		})
	if err != nil {
			logger.Error("Failed to get major from gRPC service", err,
				logging.FieldOperation, "get_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, majorID,
			)
			return nil, exceptions.Internal("failed to get major details from service", err,
				exceptions.WithOperation("get_major"))
		}

		if resp == nil || resp.Major == nil {
			logger.Warn("Major not found or empty response",
				logging.FieldOperation, "get_major",
				logging.FieldEntity, "major",
				logging.FieldEntityID, majorID,
			)
			return nil, exceptions.NotFound("major", majorID, nil,
				exceptions.WithOperation("get_major"))
		}

		logger.Info("Retrieved major details successfully",
			logging.FieldOperation, "get_major",
			logging.FieldEntity, "major",
			logging.FieldEntityID, majorID,
			"major_name", resp.Major.Name,
		)
		return resp.Major, nil
	})(ctx)
}

// ActivateUser activates a user by setting their IsActivated status to true
func (s *userService) ActivateUser(ctx context.Context, req *dto.ActivateUserRequest) (*dto.ActivateUserResponse, error) {
	return decorator.WithTimeout[*dto.ActivateUserResponse](10*time.Second)(func(ctx context.Context) (*dto.ActivateUserResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Activating user",
			logging.FieldOperation, "activate_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, req.UserID,
		)

		objectID, err := primitive.ObjectIDFromHex(req.UserID)
		if err != nil {
			logger.Error("Invalid user ID format", err,
				logging.FieldOperation, "activate_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, req.UserID,
			)
			return nil, exceptions.InvalidInput("Invalid user ID format", err,
				exceptions.WithOperation("activate_user"),
				exceptions.WithEntity("user", req.UserID))
		}

		// Get the existing user
		user, err := s.userRepository.FindByID(ctx, objectID)
		if err != nil {
			logger.Error("Failed to find user for activation", err,
				logging.FieldOperation, "activate_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, req.UserID,
			)
			return nil, err
		}

		// Set isActivated to true
		user.IsActivated = true
		user.UpdatedAt = time.Now().Format(time.RFC3339)

		// Update user in repository
		if err := s.userRepository.UpdateUser(ctx, user); err != nil {
			logger.Error("Failed to update user activation status", err,
				logging.FieldOperation, "activate_user",
				logging.FieldEntity, "user",
				logging.FieldEntityID, req.UserID,
			)
			return nil, err
		}

		logger.Info("User activated successfully",
			logging.FieldOperation, "activate_user",
			logging.FieldEntity, "user",
			logging.FieldEntityID, req.UserID,
		)

		return &dto.ActivateUserResponse{
			Success: true,
			Message: "User activated successfully",
			UserID:  req.UserID,
		}, nil
	})(ctx)
}
