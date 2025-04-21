package service

import (
	"context"
	"errors"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
)

// MajorService defines the interface for major service operations needed by user service
type MajorService interface {
	GetMajorByID(ctx context.Context, id string) (*majorPb.Major, error)
}

var (
	ErrNotFound = errors.New("user not found")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserExists = errors.New("user already exists")
)

type UserService interface {
	// User management
	CreateUser(ctx context.Context, req *dto.CreateUserRequest) (*dto.UserResponse, error)
	GetUserByID(ctx context.Context, id string) (*dto.UserResponse, error)
	GetUserByUsername(ctx context.Context, username string) (*dto.UserResponse, error)
	GetAllUsers(ctx context.Context) ([]*dto.UserResponse, error)
	UpdateUser(ctx context.Context, id string, req *dto.UpdateUserRequest) (*dto.UserResponse, error)
	DeleteUser(ctx context.Context, id string) error
	ValidatePassword(ctx context.Context, username, password string) (bool, error)
	
	// Role management
	CreateRole(ctx context.Context, req *dto.CreateRoleRequest) (*dto.RoleResponse, error)
	GetRoleByID(ctx context.Context, id string) (*dto.RoleResponse, error)
	GetAllRoles(ctx context.Context) ([]*dto.RoleResponse, error)
	UpdateRole(ctx context.Context, id string, req *dto.UpdateRoleRequest) (*dto.RoleResponse, error)
	DeleteRole(ctx context.Context, id string) error

	// Permission management
	CreatePermission(ctx context.Context, req *dto.CreatePermissionRequest) (*dto.PermissionResponse, error)
	GetPermissionByID(ctx context.Context, id string) (*dto.PermissionResponse, error)
	GetAllPermissions(ctx context.Context) ([]*dto.PermissionResponse, error)
	UpdatePermission(ctx context.Context, id string, req *dto.UpdatePermissionRequest) (*dto.PermissionResponse, error)
	DeletePermission(ctx context.Context, id string) error
	
	// gRPC Service methods
	CreateUserGRPC(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error)
	GetUserGRPC(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error)
	ValidateCredentialsGRPC(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error)

	// Registration methods
	CheckUsername(ctx context.Context, req *dto.CheckUsernameRequest) (*dto.CheckUsernameResponse, error)
	SetPassword(ctx context.Context, req *dto.SetPasswordRequest) (*dto.SetPasswordResponse, error)
}

type userService struct {
	cfg         *config.Config
	userRepo    repository.UserRepositoryService
	roleRepo    repository.RoleRepositoryService
	permRepo    repository.PermissionRepositoryService
	majorService MajorService
}

func NewUserService(
	cfg *config.Config,
	userRepo repository.UserRepositoryService,
	roleRepo repository.RoleRepositoryService,
	permRepo repository.PermissionRepositoryService,
	majorSvc MajorService,
) UserService {
	return &userService{
		cfg:      cfg,
		userRepo: userRepo,
		roleRepo: roleRepo,
		permRepo: permRepo,
		majorService: majorSvc,
	}
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
			
			// Create a separate context with timeout just for this major call
			majorCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
			major, err = s.majorService.GetMajorByID(majorCtx, req.MajorID)
			cancel()
			
			if err != nil {
				// Log error but continue - major is optional
				log.Printf("CreateUser: Failed to get major with ID %s: %v", req.MajorID, err)
				// Continue without major info
			} else if major != nil {
				log.Printf("CreateUser: Successfully retrieved major data for new user %s", newUser.Username)
				majorID = req.MajorID
			} else {
				log.Printf("CreateUser: Major service returned nil for ID: %s", req.MajorID)
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
			Roles:   roles,
			MajorID: majorID,
			Major:   major,
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

		// Get roles for response
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
			
			// Create a separate context with timeout just for this major call
			majorCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
			major, err = s.majorService.GetMajorByID(majorCtx, user.MajorId)
			cancel()
			
			if err != nil {
				// Log error but continue - major is optional
				log.Printf("GetUserByID: Failed to get major with ID %s: %v", user.MajorId, err)
				// Continue without major info
			} else if major != nil {
				log.Printf("GetUserByID: Successfully retrieved major data for user %s", user.Username)
				majorID = user.MajorId
			} else {
				log.Printf("GetUserByID: Major service returned nil for ID: %s", user.MajorId)
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

		// Initialize empty arrays to avoid null in response
		roles := make([]*userPb.Role, 0)

		// Get roles for response by fetching each role by ID
		for _, roleID := range user.RoleIds {
			// Try converting the string ID
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
			
			// Create a separate context with timeout just for this major call
			majorCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
			major, err = s.majorService.GetMajorByID(majorCtx, user.MajorId)
			cancel()
			
			if err != nil {
				// Log error but continue - major is optional
				log.Printf("GetUserByUsername: Failed to get major with ID %s: %v", user.MajorId, err)
				// Continue without major info
			} else if major != nil {
				log.Printf("GetUserByUsername: Successfully retrieved major data for user %s", user.Username)
				majorID = user.MajorId
			} else {
				log.Printf("GetUserByUsername: Major service returned nil for ID: %s", user.MajorId)
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
		
		log.Printf("GetUserByUsername: Successfully retrieved user %s", user.Username)
		return response, nil
	})(ctx)
}

func (s *userService) GetAllUsers(ctx context.Context) ([]*dto.UserResponse, error) {
	return decorator.WithTimeout[[]*dto.UserResponse](10*time.Second)(func(ctx context.Context) ([]*dto.UserResponse, error) {
		log.Printf("GetAllUsers: Starting to fetch all users")
		users, err := s.userRepo.FindAll(ctx)
		if err != nil {
			log.Printf("Error finding all users: %v", err)
			return nil, err
		}

		log.Printf("GetAllUsers: Found %d users, processing details", len(users))
		var response []*dto.UserResponse
		for _, user := range users {
			// Get roles for response
			roles := make([]*userPb.Role, 0)
			for _, roleID := range user.RoleIds {
				objectID, err := primitive.ObjectIDFromHex(roleID)
				if err != nil {
					log.Printf("Warning: Invalid role ID format %s: %v", roleID, err)
					continue
				}
				role, err := s.roleRepo.FindRoleByID(ctx, objectID)
				if err != nil {
					log.Printf("Warning: Failed to get role with ID %s: %v", roleID, err)
					continue
				}
				roles = append(roles, role)
			}

			// Get major information if provided
			var major *majorPb.Major
			var majorID string
			if user.MajorId != "" {
				log.Printf("User %s: Attempting to get major with ID: %s", user.Username, user.MajorId)
				
				// Create a separate context with timeout just for this major call
				majorCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
				major, err = s.majorService.GetMajorByID(majorCtx, user.MajorId)
				cancel()
				
				if err != nil {
					log.Printf("Warning: Failed to get major with ID %s for user %s: %v", 
						user.MajorId, user.Username, err)
					// We continue without the major info
				} else if major != nil {
					log.Printf("Successfully retrieved major for user %s: %+v", user.Username, major)
					majorID = user.MajorId
				} else {
					log.Printf("Major service returned nil for ID: %s (user: %s)", user.MajorId, user.Username)
				}
			} else {
				log.Printf("User %s has no major ID", user.Username)
			}

			// Create user response with major information
			userResponse := &dto.UserResponse{
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

			response = append(response, userResponse)
		}

		log.Printf("GetAllUsers: Successfully processed %d users", len(response))
		return response, nil
	})(ctx)
}

func (s *userService) UpdateUser(ctx context.Context, id string, req *dto.UpdateUserRequest) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](10*time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		// Hash password if provided
		var hashedPassword string
		if req.Password != "" {
			hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			if err != nil {
				return nil, err
			}
			hashedPassword = string(hashed)
		}

		updatedUser := &userPb.User{
			Id:        id,
			Username:  req.Username,
			Password:  hashedPassword,
			RoleIds:   req.RoleIDs,
			MajorId:   req.MajorID,
			UpdatedAt: time.Now().Format(time.RFC3339),
		}

		if err := s.userRepo.UpdateUser(ctx, updatedUser); err != nil {
			return nil, err
		}

		// Get roles for response
		var roles []*userPb.Role
		for _, roleID := range req.RoleIDs {
			objectID, err := primitive.ObjectIDFromHex(roleID)
			if err != nil {
				continue
			}
			role, err := s.roleRepo.FindRoleByID(ctx, objectID)
			if err != nil {
				continue
			}
			roles = append(roles, role)
		}

		// Get major information if provided
		var major *majorPb.Major
		var majorID string
		if req.MajorID != "" {
			var majorErr error
			major, majorErr = s.majorService.GetMajorByID(ctx, req.MajorID)
			if majorErr != nil {
				// Log error but continue - major is optional
				log.Printf("Warning: Failed to get major with ID %s: %v", req.MajorID, majorErr)
			} else if major != nil {
				majorID = req.MajorID
			}
		}

		return &dto.UserResponse{
			ID:       updatedUser.Id,
			Username: updatedUser.Username,
			Name:     req.Name,
			Roles:    roles,
			MajorID:  majorID,
			Major:    major,
		}, nil
	})(ctx)
}

func (s *userService) DeleteUser(ctx context.Context, id string) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return struct{}{}, err
		}
		if err := s.userRepo.DeleteUser(ctx, objectID); err != nil {
			return struct{}{}, err
		}
		return struct{}{}, nil
	})(ctx)
	return err
}

func (s *userService) ValidatePassword(ctx context.Context, username, password string) (bool, error) {
	return decorator.WithTimeout[bool](5*time.Second)(func(ctx context.Context) (bool, error) {
		user, err := s.userRepo.FindByUsername(ctx, username)
		if err != nil {
			return false, err
		}

		err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
		if err != nil {
			if err == bcrypt.ErrMismatchedHashAndPassword {
				return false, nil
			}
			return false, err
		}

		return true, nil
	})(ctx)
}

// gRPC Service implementations
func (s *userService) CreateUserGRPC(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error) {
	dtoReq := &dto.CreateUserRequest{
		Username: req.Username,
		Password: req.Password,
		Name: dto.Name{
			FirstName:  req.Name.FirstName,
			MiddleName: req.Name.MiddleName,
			LastName:   req.Name.LastName,
		},
		RoleIDs: req.RoleIds,
		MajorID: req.MajorId,
	}

	user, err := s.CreateUser(ctx, dtoReq)
	if err != nil {
		return nil, err
	}

	return &userPb.User{
		Id:       user.ID,
		Username: user.Username,
		Name: &userPb.Name{
			FirstName:  user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName:   user.Name.LastName,
		},
		RoleIds: req.RoleIds,
		MajorId: req.MajorId,
	}, nil
}

func (s *userService) GetUserGRPC(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error) {
	user, err := s.GetUserByUsername(ctx, req.Username)
	if err != nil {
		return nil, err
	}

	var roleIDs []string
	for _, role := range user.Roles {
		roleIDs = append(roleIDs, role.Id)
	}

	return &userPb.User{
		Id:       user.ID,
		Username: user.Username,
		Name: &userPb.Name{
			FirstName:  user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName:   user.Name.LastName,
		},
		RoleIds: roleIDs,
		MajorId: user.MajorID,
	}, nil
}

func (s *userService) ValidateCredentialsGRPC(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error) {
	isValid, err := s.ValidatePassword(ctx, req.Username, req.Password)
	if err != nil {
		return nil, err
	}

	if !isValid {
		return &userPb.ValidateCredentialsResponse{
			Valid: false,
		}, nil
	}

	user, err := s.GetUserByUsername(ctx, req.Username)
	if err != nil {
		return nil, err
	}

	var roleIDs []string
	for _, role := range user.Roles {
		roleIDs = append(roleIDs, role.Id)
	}

	return &userPb.ValidateCredentialsResponse{
		Valid: true,
		User: &userPb.User{
			Id:       user.ID,
			Username: user.Username,
			Name: &userPb.Name{
				FirstName:  user.Name.FirstName,
				MiddleName: user.Name.MiddleName,
				LastName:   user.Name.LastName,
			},
			RoleIds: roleIDs,
			MajorId: user.MajorID,
		},
	}, nil
}

// Role management methods
func (s *userService) CreateRole(ctx context.Context, req *dto.CreateRoleRequest) (*dto.RoleResponse, error) {
	return decorator.WithTimeout[*dto.RoleResponse](10*time.Second)(func(ctx context.Context) (*dto.RoleResponse, error) {
		log.Printf("CreateRole: Creating new role with name %s and code %s", req.Name, req.Code)
		
		// Initialize permissions array if nil
		if req.Permissions == nil {
			req.Permissions = []string{}
			log.Printf("CreateRole: Permissions array was nil, initialized to empty array")
		}
		
		// Validate all permission IDs before creating the role
		validPermissionIds := make([]string, 0, len(req.Permissions))
		for _, permID := range req.Permissions {
			if permID == "" {
				log.Printf("CreateRole: Empty permission ID provided, skipping")
				continue
			}
			
			objectID, err := primitive.ObjectIDFromHex(permID)
			if err != nil {
				log.Printf("CreateRole: Invalid permission ID format %s: %v", permID, err)
				continue
			}
			
			// Verify the permission exists
			permCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
			_, err = s.permRepo.FindPermissionByID(permCtx, objectID)
			cancel()
			
			if err != nil {
				log.Printf("CreateRole: Permission with ID %s not found: %v", permID, err)
				continue
			}
			
			log.Printf("CreateRole: Validated permission ID: %s", permID)
			validPermissionIds = append(validPermissionIds, permID)
		}
		
		log.Printf("CreateRole: Validated %d out of %d permission IDs", 
			len(validPermissionIds), len(req.Permissions))
		
		// Create role with validated permissions
		role := &userPb.Role{
			Id:            primitive.NewObjectID().Hex(),
			Name:          req.Name,
			Code:          req.Code,
			Description:   req.Description,
			PermissionIds: validPermissionIds,
			CreatedAt:     time.Now().Format(time.RFC3339),
			UpdatedAt:     time.Now().Format(time.RFC3339),
		}

		log.Printf("CreateRole: Saving role with ID %s and %d permissions", 
			role.Id, len(role.PermissionIds))
		
		if err := s.roleRepo.CreateRole(ctx, role); err != nil {
			log.Printf("CreateRole: Error saving role: %v", err)
			return nil, err
		}

		// Load permissions using our helper function
		permissions, err := s.loadPermissionsForRole(ctx, role)
		if err != nil {
			log.Printf("CreateRole: Error loading permissions: %v", err)
			// Continue with empty permissions rather than failing
			permissions = []*userPb.Permission{}
		}

		log.Printf("CreateRole: Successfully created role %s with %d permissions", 
			role.Name, len(permissions))

		return &dto.RoleResponse{
			ID:          role.Id,
			Name:        role.Name,
			Code:        role.Code,
			Description: role.Description,
			Permissions: permissions,
		}, nil
	})(ctx)
}

func (s *userService) GetRoleByID(ctx context.Context, id string) (*dto.RoleResponse, error) {
	return decorator.WithTimeout[*dto.RoleResponse](5*time.Second)(func(ctx context.Context) (*dto.RoleResponse, error) {
		log.Printf("GetRoleByID: Fetching role with ID %s", id)
		
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("GetRoleByID: Invalid ID format: %v", err)
			return nil, err
		}

		role, err := s.roleRepo.FindRoleByID(ctx, objectID)
		if err != nil {
			log.Printf("GetRoleByID: Error finding role: %v", err)
			return nil, err
		}
		
		log.Printf("GetRoleByID: Found role %s (ID: %s) with %d permissionIds", 
			role.Name, role.Id, len(role.PermissionIds))

		// Load permissions using our helper function
		permissions, err := s.loadPermissionsForRole(ctx, role)
		if err != nil {
			log.Printf("GetRoleByID: Error loading permissions: %v", err)
			// Continue with empty permissions rather than failing
			permissions = []*userPb.Permission{}
		}

		log.Printf("GetRoleByID: Loaded %d permissions for role %s", len(permissions), role.Name)

		return &dto.RoleResponse{
			ID:          role.Id,
			Name:        role.Name,
			Code:        role.Code,
			Description: role.Description,
			Permissions: permissions,
		}, nil
	})(ctx)
}

func (s *userService) GetAllRoles(ctx context.Context) ([]*dto.RoleResponse, error) {
	return decorator.WithTimeout[[]*dto.RoleResponse](10*time.Second)(func(ctx context.Context) ([]*dto.RoleResponse, error) {
		log.Printf("GetAllRoles: Starting to fetch all roles")
		roles, err := s.roleRepo.FindAllRoles(ctx)
		if err != nil {
			log.Printf("GetAllRoles: Error finding roles: %v", err)
			return nil, err
		}

		log.Printf("GetAllRoles: Found %d roles, processing details", len(roles))
		
		var response []*dto.RoleResponse
		for _, role := range roles {
			// Log role details for debugging
			log.Printf("Processing role: %s (ID: %s) with %d permissionIds: %v", 
				role.Name, role.Id, len(role.PermissionIds), role.PermissionIds)
			
			// Load permissions using our helper function
			permissions, err := s.loadPermissionsForRole(ctx, role)
			if err != nil {
				log.Printf("Error loading permissions for role %s: %v", role.Name, err)
				// Continue with empty permissions rather than failing the entire request
				permissions = []*userPb.Permission{}
			}
			
			log.Printf("Role %s has %d permissions loaded", role.Name, len(permissions))
			
			// Create response object
			roleResponse := &dto.RoleResponse{
				ID:          role.Id,
				Name:        role.Name,
				Code:        role.Code,
				Description: role.Description,
				Permissions: permissions,
			}
			
			response = append(response, roleResponse)
		}

		log.Printf("GetAllRoles: Successfully processed %d roles", len(response))
		return response, nil
	})(ctx)
}

func (s *userService) UpdateRole(ctx context.Context, id string, req *dto.UpdateRoleRequest) (*dto.RoleResponse, error) {
	return decorator.WithTimeout[*dto.RoleResponse](10*time.Second)(func(ctx context.Context) (*dto.RoleResponse, error) {
		log.Printf("UpdateRole: Updating role with ID %s", id)
		
		// Validate ID format
		if _, err := primitive.ObjectIDFromHex(id); err != nil {
			log.Printf("UpdateRole: Invalid ID format: %v", err)
			return nil, err
		}
		
		// Initialize permissions array if nil
		if req.Permissions == nil {
			req.Permissions = []string{}
			log.Printf("UpdateRole: Permissions array was nil, initialized to empty array")
		}
		
		// Validate all permission IDs before updating the role
		validPermissionIds := make([]string, 0, len(req.Permissions))
		for _, permID := range req.Permissions {
			if permID == "" {
				log.Printf("UpdateRole: Empty permission ID provided, skipping")
				continue
			}
			
			objectID, err := primitive.ObjectIDFromHex(permID)
			if err != nil {
				log.Printf("UpdateRole: Invalid permission ID format %s: %v", permID, err)
				continue
			}
			
			// Verify the permission exists
			permCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
			_, err = s.permRepo.FindPermissionByID(permCtx, objectID)
			cancel()
			
			if err != nil {
				log.Printf("UpdateRole: Permission with ID %s not found: %v", permID, err)
				continue
			}
			
			log.Printf("UpdateRole: Validated permission ID: %s", permID)
			validPermissionIds = append(validPermissionIds, permID)
		}
		
		log.Printf("UpdateRole: Validated %d out of %d permission IDs", 
			len(validPermissionIds), len(req.Permissions))

		role := &userPb.Role{
			Id:            id,
			Name:          req.Name,
			Code:          req.Code,
			Description:   req.Description,
			PermissionIds: validPermissionIds,
			UpdatedAt:     time.Now().Format(time.RFC3339),
		}
		
		log.Printf("UpdateRole: Saving role with ID %s and %d permissions", 
			role.Id, len(role.PermissionIds))

		if err := s.roleRepo.UpdateRole(ctx, role); err != nil {
			log.Printf("UpdateRole: Error updating role: %v", err)
			return nil, err
		}

		// Load permissions using our helper function
		permissions, err := s.loadPermissionsForRole(ctx, role)
		if err != nil {
			log.Printf("UpdateRole: Error loading permissions: %v", err)
			// Continue with empty permissions rather than failing
			permissions = []*userPb.Permission{}
		}

		log.Printf("UpdateRole: Successfully updated role %s with %d permissions", 
			role.Name, len(permissions))

		return &dto.RoleResponse{
			ID:          role.Id,
			Name:        role.Name,
			Code:        role.Code,
			Description: role.Description,
			Permissions: permissions,
		}, nil
	})(ctx)
}

func (s *userService) DeleteRole(ctx context.Context, id string) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return struct{}{}, err
		}
		if err := s.roleRepo.DeleteRole(ctx, objectID); err != nil {
			return struct{}{}, err
		}
		return struct{}{}, nil
	})(ctx)
	return err
}

// Permission management methods
func (s *userService) CreatePermission(ctx context.Context, req *dto.CreatePermissionRequest) (*dto.PermissionResponse, error) {
	return decorator.WithTimeout[*dto.PermissionResponse](10*time.Second)(func(ctx context.Context) (*dto.PermissionResponse, error) {
		permission := &userPb.Permission{
			Id:          primitive.NewObjectID().Hex(),
			Name:        req.Name,
			Code:        req.Code,
			Description: req.Description,
			Module:      req.Module,
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		}

		if err := s.permRepo.CreatePermission(ctx, permission); err != nil {
			return nil, err
		}

		return &dto.PermissionResponse{
			ID:          permission.Id,
			Name:        permission.Name,
			Code:        permission.Code,
			Description: permission.Description,
			Module:      permission.Module,
		}, nil
	})(ctx)
}

func (s *userService) GetPermissionByID(ctx context.Context, id string) (*dto.PermissionResponse, error) {
	return decorator.WithTimeout[*dto.PermissionResponse](5*time.Second)(func(ctx context.Context) (*dto.PermissionResponse, error) {
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return nil, err
		}

		permission, err := s.permRepo.FindPermissionByID(ctx, objectID)
		if err != nil {
			return nil, err
		}

		return &dto.PermissionResponse{
			ID:          permission.Id,
			Name:        permission.Name,
			Code:        permission.Code,
			Description: permission.Description,
			Module:      permission.Module,
		}, nil
	})(ctx)
}

func (s *userService) GetAllPermissions(ctx context.Context) ([]*dto.PermissionResponse, error) {
	return decorator.WithTimeout[[]*dto.PermissionResponse](10*time.Second)(func(ctx context.Context) ([]*dto.PermissionResponse, error) {
		permissions, err := s.permRepo.FindAllPermissions(ctx)
		if err != nil {
			return nil, err
		}

		var response []*dto.PermissionResponse
		for _, permission := range permissions {
			response = append(response, &dto.PermissionResponse{
				ID:          permission.Id,
				Name:        permission.Name,
				Code:        permission.Code,
				Description: permission.Description,
				Module:      permission.Module,
			})
		}

		return response, nil
	})(ctx)
}

func (s *userService) UpdatePermission(ctx context.Context, id string, req *dto.UpdatePermissionRequest) (*dto.PermissionResponse, error) {
	return decorator.WithTimeout[*dto.PermissionResponse](10*time.Second)(func(ctx context.Context) (*dto.PermissionResponse, error) {
		// Validate ID format
		if _, err := primitive.ObjectIDFromHex(id); err != nil {
			return nil, err
		}

		permission := &userPb.Permission{
			Id:          id,
			Name:        req.Name,
			Code:        req.Code,
			Description: req.Description,
			Module:      req.Module,
			UpdatedAt:   time.Now().Format(time.RFC3339),
		}

		if err := s.permRepo.UpdatePermission(ctx, permission); err != nil {
			return nil, err
		}

		return &dto.PermissionResponse{
			ID:          permission.Id,
			Name:        permission.Name,
			Code:        permission.Code,
			Description: permission.Description,
			Module:      permission.Module,
		}, nil
	})(ctx)
}

func (s *userService) DeletePermission(ctx context.Context, id string) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return struct{}{}, err
		}
		if err := s.permRepo.DeletePermission(ctx, objectID); err != nil {
			return struct{}{}, err
		}
		return struct{}{}, nil
	})(ctx)
	return err
}

// Registration methods
func (s *userService) CheckUsername(ctx context.Context, req *dto.CheckUsernameRequest) (*dto.CheckUsernameResponse, error) {
	return decorator.WithTimeout[*dto.CheckUsernameResponse](5*time.Second)(func(ctx context.Context) (*dto.CheckUsernameResponse, error) {
		// Find user by username
		user, err := s.userRepo.FindByUsername(ctx, req.Username)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				return &dto.CheckUsernameResponse{
					Exists: false,
				}, nil
			}
			return nil, err
		}

		// Get major information if available
		var major *majorPb.Major
		if user.MajorId != "" {
			major, err = s.majorService.GetMajorByID(ctx, user.MajorId)
			if err != nil {
				log.Printf("Warning: Failed to get major with ID %s: %v", user.MajorId, err)
			}
		}

		return &dto.CheckUsernameResponse{
			Exists: true,
			User: &dto.UserInfo{
				ID:       user.Id,
				Username: user.Username,
				Name: dto.Name{
					FirstName:  user.Name.FirstName,
					MiddleName: user.Name.MiddleName,
					LastName:   user.Name.LastName,
				},
				MajorID: user.MajorId,
				Major:   major,
			},
		}, nil
	})(ctx)
}

func (s *userService) SetPassword(ctx context.Context, req *dto.SetPasswordRequest) (*dto.SetPasswordResponse, error) {
	return decorator.WithTimeout[*dto.SetPasswordResponse](5*time.Second)(func(ctx context.Context) (*dto.SetPasswordResponse, error) {
		// Find user by username
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
			return nil, err
		}

		// Update user with password and activate
		user.Password = string(hashedPassword)
		user.UpdatedAt = time.Now().Format(time.RFC3339)

		if err := s.userRepo.UpdateUser(ctx, user); err != nil {
			return nil, err
		}

		return &dto.SetPasswordResponse{
			Success: true,
			Message: "Password set successfully. You can now login.",
		}, nil
	})(ctx)
}

// Helper function to ensure all permissions from DB are properly loaded
func (s *userService) loadPermissionsForRole(ctx context.Context, role *userPb.Role) ([]*userPb.Permission, error) {
	if role == nil {
		return nil, errors.New("role is nil")
	}
	
	log.Printf("Loading permissions for role: %s (ID: %s) with permissionIds: %v", 
		role.Name, role.Id, role.PermissionIds)
	
	// Ensure permissionIds is initialized
	if role.PermissionIds == nil {
		role.PermissionIds = []string{}
		log.Printf("Role had nil permissionIds, initialized to empty array")
	}
	
	// Load each permission by ID
	permissions := make([]*userPb.Permission, 0, len(role.PermissionIds))
	for _, permID := range role.PermissionIds {
		if permID == "" {
			log.Printf("Warning: Empty permission ID in role %s, skipping", role.Name)
			continue
		}
		
		log.Printf("Loading permission with ID: %s", permID)
		
		// Convert ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(permID)
		if err != nil {
			log.Printf("Error: Invalid permission ID format %s: %v", permID, err)
			continue
		}
		
		// Create context with timeout for this specific operation
		permCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
		perm, err := s.permRepo.FindPermissionByID(permCtx, objectID)
		cancel()
		
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				log.Printf("Permission not found with ID: %s", permID)
			} else {
				log.Printf("Error loading permission %s: %v", permID, err)
			}
			continue
		}
		
		if perm == nil {
			log.Printf("Warning: nil permission returned for ID: %s", permID)
			continue
		}
		
		log.Printf("Successfully loaded permission: %s (ID: %s)", perm.Name, perm.Id)
		permissions = append(permissions, perm)
	}
	
	log.Printf("Loaded %d/%d permissions for role: %s", 
		len(permissions), len(role.PermissionIds), role.Name)
	
	return permissions, nil
}