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
		// Check if user exists
		existingUser, err := s.userRepo.FindByUsername(ctx, req.Username)
		if err != nil && !errors.Is(err, repository.ErrNotFound) {
			return nil, err
		}
		if existingUser != nil {
			return nil, ErrUserExists
		}

		var hashedPassword string
		isActivated := req.IsActivated

		// If password is provided and user should be activated
		if req.Password != "" && isActivated {
			hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			if err != nil {
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
			IsActivated: isActivated,
			CreatedAt: time.Now().Format(time.RFC3339),
			UpdatedAt: time.Now().Format(time.RFC3339),
		}

		// Save user
		if err := s.userRepo.CreateUser(ctx, newUser); err != nil {
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
		}, nil
	})(ctx)
}

func (s *userService) GetUserByID(ctx context.Context, id string) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](5*time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return nil, err
		}

		user, err := s.userRepo.FindByID(ctx, objectID)
		if err != nil {
			return nil, err
		}

		// Get roles for response
		var roles []*userPb.Role
		for _, roleID := range user.RoleIds {
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
		if user.MajorId != "" {
			major, err = s.majorService.GetMajorByID(ctx, user.MajorId)
			if err != nil {
				// Log error but continue - major is optional
				log.Printf("Warning: Failed to get major with ID %s: %v", user.MajorId, err)
			}
		}

		// Only include major in response if it was successfully retrieved
		var majorID string
		if major != nil {
			majorID = user.MajorId
		}

		return &dto.UserResponse{
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
		}, nil
	})(ctx)
}

func (s *userService) GetUserByUsername(ctx context.Context, username string) (*dto.UserResponse, error) {
	return decorator.WithTimeout[*dto.UserResponse](5*time.Second)(func(ctx context.Context) (*dto.UserResponse, error) {
		user, err := s.userRepo.FindByUsername(ctx, username)
		if err != nil {
			return nil, err
		}

		// Initialize empty arrays to avoid null in response
		roles := make([]*userPb.Role, 0)

		// Get roles for response by fetching each role by ID
		for _, roleID := range user.RoleIds {
			// Try both the roleID as is and as ObjectID
			role, err := s.roleRepo.FindRoleByID(ctx, primitive.ObjectID{})
			if err != nil {
				// If not found, try converting the string ID
				objectID, err := primitive.ObjectIDFromHex(roleID)
				if err != nil {
					continue
				}
				role, err = s.roleRepo.FindRoleByID(ctx, objectID)
				if err != nil {
					continue
				}
			}
			roles = append(roles, role)
		}

		// Get major information if provided
		var major *majorPb.Major
		if user.MajorId != "" {
			major, err = s.majorService.GetMajorByID(ctx, user.MajorId)
			if err != nil {
				// Log error but continue - major is optional
				log.Printf("Warning: Failed to get major with ID %s: %v", user.MajorId, err)
			}
		}

		// Only include major in response if it was successfully retrieved
		var majorID string
		if major != nil {
			majorID = user.MajorId
		}

		return &dto.UserResponse{
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
		}, nil
	})(ctx)
}

func (s *userService) GetAllUsers(ctx context.Context) ([]*dto.UserResponse, error) {
	return decorator.WithTimeout[[]*dto.UserResponse](10*time.Second)(func(ctx context.Context) ([]*dto.UserResponse, error) {
		users, err := s.userRepo.FindAll(ctx)
		if err != nil {
			log.Printf("Error finding all users: %v", err)
			return nil, err
		}

		var response []*dto.UserResponse
		for _, user := range users {
			// Get roles for response
			var roles []*userPb.Role
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
				log.Printf("Attempting to get major with ID: %s", user.MajorId)
				major, err = s.majorService.GetMajorByID(ctx, user.MajorId)
				if err != nil {
					log.Printf("Warning: Failed to get major with ID %s: %v", user.MajorId, err)
				} else if major != nil {
					log.Printf("Successfully retrieved major: %+v", major)
					majorID = user.MajorId
				} else {
					log.Printf("Major service returned nil for ID: %s", user.MajorId)
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
			}

			// Only include major if it was successfully retrieved
			if major != nil {
				userResponse.Major = major
			}

			response = append(response, userResponse)
		}

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
		role := &userPb.Role{
			Id:          primitive.NewObjectID().Hex(),
			Name:        req.Name,
			Code:        req.Code,
			Description: req.Description,
			PermissionIds: req.Permissions,
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		}

		if err := s.roleRepo.CreateRole(ctx, role); err != nil {
			return nil, err
		}

		// Get permissions for response
		var permissions []*userPb.Permission
		for _, permID := range req.Permissions {
			objectID, err := primitive.ObjectIDFromHex(permID)
			if err != nil {
				continue
			}
			perm, err := s.permRepo.FindPermissionByID(ctx, objectID)
			if err != nil {
				continue
			}
			permissions = append(permissions, perm)
		}

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
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return nil, err
		}

		role, err := s.roleRepo.FindRoleByID(ctx, objectID)
		if err != nil {
			return nil, err
		}

		return &dto.RoleResponse{
			ID:          role.Id,
			Name:        role.Name,
			Code:        role.Code,
			Description: role.Description,
		}, nil
	})(ctx)
}

func (s *userService) GetAllRoles(ctx context.Context) ([]*dto.RoleResponse, error) {
	return decorator.WithTimeout[[]*dto.RoleResponse](10*time.Second)(func(ctx context.Context) ([]*dto.RoleResponse, error) {
		roles, err := s.roleRepo.FindAllRoles(ctx)
		if err != nil {
			return nil, err
		}

		var response []*dto.RoleResponse
		for _, role := range roles {
			response = append(response, &dto.RoleResponse{
				ID:          role.Id,
				Name:        role.Name,
				Code:        role.Code,
				Description: role.Description,
			})
		}

		return response, nil
	})(ctx)
}

func (s *userService) UpdateRole(ctx context.Context, id string, req *dto.UpdateRoleRequest) (*dto.RoleResponse, error) {
	return decorator.WithTimeout[*dto.RoleResponse](10*time.Second)(func(ctx context.Context) (*dto.RoleResponse, error) {
		// Validate ID format
		if _, err := primitive.ObjectIDFromHex(id); err != nil {
			return nil, err
		}

		role := &userPb.Role{
			Id:            id,
			Name:          req.Name,
			Code:         req.Code,
			Description:   req.Description,
			PermissionIds: req.Permissions,
			UpdatedAt:     time.Now().Format(time.RFC3339),
		}

		if err := s.roleRepo.UpdateRole(ctx, role); err != nil {
			return nil, err
		}

		return &dto.RoleResponse{
			ID:          role.Id,
			Name:        role.Name,
			Code:        role.Code,
			Description: role.Description,
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
				MajorID:     user.MajorId,
				Major:       major,
				IsActivated: user.IsActivated,
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

		// Check if user is already activated
		if user.IsActivated {
			return &dto.SetPasswordResponse{
				Success: false,
				Message: "User is already activated",
			}, nil
		}

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}

		// Update user with password and activate
		user.Password = string(hashedPassword)
		user.IsActivated = true
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