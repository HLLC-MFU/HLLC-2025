package http

import (
	"context"
	"errors"
	"log"
	"time"

	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
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
		log.Printf("CreateUser: Creating new user with username %s", req.Username)

		// Check if user exists
		existingUser, err := s.userRepository.FindByUsername(ctx, req.Username)
		if err != nil && !errors.Is(err, exceptions.NewAppError(exceptions.ErrNotFound, "User not found", nil)) {
			log.Printf("CreateUser: Error checking for existing user: %v", err)
			return nil, err
		}
		if existingUser != nil {
			log.Printf("CreateUser: User with username %s already exists", req.Username)
			return nil, exceptions.NewAppError(exceptions.ErrConflict, "User already exists", nil)
		}

		var hashedPassword string
		isActivated := req.IsActivated

		// If password is provided and user should be activated
		if req.Password != "" && isActivated {
			hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			if err != nil {
				log.Printf("CreateUser: Error hashing password: %v", err)
				return nil, err
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
			log.Printf("CreateUser: Error saving user to database: %v", err)
			return nil, err
		}

		log.Printf("CreateUser: User %s created successfully with ID %s", newUser.Username, newUser.Id)

		// Get roles for response
		roles := make([]*userPb.Role, 0)
		for _, roleID := range req.RoleIDs {
			objectID, err := primitive.ObjectIDFromHex(roleID)
			if err != nil {
				log.Printf("CreateUser: Invalid role ID format %s: %v", roleID, err)
				continue
			}
			role, err := s.roleRepository.FindRoleByID(ctx, objectID)
			if err != nil {
				log.Printf("CreateUser: Failed to get role with ID %s: %v", roleID, err)
				continue
			}
			roles = append(roles, role)
		}

		// Get major information if provided
		var major *majorPb.Major
		var majorID string
		if req.MajorID != "" {
			log.Printf("CreateUser: User %s has majorID %s, retrieving major data", newUser.Username, req.MajorID)

			major, err = s.GetMajor(ctx, req.MajorID)
			if err != nil {
				// Log error but continue - major is optional
				log.Printf("CreateUser: Failed to get major with ID %s: %v", req.MajorID, err)
				// Continue without major info
			} else if major != nil {
				log.Printf("CreateUser: Successfully retrieved major data for new user %s", newUser.Username)
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

		log.Printf("CreateUser: Successfully created and retrieved user %s", newUser.Username)
		return response, nil
	})(ctx)
}

func (s *userService) GetUserByID(ctx context.Context, id string) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](5 * time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		log.Printf("GetUserByID: Fetching user with ID %s", id)
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("GetUserByID: Invalid ID format %s: %v", id, err)
			return nil, err
		}

		user, err := s.userRepository.FindByID(ctx, objectID)
		if err != nil {
			log.Printf("GetUserByID: Error finding user: %v", err)
			return nil, err
		}

		// Get roles
		roles := make([]*userPb.Role, 0)
		for _, roleID := range user.RoleIds {
			objectID, err := primitive.ObjectIDFromHex(roleID)
			if err != nil {
				log.Printf("GetUserByID: Invalid role ID format %s: %v", roleID, err)
				continue
			}
			role, err := s.roleRepository.FindRoleByID(ctx, objectID)
			if err != nil {
				log.Printf("GetUserByID: Failed to get role with ID %s: %v", roleID, err)
				continue
			}
			roles = append(roles, role)
		}

		// Get major information if provided
		var major *majorPb.Major
		var majorID string
		if user.MajorId != "" {
			log.Printf("GetUserByID: User %s has majorID %s, retrieving major data", user.Username, user.MajorId)

			major, err = s.GetMajor(ctx, user.MajorId)
			if err != nil {
				// Log error but continue - major is optional
				log.Printf("GetUserByID: Failed to get major with ID %s: %v", user.MajorId, err)
				// Continue without major info
			} else if major != nil {
				log.Printf("GetUserByID: Successfully retrieved major data for user %s", user.Username)
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

		log.Printf("GetUserByID: Successfully retrieved user %s", user.Username)
		return response, nil
	})(ctx)
}

func (s *userService) GetUserByUsername(ctx context.Context, username string) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](5 * time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		log.Printf("GetUserByUsername: Fetching user with username %s", username)

		user, err := s.userRepository.FindByUsername(ctx, username)
		if err != nil {
			log.Printf("GetUserByUsername: Error finding user: %v", err)
			return nil, err
		}

		// Get roles
		roles := make([]*userPb.Role, 0)
		for _, roleID := range user.RoleIds {
			objectID, err := primitive.ObjectIDFromHex(roleID)
			if err != nil {
				log.Printf("GetUserByUsername: Invalid role ID format %s: %v", roleID, err)
				continue
			}
			role, err := s.roleRepository.FindRoleByID(ctx, objectID)
			if err != nil {
				log.Printf("GetUserByUsername: Failed to get role with ID %s: %v", roleID, err)
				continue
			}
			roles = append(roles, role)
		}

		// Get major information if provided
		var major *majorPb.Major
		var majorID string
		if user.MajorId != "" {
			log.Printf("GetUserByUsername: User %s has majorID %s, retrieving major data", user.Username, user.MajorId)

			major, err = s.GetMajor(ctx, user.MajorId)
			if err != nil {
				// Log error but continue - major is optional
				log.Printf("GetUserByUsername: Failed to get major with ID %s: %v", user.MajorId, err)
				// Continue without major info
			} else if major != nil {
				log.Printf("GetUserByUsername: Successfully retrieved major data for user %s", user.Username)
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

		log.Printf("GetUserByUsername: Successfully retrieved user %s", user.Username)
		return response, nil
	})(ctx)
}

func (s *userService) GetAllUsers(ctx context.Context) ([]*dto.UserResponse, error) {
	return decorator.WithTimeout[[]*dto.UserResponse](10 * time.Second)(func(ctx context.Context) ([]*dto.UserResponse, error) {
		log.Printf("GetAllUsers: Fetching all users")

		users, err := s.userRepository.FindAll(ctx)
		if err != nil {
			log.Printf("GetAllUsers: Error finding users: %v", err)
			return nil, err
		}

		responses := make([]*dto.UserResponse, 0, len(users))
		for _, user := range users {
			// Create response for each user
			resp := &dto.UserResponse{
				ID:       user.Id,
				Username: user.Username,
				Name: dto.Name{
					FirstName:  user.Name.FirstName,
					MiddleName: user.Name.MiddleName,
					LastName:   user.Name.LastName,
				},
				MajorID: user.MajorId,
			}

			// Get roles for this user
			roles := make([]*userPb.Role, 0)
			for _, roleID := range user.RoleIds {
				objectID, err := primitive.ObjectIDFromHex(roleID)
				if err != nil {
					log.Printf("GetAllUsers: Invalid role ID format %s: %v", roleID, err)
					continue
				}
				role, err := s.roleRepository.FindRoleByID(ctx, objectID)
				if err != nil {
					log.Printf("GetAllUsers: Failed to get role with ID %s: %v", roleID, err)
					continue
				}
				roles = append(roles, role)
			}
			resp.Roles = roles

			// Get major information if provided
			if user.MajorId != "" {
				log.Printf("GetAllUsers: User %s has majorID %s, retrieving major data", user.Username, user.MajorId)

				major, err := s.GetMajor(ctx, user.MajorId)
				if err != nil {
					// Log error but continue - major is optional
					log.Printf("GetAllUsers: Failed to get major with ID %s: %v", user.MajorId, err)
					// Continue without major info
				} else if major != nil {
					log.Printf("GetAllUsers: Successfully retrieved major data for user %s", user.Username)
					resp.Major = major
				} else {
					log.Printf("GetAllUsers: Major service returned nil for ID: %s", user.MajorId)
				}
			}

			responses = append(responses, resp)
		}

		log.Printf("GetAllUsers: Successfully retrieved %d users", len(responses))
		return responses, nil
	})(ctx)
}

func (s *userService) UpdateUser(ctx context.Context, id string, req *dto.UpdateUserRequest) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](10 * time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		log.Printf("UpdateUser: Updating user with ID %s", id)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("UpdateUser: Invalid ID format %s: %v", id, err)
			return nil, err
		}

		// Get existing user
		user, err := s.userRepository.FindByID(ctx, objectID)
		if err != nil {
			log.Printf("UpdateUser: Error finding user: %v", err)
			return nil, err
		}

		// Update fields if provided
		if req.Username != "" {
			user.Username = req.Username
		}

		if req.Name.FirstName != "" || req.Name.LastName != "" || req.Name.MiddleName != "" {
			if user.Name == nil {
				user.Name = &userPb.Name{}
			}
			if req.Name.FirstName != "" {
				user.Name.FirstName = req.Name.FirstName
			}
			if req.Name.MiddleName != "" {
				user.Name.MiddleName = req.Name.MiddleName
			}
			if req.Name.LastName != "" {
				user.Name.LastName = req.Name.LastName
			}
		}

		if req.RoleIDs != nil {
			user.RoleIds = req.RoleIDs
		}

		if req.MajorID != "" {
			user.MajorId = req.MajorID
		}

		// Update password if provided
		if req.Password != "" {
			hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			if err != nil {
				log.Printf("UpdateUser: Error hashing password: %v", err)
				return nil, err
			}
			user.Password = string(hashed)
		}

		// Save updated user
		if err := s.userRepository.UpdateUser(ctx, user); err != nil {
			log.Printf("UpdateUser: Error updating user: %v", err)
			return nil, err
		}

		// Get roles for response
		roles := make([]*userPb.Role, 0)
		for _, roleID := range user.RoleIds {
			objectID, err := primitive.ObjectIDFromHex(roleID)
			if err != nil {
				log.Printf("UpdateUser: Invalid role ID format %s: %v", roleID, err)
				continue
			}
			role, err := s.roleRepository.FindRoleByID(ctx, objectID)
			if err != nil {
				log.Printf("UpdateUser: Failed to get role with ID %s: %v", roleID, err)
				continue
			}
			roles = append(roles, role)
		}

		// Get major information if provided
		var major *majorPb.Major
		var majorID string
		if user.MajorId != "" {
			log.Printf("UpdateUser: User %s has majorID %s, retrieving major data", user.Username, user.MajorId)

			major, err = s.GetMajor(ctx, user.MajorId)
			if err != nil {
				// Log error but continue - major is optional
				log.Printf("UpdateUser: Failed to get major with ID %s: %v", user.MajorId, err)
				// Continue without major info
			} else if major != nil {
				log.Printf("UpdateUser: Successfully retrieved major data for user %s", user.Username)
				majorID = user.MajorId
			} else {
				log.Printf("UpdateUser: Major service returned nil for ID: %s", user.MajorId)
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
			Roles:   roles,
			MajorID: majorID,
			Major:   major,
		}

		log.Printf("UpdateUser: Successfully updated user %s", user.Username)
		return response, nil
	})(ctx)
}

func (s *userService) DeleteUser(ctx context.Context, id string) error {
	_, innerErr := decorator.WithTimeout[struct{}](5 * time.Second)(func(ctx context.Context) (struct{}, error) {
		log.Printf("DeleteUser: Deleting user with ID %s", id)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("DeleteUser: Invalid ID format %s: %v", id, err)
			return struct{}{}, err
		}

		if err := s.userRepository.DeleteUser(ctx, objectID); err != nil {
			log.Printf("DeleteUser: Error deleting user: %v", err)
			return struct{}{}, err
		}

		log.Printf("DeleteUser: Successfully deleted user with ID %s", id)
		return struct{}{}, nil
	})(ctx)

	return innerErr
}

func (s *userService) ValidatePassword(ctx context.Context, username, password string) (bool, error) {
	var valid bool
	_, err := decorator.WithTimeout[struct{}](5 * time.Second)(func(ctx context.Context) (struct{}, error) {
		log.Printf("ValidatePassword: Validating password for user %s", username)

		user, err := s.userRepository.FindByUsername(ctx, username)
		if err != nil {
			log.Printf("ValidatePassword: Error finding user: %v", err)
			return struct{}{}, err
		}

		// Validate password with BCrypt
		err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
		if err != nil {
			log.Printf("ValidatePassword: Invalid password for user %s: %v", username, err)
			return struct{}{}, nil
		}

		log.Printf("ValidatePassword: Password validated successfully for user %s", username)
		valid = true
		return struct{}{}, nil
	})(ctx)

	if err != nil {
		if errors.Is(err, exceptions.NewAppError(exceptions.ErrNotFound, "User not found", nil)) {
			log.Printf("ValidatePassword: User %s not found", username)
			return false, exceptions.NewAppError(exceptions.ErrNotFound, "User not found", nil)
		}
		return false, exceptions.NewAppError(exceptions.ErrInternalServerError, "Internal server error", err)
	}

	return valid, nil
}

func (s *userService) CheckUsername(ctx context.Context, req *dto.CheckUsernameRequest) (*dto.CheckUsernameResponse, error) {
	return decorator.WithTimeout[*dto.CheckUsernameResponse](5 * time.Second)(func(ctx context.Context) (*dto.CheckUsernameResponse, error) {
		log.Printf("CheckUsername: Checking if username %s exists", req.Username)

		user, err := s.userRepository.FindByUsername(ctx, req.Username)
		if err != nil {
			if errors.Is(err, exceptions.NewAppError(exceptions.ErrNotFound, "User not found", nil)) {
				// Username does not exist
				return &dto.CheckUsernameResponse{
					Exists: false,
				}, nil
			}
			return nil, err
		}

		// Username exists, return user info
		userInfo := &dto.UserInfo{
			ID:       user.Id,
			Username: user.Username,
			Name: dto.Name{
				FirstName:  user.Name.FirstName,
				MiddleName: user.Name.MiddleName,
				LastName:   user.Name.LastName,
			},
			MajorID:     user.MajorId,
			IsActivated: user.IsActivated,
		}

		// Get major information if provided
		if user.MajorId != "" {
			log.Printf("CheckUsername: User %s has majorID %s, retrieving major data", user.Username, user.MajorId)

			major, err := s.GetMajor(ctx, user.MajorId)
			if err != nil {
				// Log error but continue - major is optional
				log.Printf("CheckUsername: Failed to get major with ID %s: %v", user.MajorId, err)
				// Continue without major info
			} else if major != nil {
				log.Printf("CheckUsername: Successfully retrieved major data for user %s", user.Username)
				userInfo.Major = major
			}
		}

		return &dto.CheckUsernameResponse{
			Exists: true,
			User:   userInfo,
		}, nil
	})(ctx)
}

func (s *userService) SetPassword(ctx context.Context, req *dto.SetPasswordRequest) (*dto.SetPasswordResponse, error) {
	return decorator.WithTimeout[*dto.SetPasswordResponse](5 * time.Second)(func(ctx context.Context) (*dto.SetPasswordResponse, error) {
		log.Printf("SetPassword: Setting password for user %s", req.Username)

		// Find user
		user, err := s.userRepository.FindByUsername(ctx, req.Username)
		if err != nil {
			if errors.Is(err, exceptions.NewAppError(exceptions.ErrNotFound, "User not found", nil)) {
				return &dto.SetPasswordResponse{
					Success: false,
					Message: "User not found",
				}, nil
			}
			return nil, err
		}

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("SetPassword: Error hashing password: %v", err)
			return nil, err
		}

		// Convert ID
		objectID, err := primitive.ObjectIDFromHex(user.Id)
		if err != nil {
			log.Printf("SetPassword: Invalid ID format %s: %v", user.Id, err)
			return nil, err
		}

		// Update password and activate user
		if err := s.userRepository.UpdatePassword(ctx, objectID, string(hashedPassword)); err != nil {
			log.Printf("SetPassword: Error updating password: %v", err)
			return nil, err
		}

		// Update user's activated status if not already activated
		if !user.IsActivated {
			user.IsActivated = true
			if err := s.userRepository.UpdateUser(ctx, user); err != nil {
				log.Printf("SetPassword: Error activating user: %v", err)
				// Continue anyway since password was updated
			}
		}

		log.Printf("SetPassword: Successfully set password for user %s", req.Username)
		return &dto.SetPasswordResponse{
			Success: true,
			Message: "Password set successfully",
		}, nil
	})(ctx)
}

// Internal function to get major information
// This function is not exposed in the gRPC service but is used internally
func (g *userService) GetMajor(ctx context.Context, majorID string) (*majorPb.Major, error) {
	if majorID == "" {
		return nil, nil
	}

	client, err := core.GetMajorServiceClient(ctx)
	if err != nil {
		log.Printf("grpcMajorService: Failed to get major client: %v", err)
		return nil, err
	}

	res, err := client.GetMajor(ctx, &majorPb.GetMajorRequest{Id: majorID})
	if err != nil {
		log.Printf("grpcMajorService: Error calling GetMajor: %v", err)
		return nil, err
	}

	return res.Major, nil
}
