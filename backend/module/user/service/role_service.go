package service

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
)

// Error definitions
var (
	ErrRoleNotFound = errors.New("role not found")
	ErrRoleExists   = errors.New("role with this code already exists")
)

// RoleService defines the role service operations
type RoleService interface {
	// Role gRPC methods - direct use of protobuf types
	CreateRoleGRPC(ctx context.Context, req *userPb.CreateRoleRequest) (*userPb.Role, error)
	GetRoleGRPC(ctx context.Context, req *userPb.GetRoleRequest) (*userPb.Role, error)
	GetAllRolesGRPC(ctx context.Context, req *userPb.GetAllRolesRequest) (*userPb.GetAllRolesResponse, error)
	UpdateRoleGRPC(ctx context.Context, req *userPb.UpdateRoleRequest) (*userPb.Role, error)
	DeleteRoleGRPC(ctx context.Context, req *userPb.DeleteRoleRequest) (*userPb.Empty, error)
	
	// Legacy methods (will be deprecated)
	CreateRole(ctx context.Context, req *userPb.CreateRoleRequest) (*userPb.Role, error)
	GetRoleByID(ctx context.Context, id string) (*userPb.Role, error)
	GetAllRoles(ctx context.Context) ([]*userPb.Role, error)
	UpdateRole(ctx context.Context, id string, req *userPb.UpdateRoleRequest) (*userPb.Role, error)
	DeleteRole(ctx context.Context, id string) error
}

// roleService implements RoleService
type roleService struct {
	cfg      *config.Config
	roleRepo repository.RoleRepositoryService
	permRepo repository.PermissionRepositoryService
}

// NewRoleService creates a new role service
func NewRoleService(
	cfg *config.Config,
	roleRepo repository.RoleRepositoryService,
	permRepo repository.PermissionRepositoryService,
) RoleService {
	return &roleService{
		cfg:      cfg,
		roleRepo: roleRepo,
		permRepo: permRepo,
	}
}

// CreateRole creates a new role
func (s *roleService) CreateRole(ctx context.Context, req *userPb.CreateRoleRequest) (*userPb.Role, error) {
	return decorator.WithTimeout[*userPb.Role](10*time.Second)(func(ctx context.Context) (*userPb.Role, error) {
		log.Printf("CreateRole: Creating new role with code %s", req.Code)
		
		// Create role entity
		newRole := &userPb.Role{
			Id:           primitive.NewObjectID().Hex(),
			Name:         req.Name,
			Code:         req.Code,
			Description:  req.Description,
			PermissionIds: make([]string, 0), // Initialize with empty slice
			CreatedAt:    time.Now().Format(time.RFC3339),
			UpdatedAt:    time.Now().Format(time.RFC3339),
		}
		
		// Set permission IDs if provided
		if req.PermissionIds != nil && len(req.PermissionIds) > 0 {
			newRole.PermissionIds = req.PermissionIds
		}

		// Save role
		if err := s.roleRepo.CreateRole(ctx, newRole); err != nil {
			log.Printf("CreateRole: Error saving role to database: %v", err)
			return nil, err
		}

		log.Printf("CreateRole: Successfully created role %s with ID %s", newRole.Name, newRole.Id)
		return newRole, nil
	})(ctx)
}

// GetRoleByID gets a role by ID
func (s *roleService) GetRoleByID(ctx context.Context, id string) (*userPb.Role, error) {
	return decorator.WithTimeout[*userPb.Role](5*time.Second)(func(ctx context.Context) (*userPb.Role, error) {
		log.Printf("GetRoleByID: Fetching role with ID %s", id)
		
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("GetRoleByID: Invalid ID format %s: %v", id, err)
			return nil, err
		}

		role, err := s.roleRepo.FindRoleByID(ctx, objectID)
		if err != nil {
			log.Printf("GetRoleByID: Error finding role: %v", err)
			return nil, err
		}

		return role, nil
	})(ctx)
}

// GetAllRoles gets all roles
func (s *roleService) GetAllRoles(ctx context.Context) ([]*userPb.Role, error) {
	return decorator.WithTimeout[[]*userPb.Role](10*time.Second)(func(ctx context.Context) ([]*userPb.Role, error) {
		log.Printf("GetAllRoles: Fetching all roles")
		
		roles, err := s.roleRepo.FindAllRoles(ctx)
		if err != nil {
			log.Printf("GetAllRoles: Error finding roles: %v", err)
			return nil, err
		}

		log.Printf("GetAllRoles: Successfully retrieved %d roles", len(roles))
		return roles, nil
	})(ctx)
}

// UpdateRole updates a role
func (s *roleService) UpdateRole(ctx context.Context, id string, req *userPb.UpdateRoleRequest) (*userPb.Role, error) {
	return decorator.WithTimeout[*userPb.Role](10*time.Second)(func(ctx context.Context) (*userPb.Role, error) {
		log.Printf("UpdateRole: Updating role with ID %s", id)
		
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("UpdateRole: Invalid ID format %s: %v", id, err)
			return nil, err
		}

		// Get existing role
		role, err := s.roleRepo.FindRoleByID(ctx, objectID)
		if err != nil {
			log.Printf("UpdateRole: Error finding role: %v", err)
			return nil, err
		}

		// Update fields if provided
		if req.Name != "" {
			role.Name = req.Name
		}
		
		if req.Code != "" {
			role.Code = req.Code
		}
		
		if req.Description != "" {
			role.Description = req.Description
		}
		
		if req.PermissionIds != nil {
			role.PermissionIds = req.PermissionIds
		}

		// Update timestamp
		role.UpdatedAt = time.Now().Format(time.RFC3339)

		// Save updated role
		if err := s.roleRepo.UpdateRole(ctx, role); err != nil {
			log.Printf("UpdateRole: Error updating role: %v", err)
			return nil, err
		}

		log.Printf("UpdateRole: Successfully updated role %s", role.Name)
		return role, nil
	})(ctx)
}

// DeleteRole deletes a role
func (s *roleService) DeleteRole(ctx context.Context, id string) error {
	_, innerErr := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		log.Printf("DeleteRole: Deleting role with ID %s", id)
		
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("DeleteRole: Invalid ID format %s: %v", id, err)
			return struct{}{}, err
		}

		if err := s.roleRepo.DeleteRole(ctx, objectID); err != nil {
			log.Printf("DeleteRole: Error deleting role: %v", err)
			return struct{}{}, err
		}

		log.Printf("DeleteRole: Successfully deleted role with ID %s", id)
		return struct{}{}, nil
	})(ctx)
	
	return innerErr
}

// CreateRoleGRPC creates a new role via gRPC
func (s *roleService) CreateRoleGRPC(ctx context.Context, req *userPb.CreateRoleRequest) (*userPb.Role, error) {
	return s.CreateRole(ctx, req)
}

// GetRoleGRPC gets a role by ID via gRPC
func (s *roleService) GetRoleGRPC(ctx context.Context, req *userPb.GetRoleRequest) (*userPb.Role, error) {
	return s.GetRoleByID(ctx, req.Id)
}

// GetAllRolesGRPC gets all roles via gRPC
func (s *roleService) GetAllRolesGRPC(ctx context.Context, req *userPb.GetAllRolesRequest) (*userPb.GetAllRolesResponse, error) {
	return decorator.WithTimeout[*userPb.GetAllRolesResponse](10*time.Second)(func(ctx context.Context) (*userPb.GetAllRolesResponse, error) {
		roles, err := s.GetAllRoles(ctx)
		if err != nil {
			return nil, err
		}
		
		return &userPb.GetAllRolesResponse{
			Roles: roles,
		}, nil
	})(ctx)
}

// UpdateRoleGRPC updates a role via gRPC
func (s *roleService) UpdateRoleGRPC(ctx context.Context, req *userPb.UpdateRoleRequest) (*userPb.Role, error) {
	return s.UpdateRole(ctx, req.Id, req)
}

// DeleteRoleGRPC deletes a role via gRPC
func (s *roleService) DeleteRoleGRPC(ctx context.Context, req *userPb.DeleteRoleRequest) (*userPb.Empty, error) {
	return decorator.WithTimeout[*userPb.Empty](5*time.Second)(func(ctx context.Context) (*userPb.Empty, error) {
		if err := s.DeleteRole(ctx, req.Id); err != nil {
			return nil, err
		}
		return &userPb.Empty{}, nil
	})(ctx)
} 