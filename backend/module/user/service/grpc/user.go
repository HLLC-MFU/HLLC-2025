package grpc

// import (
// 	"context"
// 	"encoding/json"
// 	"errors"
// 	"log"
// 	"time"

// 	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
// 	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
// 	"go.mongodb.org/mongo-driver/bson/primitive"
// 	"golang.org/x/crypto/bcrypt"
// )

// type (
// 	UserService interface {
// 		CreateUserGRPC(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error)
// 		GetUserGRPC(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error)
// 		GetAllUsersGRPC(ctx context.Context, req *userPb.GetAllUsersRequest) (*userPb.GetAllUsersResponse, error)
// 		UpdateUserGRPC(ctx context.Context, req *userPb.UpdateUserRequest) (*userPb.User, error)
// 		DeleteUserGRPC(ctx context.Context, req *userPb.DeleteUserRequest) (*userPb.Empty, error)
// 		ValidateCredentialsGRPC(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error)
// 		CheckUsernameGRPC(ctx context.Context, req *userPb.CheckUsernameRequest) (*userPb.CheckUsernameResponse, error)
// 		SetPasswordGRPC(ctx context.Context, req *userPb.SetPasswordRequest) (*userPb.SetPasswordResponse, error)
// 	}

// 	userService struct {
// 		userRepository       repository.UserRepositoryService
// 		roleRepository       repository.RoleRepositoryService
// 		permissionRepository repository.PermissionRepositoryService
// 		majorService         majorPb.MajorServiceClient
// 	}

// 	// Temporary struct to include MajorJson field
// 	protoUserWithJson struct {
// 		Id          string
// 		Username    string
// 		Password    string
// 		Name        *userPb.Name
// 		RoleIds     []string
// 		MajorId     string
// 		MajorJson   string
// 		CreatedAt   string
// 		UpdatedAt   string
// 		IsActivated bool
// 	}

// 	protoUserInfoWithJson struct {
// 		Id          string
// 		Username    string
// 		Name        *userPb.Name
// 		MajorId     string
// 		MajorJson   string
// 		IsActivated bool
// 	}
// )

// func NewUserService(
// 	userRepoisotory repository.UserRepositoryService,
// 	roleRepository repository.RoleRepositoryService,
// 	permissionRepository repository.PermissionRepositoryService,
// ) UserService {
// 	majorClient, err := core.GetMajorServiceClient(context.Background())
// 	if err != nil {
// 		log.Printf("Warning: Failed to get major client: %v", err)
// 		return nil
// 	}

// 	return &userService{
// 		userRepository:       userRepoisotory,
// 		roleRepository:       roleRepository,
// 		permissionRepository: permissionRepository,
// 		majorService:         majorClient,
// 	}
// }

// func (s *userService) CreateUserGRPC(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error) {
// 	return decorator.WithTimeout[*userPb.User](10 * time.Second)(func(ctx context.Context) (*userPb.User, error) {
// 		log.Printf("CreateUserGRPC: Creating new user with username %s", req.Username)

// 		// Check if user exists
// 		existingUser, err := s.userRepository.FindByUsername(ctx, req.Username)
// 		if err != nil && !errors.Is(err, exceptions.NewAppError(exceptions.ErrNotFound, "User not found", nil)) {
// 			return nil, err
// 		}
// 		if existingUser != nil {
// 			return nil, exceptions.NewAppError(exceptions.ErrAlreadyExists, "User already exists", nil)
// 		}

// 		// Create user entity
// 		newUser := &userPb.User{
// 			Id:        primitive.NewObjectID().Hex(),
// 			Username:  req.Username,
// 			Password:  req.Password,
// 			RoleIds:   req.RoleIds,
// 			MajorId:   req.MajorId,
// 			Name:      req.Name,
// 			CreatedAt: time.Now().Format(time.RFC3339),
// 			UpdatedAt: time.Now().Format(time.RFC3339),
// 		}

// 		// Save user
// 		if err := s.userRepository.CreateUser(ctx, newUser); err != nil {
// 			return nil, err
// 		}

// 		return newUser, nil
// 	})(ctx)
// }

// func (s *userService) ValidateCredentialsGRPC(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error) {
// 	return decorator.WithTimeout[*userPb.ValidateCredentialsResponse](5 * time.Second)(func(ctx context.Context) (*userPb.ValidateCredentialsResponse, error) {
// 		log.Printf("ValidateCredentialsGRPC: Validating credentials for user %s", req.Username)

// 		// Get user
// 		user, err := s.userRepository.FindByUsername(ctx, req.Username)
// 		if err != nil {
// 			if errors.Is(err, exceptions.NewAppError(exceptions.ErrNotFound, "User not found", nil)) {
// 				return &userPb.ValidateCredentialsResponse{
// 					Valid: false,
// 				}, nil
// 			}
// 			return nil, err
// 		}

// 		// Validate password
// 		valid := false
// 		if err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err == nil {
// 			valid = true
// 		}

// 		response := &userPb.ValidateCredentialsResponse{
// 			Valid: valid,
// 		}

// 		// Include user in response if valid
// 		if valid {
// 			response.User = user
// 		}

// 		log.Printf("ValidateCredentialsGRPC: Credentials validation result for %s: %v", req.Username, valid)
// 		return response, nil
// 	})(ctx)
// }

// // GetAllUsersGRPC method implementation
// func (s *userService) GetAllUsersGRPC(ctx context.Context, req *userPb.GetAllUsersRequest) (*userPb.GetAllUsersResponse, error) {
// 	return decorator.WithTimeout[*userPb.GetAllUsersResponse](10 * time.Second)(func(ctx context.Context) (*userPb.GetAllUsersResponse, error) {
// 		log.Printf("GetAllUsersGRPC: Fetching users with pagination")

// 		// Use default values for pagination until proto is regenerated
// 		page := int32(1)   // Default page
// 		limit := int32(10) // Default limit

// 		// Get paginated users from repository
// 		users, _, err := s.userRepository.FindAllPaginated(ctx, page, limit)
// 		if err != nil {
// 			log.Printf("GetAllUsersGRPC: Error finding users: %v", err)
// 			return nil, err
// 		}

// 		// For each user, load related data like major
// 		enrichedUsers := make([]*userPb.User, 0, len(users))
// 		for _, user := range users {
// 			// Create a copy with our temporary struct that includes MajorJson field
// 			tempUser := &protoUserWithJson{
// 				Id:          user.Id,
// 				Username:    user.Username,
// 				Name:        user.Name,
// 				RoleIds:     user.RoleIds,
// 				MajorId:     user.MajorId,
// 				IsActivated: user.IsActivated,
// 				CreatedAt:   user.CreatedAt,
// 				UpdatedAt:   user.UpdatedAt,
// 			}

// 			// Get major information if provided
// 			if user.MajorId != "" {
// 				log.Printf("GetAllUsersGRPC: User %s has majorID %s, retrieving major data", user.Username, user.MajorId)

// 				major, err := s.getMajorInfo(ctx, user.MajorId)
// 				if err != nil {
// 					// Log error but continue - major is optional
// 					log.Printf("GetAllUsersGRPC: Failed to get major with ID %s: %v", user.MajorId, err)
// 				} else if major != nil {
// 					log.Printf("GetAllUsersGRPC: Successfully retrieved major data for user %s", user.Username)
// 					// Serialize major data to JSON
// 					majorJSON, err := json.Marshal(major)
// 					if err != nil {
// 						log.Printf("GetAllUsersGRPC: Failed to serialize major data: %v", err)
// 					} else {
// 						tempUser.MajorJson = string(majorJSON)
// 					}
// 				} else {
// 					log.Printf("GetAllUsersGRPC: Major service returned nil for ID: %s", user.MajorId)
// 				}
// 			}

// 			// Don't include password in the response
// 			tempUser.Password = ""

// 			// Convert back to regular User proto
// 			// For now, we lose the major_json field but we'll get it back when proto is regenerated
// 			userProto := &userPb.User{
// 				Id:          tempUser.Id,
// 				Username:    tempUser.Username,
// 				Password:    tempUser.Password,
// 				Name:        tempUser.Name,
// 				RoleIds:     tempUser.RoleIds,
// 				MajorId:     tempUser.MajorId,
// 				CreatedAt:   tempUser.CreatedAt,
// 				UpdatedAt:   tempUser.UpdatedAt,
// 				IsActivated: tempUser.IsActivated,
// 			}

// 			enrichedUsers = append(enrichedUsers, userProto)
// 		}

// 		log.Printf("GetAllUsersGRPC: Successfully retrieved %d users (page %d)", len(enrichedUsers), page)

// 		// Return the response with the existing structure
// 		return &userPb.GetAllUsersResponse{
// 			Users: enrichedUsers,
// 		}, nil
// 	})(ctx)
// }

// // CheckUsernameGRPC method implementation
// func (s *userService) CheckUsernameGRPC(ctx context.Context, req *userPb.CheckUsernameRequest) (*userPb.CheckUsernameResponse, error) {
// 	return decorator.WithTimeout[*userPb.CheckUsernameResponse](5 * time.Second)(func(ctx context.Context) (*userPb.CheckUsernameResponse, error) {
// 		log.Printf("CheckUsernameGRPC: Checking if username '%s' exists", req.Username)

// 		// Try to find the user with this username
// 		user, err := s.userRepository.FindByUsername(ctx, req.Username)
// 		if err != nil {
// 			if errors.Is(err, exceptions.NewAppError(exceptions.ErrNotFound, "User not found", nil)) {
// 				// Username doesn't exist, return success
// 				log.Printf("CheckUsernameGRPC: Username '%s' is available", req.Username)
// 				return &userPb.CheckUsernameResponse{
// 					Exists: false,
// 				}, nil
// 			}
// 			// Other error occurred
// 			log.Printf("CheckUsernameGRPC: Error checking username: %v", err)
// 			return nil, err
// 		}

// 		// Username exists, populate userInfo with our temporary struct
// 		tempUserInfo := &protoUserInfoWithJson{
// 			Id:          user.Id,
// 			Username:    user.Username,
// 			Name:        user.Name,
// 			MajorId:     user.MajorId,
// 			IsActivated: user.IsActivated,
// 		}

// 		// Get major info if available
// 		if user.MajorId != "" {
// 			major, err := s.getMajorInfo(ctx, user.MajorId)
// 			if err == nil && major != nil {
// 				// Serialize major data to JSON
// 				majorJSON, err := json.Marshal(major)
// 				if err != nil {
// 					log.Printf("CheckUsernameGRPC: Failed to serialize major data: %v", err)
// 				} else {
// 					tempUserInfo.MajorJson = string(majorJSON)
// 				}
// 			}
// 		}

// 		// Convert back to regular UserInfo proto
// 		userInfo := &userPb.UserInfo{
// 			Id:          tempUserInfo.Id,
// 			Username:    tempUserInfo.Username,
// 			Name:        tempUserInfo.Name,
// 			MajorId:     tempUserInfo.MajorId,
// 			IsActivated: tempUserInfo.IsActivated,
// 		}

// 		log.Printf("CheckUsernameGRPC: Username '%s' already exists", req.Username)
// 		return &userPb.CheckUsernameResponse{
// 			Exists:   true,
// 			UserInfo: userInfo,
// 		}, nil
// 	})(ctx)
// }

// // Add the SetPasswordGRPC method implementation
// func (s *userService) SetPasswordGRPC(ctx context.Context, req *userPb.SetPasswordRequest) (*userPb.SetPasswordResponse, error) {
// 	return decorator.WithTimeout[*userPb.SetPasswordResponse](5 * time.Second)(func(ctx context.Context) (*userPb.SetPasswordResponse, error) {
// 		log.Printf("SetPasswordGRPC: Setting password for user '%s'", req.Username)

// 		// Find the user first
// 		user, err := s.userRepository.FindByUsername(ctx, req.Username)
// 		if err != nil {
// 			if errors.Is(err, exceptions.NewAppError(exceptions.ErrNotFound, "User not found", nil)) {
// 				log.Printf("SetPasswordGRPC: User '%s' not found", req.Username)
// 				return &userPb.SetPasswordResponse{
// 					Success: false,
// 					Message: "User not found",
// 				}, nil
// 			}
// 			// Other error occurred
// 			log.Printf("SetPasswordGRPC: Error finding user: %v", err)
// 			return nil, err
// 		}

// 		// Hash the password
// 		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
// 		if err != nil {
// 			log.Printf("SetPasswordGRPC: Error hashing password: %v", err)
// 			return nil, err
// 		}

// 		// Update the user's password
// 		objID, err := primitive.ObjectIDFromHex(user.Id)
// 		if err != nil {
// 			log.Printf("SetPasswordGRPC: Invalid user ID format: %v", err)
// 			return nil, err
// 		}

// 		// Update password
// 		err = s.userRepository.UpdatePassword(ctx, objID, string(hashedPassword))
// 		if err != nil {
// 			log.Printf("SetPasswordGRPC: Error updating password: %v", err)
// 			return nil, err
// 		}

// 		// Also set the user as activated
// 		user.IsActivated = true
// 		err = s.userRepository.UpdateUser(ctx, user)
// 		if err != nil {
// 			log.Printf("SetPasswordGRPC: Error activating user: %v", err)
// 			// Continue even if this fails - password was set
// 		}

// 		log.Printf("SetPasswordGRPC: Successfully set password for user '%s'", req.Username)
// 		return &userPb.SetPasswordResponse{
// 			Success: true,
// 			Message: "Password set successfully",
// 		}, nil
// 	})(ctx)
// }

// func (s *userService) UpdateUserGRPC(ctx context.Context, req *userPb.UpdateUserRequest) (*userPb.User, error) {
// 	return decorator.WithTimeout[*userPb.User](10 * time.Second)(func(ctx context.Context) (*userPb.User, error) {
// 		log.Printf("UpdateUserGRPC: Updating user with ID %s", req.Id)

// 		objectID, err := primitive.ObjectIDFromHex(req.Id)
// 		if err != nil {
// 			log.Printf("UpdateUserGRPC: Invalid ID format: %v", err)
// 			return nil, err
// 		}

// 		// Get existing user
// 		user, err := s.userRepository.FindByID(ctx, objectID)
// 		if err != nil {
// 			log.Printf("UpdateUserGRPC: Error finding user: %v", err)
// 			return nil, err
// 		}

// 		// Update fields if provided
// 		if req.Username != "" {
// 			user.Username = req.Username
// 		}

// 		if req.Name != nil {
// 			user.Name = req.Name
// 		}

// 		if req.RoleIds != nil {
// 			user.RoleIds = req.RoleIds
// 		}

// 		if req.MajorId != "" {
// 			user.MajorId = req.MajorId
// 		}

// 		// Update password if provided
// 		if req.Password != "" {
// 			user.Password = req.Password
// 		}

// 		// Update timestamp
// 		user.UpdatedAt = time.Now().Format(time.RFC3339)

// 		// Save updated user
// 		if err := s.userRepository.UpdateUser(ctx, user); err != nil {
// 			log.Printf("UpdateUserGRPC: Error updating user: %v", err)
// 			return nil, err
// 		}

// 		log.Printf("UpdateUserGRPC: Successfully updated user %s", user.Username)
// 		return user, nil
// 	})(ctx)
// }

// func (s *userService) DeleteUserGRPC(ctx context.Context, req *userPb.DeleteUserRequest) (*userPb.Empty, error) {
// 	return decorator.WithTimeout[*userPb.Empty](5 * time.Second)(func(ctx context.Context) (*userPb.Empty, error) {
// 		log.Printf("DeleteUserGRPC: Deleting user with ID %s", req.Id)

// 		objectID, err := primitive.ObjectIDFromHex(req.Id)
// 		if err != nil {
// 			log.Printf("DeleteUserGRPC: Invalid ID format: %v", err)
// 			return nil, err
// 		}

// 		if err := s.userRepository.DeleteUser(ctx, objectID); err != nil {
// 			log.Printf("DeleteUserGRPC: Error deleting user: %v", err)
// 			return nil, err
// 		}

// 		log.Printf("DeleteUserGRPC: Successfully deleted user with ID %s", req.Id)
// 		return &userPb.Empty{}, nil
// 	})(ctx)
// }

// // Internal function to get major information
// // This function is not exposed in the gRPC service but is used internally
// func (s *userService) getMajorInfo(ctx context.Context, majorID string) (*majorPb.Major, error) {
// 	if majorID == "" {
// 		return nil, nil
// 	}

// 	majorClient, err := core.GetMajorServiceClient(ctx)
// 	if err != nil {
// 		log.Printf("Warning: Failed to get major client: %v", err)
// 		return nil, err
// 	}

// 	response, err := majorClient.GetMajor(ctx, &majorPb.GetMajorRequest{Id: majorID})
// 	if err != nil {
// 		log.Printf("Warning: Failed to get major info: %v", err)
// 		return nil, err
// 	}

// 	return response.Major, nil
// }

// func (s *userService) GetUserGRPC(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error) {
// 	return decorator.WithTimeout[*userPb.User](5*time.Second)(func(ctx context.Context) (*userPb.User, error) {
// 		log.Printf("GetUserGRPC: Fetching user with username %s", req.Username)

// 		user, err := s.userRepository.FindByUsername(ctx, req.Username)
// 		if err != nil {
// 			log.Printf("GetUserGRPC: Error finding user: %v", err)
// 			return nil, err
// 		}

// 		return user, nil
// 	})(ctx)
// }
