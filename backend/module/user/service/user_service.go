package service

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"

	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
)

// Error definitions
var (
	ErrUserNotFound = errors.New("user not found")
	ErrUserExists   = errors.New("user with this username already exists")
)

// UserService defines the user service operations
type UserService interface {
	// User management with protocol buffers
	CreateUserGRPC(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error)
	GetUserGRPC(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error)
	GetAllUsersGRPC(ctx context.Context, req *userPb.GetAllUsersRequest) (*userPb.GetAllUsersResponse, error)
	UpdateUserGRPC(ctx context.Context, req *userPb.UpdateUserRequest) (*userPb.User, error)
	DeleteUserGRPC(ctx context.Context, req *userPb.DeleteUserRequest) (*userPb.Empty, error)
	ValidateCredentialsGRPC(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error)
	CheckUsernameGRPC(ctx context.Context, req *userPb.CheckUsernameRequest) (*userPb.CheckUsernameResponse, error)
	SetPasswordGRPC(ctx context.Context, req *userPb.SetPasswordRequest) (*userPb.SetPasswordResponse, error)
	
	// Legacy methods that will be deprecated in future versions
	CreateUser(ctx context.Context, req *dto.CreateUserRequest) (*dto.UserResponse, error)
	GetUserByID(ctx context.Context, id string) (*dto.UserResponse, error)
	GetUserByUsername(ctx context.Context, username string) (*dto.UserResponse, error)
	GetAllUsers(ctx context.Context) ([]*dto.UserResponse, error)
	UpdateUser(ctx context.Context, id string, req *dto.UpdateUserRequest) (*dto.UserResponse, error)
	DeleteUser(ctx context.Context, id string) error
	ValidatePassword(ctx context.Context, username, password string) (bool, error)
	CheckUsername(ctx context.Context, req *dto.CheckUsernameRequest) (*dto.CheckUsernameResponse, error)
	SetPassword(ctx context.Context, req *dto.SetPasswordRequest) (*dto.SetPasswordResponse, error)
}

// userService implements UserService
type userService struct {
	cfg          *config.Config
	userRepo     repository.UserRepositoryService
	roleRepo     repository.RoleRepositoryService
	permRepo     repository.PermissionRepositoryService
	majorService MajorService
}

// NewUserService creates a new user service
func NewUserService(
	cfg *config.Config,
	userRepo repository.UserRepositoryService,
	roleRepo repository.RoleRepositoryService, 
	permRepo repository.PermissionRepositoryService,
	majorSvc MajorService,
) UserService {
	log.Printf("Initializing UserService with MajorService: %T", majorSvc)
	return &userService{
		cfg:          cfg,
		userRepo:     userRepo,
		roleRepo:     roleRepo,
		permRepo:     permRepo,
		majorService: majorSvc,
	}
}

// getMajorInfo retrieves major information using gRPC client
func (s *userService) getMajorInfo(ctx context.Context, majorID string) (*majorPb.Major, error) {
	if majorID == "" {
		return nil, nil
	}

	majorClient, err := core.GetMajorServiceClient(ctx)
	if err != nil {
		log.Printf("Warning: Failed to get major client: %v", err)
		return nil, err
	}

	response, err := majorClient.GetMajor(ctx, &majorPb.GetMajorRequest{Id: majorID})
	if err != nil {
		log.Printf("Warning: Failed to get major info: %v", err)
		return nil, err
	}

	return response.Major, nil
}

// HTTP Service implementations with decorator pattern
func (s *userService) CreateUser(ctx context.Context, req *dto.CreateUserRequest) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](10*time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		log.Printf("CreateUser: Creating new user with username %s", req.Username)
		
		// Check if user exists
		existingUser, err := s.userRepo.FindByUsername(ctx, req.Username)
		if err != nil && !errors.Is(err, repository.ErrNotFound) {
			log.Printf("CreateUser: Error checking for existing user: %v", err)
			return nil, err
		}
		if existingUser != nil {
			log.Printf("CreateUser: User with username %s already exists", req.Username)
			return nil, ErrUserExists
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
			Id:        primitive.NewObjectID().Hex(),
			Username:  req.Username,
			Password:  hashedPassword,
			RoleIds:   req.RoleIDs,
			MajorId:   req.MajorID,
			Name: &userPb.Name{
				FirstName:  req.Name.FirstName,
				MiddleName: req.Name.MiddleName,
				LastName:   req.Name.LastName,
			},
			CreatedAt: time.Now().Format(time.RFC3339),
			UpdatedAt: time.Now().Format(time.RFC3339),
			IsActivated: isActivated,
		}

		// Save user
		if err := s.userRepo.CreateUser(ctx, newUser); err != nil {
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
			role, err := s.roleRepo.FindRoleByID(ctx, objectID)
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
			
			major, err = s.getMajorInfo(ctx, req.MajorID)
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
			Roles:      roles,
			MajorID:    majorID,
			Major:      major,
			IsActivated: newUser.IsActivated,
		}
		
		log.Printf("CreateUser: Successfully created and retrieved user %s", newUser.Username)
		return response, nil
	})(ctx)
}

func (s *userService) GetUserByID(ctx context.Context, id string) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](5*time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		log.Printf("GetUserByID: Fetching user with ID %s", id)
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("GetUserByID: Invalid ID format %s: %v", id, err)
			return nil, err
		}

		user, err := s.userRepo.FindByID(ctx, objectID)
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
			role, err := s.roleRepo.FindRoleByID(ctx, objectID)
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
			
			major, err = s.getMajorInfo(ctx, user.MajorId)
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
	return decorator.WithTimeout[*dto.UserResponse](5*time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		log.Printf("GetUserByUsername: Fetching user with username %s", username)
		
		user, err := s.userRepo.FindByUsername(ctx, username)
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
			role, err := s.roleRepo.FindRoleByID(ctx, objectID)
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
			
			major, err = s.getMajorInfo(ctx, user.MajorId)
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
	return decorator.WithTimeout[[]*dto.UserResponse](10*time.Second)(func(ctx context.Context) ([]*dto.UserResponse, error) {
		log.Printf("GetAllUsers: Fetching all users")
		
		users, err := s.userRepo.FindAll(ctx)
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
				role, err := s.roleRepo.FindRoleByID(ctx, objectID)
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
				
				major, err := s.getMajorInfo(ctx, user.MajorId)
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
	return decorator.WithTimeout[*dto.UserResponse](10*time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		log.Printf("UpdateUser: Updating user with ID %s", id)
		
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("UpdateUser: Invalid ID format %s: %v", id, err)
			return nil, err
		}

		// Get existing user
		user, err := s.userRepo.FindByID(ctx, objectID)
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
		if err := s.userRepo.UpdateUser(ctx, user); err != nil {
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
			role, err := s.roleRepo.FindRoleByID(ctx, objectID)
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
			
			major, err = s.getMajorInfo(ctx, user.MajorId)
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
	_, innerErr := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		log.Printf("DeleteUser: Deleting user with ID %s", id)
		
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("DeleteUser: Invalid ID format %s: %v", id, err)
			return struct{}{}, err
		}

		if err := s.userRepo.DeleteUser(ctx, objectID); err != nil {
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
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		log.Printf("ValidatePassword: Validating password for user %s", username)
		
		user, err := s.userRepo.FindByUsername(ctx, username)
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
		if errors.Is(err, repository.ErrNotFound) {
			return false, ErrUserNotFound
		}
		return false, err
	}

	return valid, nil
}

// gRPC methods
func (s *userService) CreateUserGRPC(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error) {
	return decorator.WithTimeout[*userPb.User](10*time.Second)(func(ctx context.Context) (*userPb.User, error) {
		log.Printf("CreateUserGRPC: Creating new user with username %s", req.Username)
		
		// Check if user exists
		existingUser, err := s.userRepo.FindByUsername(ctx, req.Username)
		if err != nil && !errors.Is(err, repository.ErrNotFound) {
			return nil, err
		}
		if existingUser != nil {
			return nil, ErrUserExists
		}

		// Create user entity
		newUser := &userPb.User{
			Id:        primitive.NewObjectID().Hex(),
			Username:  req.Username,
			Password:  req.Password,
			RoleIds:   req.RoleIds,
			MajorId:   req.MajorId,
			Name:      req.Name,
			CreatedAt: time.Now().Format(time.RFC3339),
			UpdatedAt: time.Now().Format(time.RFC3339),
		}

		// Save user
		if err := s.userRepo.CreateUser(ctx, newUser); err != nil {
			return nil, err
		}

		return newUser, nil
	})(ctx)
}

func (s *userService) GetUserGRPC(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error) {
	return decorator.WithTimeout[*userPb.User](5*time.Second)(func(ctx context.Context) (*userPb.User, error) {
		log.Printf("GetUserGRPC: Fetching user with username %s", req.Username)
		
		user, err := s.userRepo.FindByUsername(ctx, req.Username)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				return nil, ErrUserNotFound
			}
			return nil, err
		}

		return user, nil
	})(ctx)
}

func (s *userService) ValidateCredentialsGRPC(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error) {
	return decorator.WithTimeout[*userPb.ValidateCredentialsResponse](5*time.Second)(func(ctx context.Context) (*userPb.ValidateCredentialsResponse, error) {
		log.Printf("ValidateCredentialsGRPC: Validating credentials for user %s", req.Username)
		
		// Get user
		user, err := s.userRepo.FindByUsername(ctx, req.Username)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				return &userPb.ValidateCredentialsResponse{
					Valid: false,
				}, nil
			}
			return nil, err
		}

		// Validate password
		valid := false
		if err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err == nil {
			valid = true
		}

		response := &userPb.ValidateCredentialsResponse{
			Valid: valid,
		}

		// Include user in response if valid
		if valid {
			response.User = user
		}

		log.Printf("ValidateCredentialsGRPC: Credentials validation result for %s: %v", req.Username, valid)
		return response, nil
	})(ctx)
}

func (s *userService) CheckUsername(ctx context.Context, req *dto.CheckUsernameRequest) (*dto.CheckUsernameResponse, error) {
	return decorator.WithTimeout[*dto.CheckUsernameResponse](5*time.Second)(func(ctx context.Context) (*dto.CheckUsernameResponse, error) {
		log.Printf("CheckUsername: Checking if username %s exists", req.Username)
		
		user, err := s.userRepo.FindByUsername(ctx, req.Username)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
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
			
			major, err := s.getMajorInfo(ctx, user.MajorId)
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
	return decorator.WithTimeout[*dto.SetPasswordResponse](5*time.Second)(func(ctx context.Context) (*dto.SetPasswordResponse, error) {
		log.Printf("SetPassword: Setting password for user %s", req.Username)
		
		// Find user
		user, err := s.userRepo.FindByUsername(ctx, req.Username)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
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
		if err := s.userRepo.UpdatePassword(ctx, objectID, string(hashedPassword)); err != nil {
			log.Printf("SetPassword: Error updating password: %v", err)
			return nil, err
		}

		// Update user's activated status if not already activated
		if !user.IsActivated {
			user.IsActivated = true
			if err := s.userRepo.UpdateUser(ctx, user); err != nil {
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

// Add temporary struct definitions to match updated proto
type protoUserWithJson struct {
	Id         string
	Username   string
	Password   string
	Name       *userPb.Name
	RoleIds    []string
	MajorId    string
	MajorJson  string
	CreatedAt  string
	UpdatedAt  string
	IsActivated bool
}

type protoUserInfoWithJson struct {
	Id         string
	Username   string
	Name       *userPb.Name
	MajorId    string
	MajorJson  string
	IsActivated bool
}

// GetAllUsersGRPC method implementation
func (s *userService) GetAllUsersGRPC(ctx context.Context, req *userPb.GetAllUsersRequest) (*userPb.GetAllUsersResponse, error) {
	return decorator.WithTimeout[*userPb.GetAllUsersResponse](10*time.Second)(func(ctx context.Context) (*userPb.GetAllUsersResponse, error) {
		log.Printf("GetAllUsersGRPC: Fetching users with pagination")
		
		// Use default values for pagination until proto is regenerated
		page := int32(1)  // Default page
		limit := int32(10) // Default limit
		
		// Get paginated users from repository
		users, _, err := s.userRepo.FindAllPaginated(ctx, page, limit)
		if err != nil {
			log.Printf("GetAllUsersGRPC: Error finding users: %v", err)
			return nil, err
		}
		
		// For each user, load related data like major
		enrichedUsers := make([]*userPb.User, 0, len(users))
		for _, user := range users {
			// Create a copy with our temporary struct that includes MajorJson field
			tempUser := &protoUserWithJson{
				Id:          user.Id,
				Username:    user.Username,
				Name:        user.Name,
				RoleIds:     user.RoleIds,
				MajorId:     user.MajorId,
				IsActivated: user.IsActivated,
				CreatedAt:   user.CreatedAt,
				UpdatedAt:   user.UpdatedAt,
			}
			
			// Get major information if provided
			if user.MajorId != "" {
				log.Printf("GetAllUsersGRPC: User %s has majorID %s, retrieving major data", user.Username, user.MajorId)
				
				major, err := s.getMajorInfo(ctx, user.MajorId)
				if err != nil {
					// Log error but continue - major is optional
					log.Printf("GetAllUsersGRPC: Failed to get major with ID %s: %v", user.MajorId, err)
				} else if major != nil {
					log.Printf("GetAllUsersGRPC: Successfully retrieved major data for user %s", user.Username)
					// Serialize major data to JSON
					majorJSON, err := json.Marshal(major)
					if err != nil {
						log.Printf("GetAllUsersGRPC: Failed to serialize major data: %v", err)
					} else {
						tempUser.MajorJson = string(majorJSON)
					}
				} else {
					log.Printf("GetAllUsersGRPC: Major service returned nil for ID: %s", user.MajorId)
				}
			}
			
			// Don't include password in the response
			tempUser.Password = ""
			
			// Convert back to regular User proto
			// For now, we lose the major_json field but we'll get it back when proto is regenerated
			userProto := &userPb.User{
				Id:          tempUser.Id,
				Username:    tempUser.Username,
				Password:    tempUser.Password,
				Name:        tempUser.Name,
				RoleIds:     tempUser.RoleIds,
				MajorId:     tempUser.MajorId,
				CreatedAt:   tempUser.CreatedAt,
				UpdatedAt:   tempUser.UpdatedAt,
				IsActivated: tempUser.IsActivated,
			}
			
			enrichedUsers = append(enrichedUsers, userProto)
		}
		
		log.Printf("GetAllUsersGRPC: Successfully retrieved %d users (page %d)", len(enrichedUsers), page)
		
		// Return the response with the existing structure
		return &userPb.GetAllUsersResponse{
			Users: enrichedUsers,
		}, nil
	})(ctx)
}

// CheckUsernameGRPC method implementation
func (s *userService) CheckUsernameGRPC(ctx context.Context, req *userPb.CheckUsernameRequest) (*userPb.CheckUsernameResponse, error) {
	return decorator.WithTimeout[*userPb.CheckUsernameResponse](5*time.Second)(func(ctx context.Context) (*userPb.CheckUsernameResponse, error) {
		log.Printf("CheckUsernameGRPC: Checking if username '%s' exists", req.Username)
		
		// Try to find the user with this username
		user, err := s.userRepo.FindByUsername(ctx, req.Username)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				// Username doesn't exist, return success
				log.Printf("CheckUsernameGRPC: Username '%s' is available", req.Username)
				return &userPb.CheckUsernameResponse{
					Exists: false,
				}, nil
			}
			// Other error occurred
			log.Printf("CheckUsernameGRPC: Error checking username: %v", err)
			return nil, err
		}
		
		// Username exists, populate userInfo with our temporary struct
		tempUserInfo := &protoUserInfoWithJson{
			Id:          user.Id,
			Username:    user.Username,
			Name:        user.Name,
			MajorId:     user.MajorId,
			IsActivated: user.IsActivated,
		}
		
		// Get major info if available
		if user.MajorId != "" {
			major, err := s.getMajorInfo(ctx, user.MajorId)
			if err == nil && major != nil {
				// Serialize major data to JSON
				majorJSON, err := json.Marshal(major)
				if err != nil {
					log.Printf("CheckUsernameGRPC: Failed to serialize major data: %v", err)
				} else {
					tempUserInfo.MajorJson = string(majorJSON)
				}
			}
		}
		
		// Convert back to regular UserInfo proto
		userInfo := &userPb.UserInfo{
			Id:          tempUserInfo.Id,
			Username:    tempUserInfo.Username,
			Name:        tempUserInfo.Name,
			MajorId:     tempUserInfo.MajorId,
			IsActivated: tempUserInfo.IsActivated,
		}
		
		log.Printf("CheckUsernameGRPC: Username '%s' already exists", req.Username)
		return &userPb.CheckUsernameResponse{
			Exists:   true,
			UserInfo: userInfo,
		}, nil
	})(ctx)
}

// Add the SetPasswordGRPC method implementation
func (s *userService) SetPasswordGRPC(ctx context.Context, req *userPb.SetPasswordRequest) (*userPb.SetPasswordResponse, error) {
	return decorator.WithTimeout[*userPb.SetPasswordResponse](5*time.Second)(func(ctx context.Context) (*userPb.SetPasswordResponse, error) {
		log.Printf("SetPasswordGRPC: Setting password for user '%s'", req.Username)
		
		// Find the user first
		user, err := s.userRepo.FindByUsername(ctx, req.Username)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				log.Printf("SetPasswordGRPC: User '%s' not found", req.Username)
				return &userPb.SetPasswordResponse{
					Success: false,
					Message: "User not found",
				}, nil
			}
			// Other error occurred
			log.Printf("SetPasswordGRPC: Error finding user: %v", err)
			return nil, err
		}
		
		// Hash the password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("SetPasswordGRPC: Error hashing password: %v", err)
			return nil, err
		}
		
		// Update the user's password
		objID, err := primitive.ObjectIDFromHex(user.Id)
		if err != nil {
			log.Printf("SetPasswordGRPC: Invalid user ID format: %v", err)
			return nil, err
		}
		
		// Update password
		err = s.userRepo.UpdatePassword(ctx, objID, string(hashedPassword))
		if err != nil {
			log.Printf("SetPasswordGRPC: Error updating password: %v", err)
			return nil, err
		}
		
		// Also set the user as activated
		user.IsActivated = true
		err = s.userRepo.UpdateUser(ctx, user)
		if err != nil {
			log.Printf("SetPasswordGRPC: Error activating user: %v", err)
			// Continue even if this fails - password was set
		}
		
		log.Printf("SetPasswordGRPC: Successfully set password for user '%s'", req.Username)
		return &userPb.SetPasswordResponse{
			Success: true,
			Message: "Password set successfully",
		}, nil
	})(ctx)
}

func (s *userService) UpdateUserGRPC(ctx context.Context, req *userPb.UpdateUserRequest) (*userPb.User, error) {
	return decorator.WithTimeout[*userPb.User](10*time.Second)(func(ctx context.Context) (*userPb.User, error) {
		log.Printf("UpdateUserGRPC: Updating user with ID %s", req.Id)
		
		objectID, err := primitive.ObjectIDFromHex(req.Id)
		if err != nil {
			log.Printf("UpdateUserGRPC: Invalid ID format: %v", err)
			return nil, err
		}

		// Get existing user
		user, err := s.userRepo.FindByID(ctx, objectID)
		if err != nil {
			log.Printf("UpdateUserGRPC: Error finding user: %v", err)
			return nil, err
		}

		// Update fields if provided
		if req.Username != "" {
			user.Username = req.Username
		}
		
		if req.Name != nil {
			user.Name = req.Name
		}
		
		if req.RoleIds != nil {
			user.RoleIds = req.RoleIds
		}
		
		if req.MajorId != "" {
			user.MajorId = req.MajorId
		}

		// Update password if provided
		if req.Password != "" {
			user.Password = req.Password
		}

		// Update timestamp
		user.UpdatedAt = time.Now().Format(time.RFC3339)

		// Save updated user
		if err := s.userRepo.UpdateUser(ctx, user); err != nil {
			log.Printf("UpdateUserGRPC: Error updating user: %v", err)
			return nil, err
		}

		log.Printf("UpdateUserGRPC: Successfully updated user %s", user.Username)
		return user, nil
	})(ctx)
}

func (s *userService) DeleteUserGRPC(ctx context.Context, req *userPb.DeleteUserRequest) (*userPb.Empty, error) {
	return decorator.WithTimeout[*userPb.Empty](5*time.Second)(func(ctx context.Context) (*userPb.Empty, error) {
		log.Printf("DeleteUserGRPC: Deleting user with ID %s", req.Id)
		
		objectID, err := primitive.ObjectIDFromHex(req.Id)
		if err != nil {
			log.Printf("DeleteUserGRPC: Invalid ID format: %v", err)
			return nil, err
		}

		if err := s.userRepo.DeleteUser(ctx, objectID); err != nil {
			log.Printf("DeleteUserGRPC: Error deleting user: %v", err)
			return nil, err
		}

		log.Printf("DeleteUserGRPC: Successfully deleted user with ID %s", req.Id)
		return &userPb.Empty{}, nil
	})(ctx)
} 