package http

import (
	"context"
	"time"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	RoleService interface {
		CreateRole(ctx context.Context, req *userPb.CreateRoleRequest) (*userPb.Role, error)
		GetRoleByID(ctx context.Context, id string) (*userPb.Role, error)
		GetAllRoles(ctx context.Context) ([]*userPb.Role, error)
		UpdateRole(ctx context.Context, id string, req *userPb.UpdateRoleRequest) (*userPb.Role, error)
		DeleteRole(ctx context.Context, id string) error
		GetRoleByCode(ctx context.Context, code string) (*userPb.Role, error)
	}

	roleService struct {
		roleRepository       repository.RoleRepositoryService
		permissionRepository repository.PermissionRepositoryService
	}
)

func NewRoleService(
	roleRepository repository.RoleRepositoryService,
	permissionRepository repository.PermissionRepositoryService,
) RoleService {
	return &roleService{
		roleRepository:       roleRepository,
		permissionRepository: permissionRepository,
	}
}

// CreateRole creates a new role with proper error handling and structured logging
func (s *roleService) CreateRole(ctx context.Context, req *userPb.CreateRoleRequest) (*userPb.Role, error) {
	return decorator.WithTimeout[*userPb.Role](10 * time.Second)(func(ctx context.Context) (*userPb.Role, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating new role",
			logging.FieldOperation, "create_role",
			logging.FieldEntity, "role",
			"code", req.Code,
			"name", req.Name,
		)

		// Check if the role already exists
		existingRole, err := s.roleRepository.FindRoleByCode(ctx, req.Code)
		if err != nil && !exceptions.IsNotFound(err) {
			logger.Error("Error checking for existing role", err,
				logging.FieldOperation, "create_role",
				logging.FieldEntity, "role",
				"code", req.Code,
			)
			return nil, err
		}
		
		if existingRole != nil {
			logger.Warn("Role with code already exists",
				logging.FieldOperation, "create_role",
				logging.FieldEntity, "role",
				"code", req.Code,
			)
			return nil, exceptions.AlreadyExists("role", "code", req.Code, nil,
				exceptions.WithOperation("create_role"))
		}

		// Create a new role
		role := &userPb.Role{
			Id:            primitive.NewObjectID().Hex(),
			Code:          req.Code,
			Name:          req.Name,
			Description:   req.Description,
			PermissionIds: req.PermissionIds,
			CreatedAt:     time.Now().Format(time.RFC3339),
			UpdatedAt:     time.Now().Format(time.RFC3339),
		}

		// Save the role to the repository
		if err := s.roleRepository.CreateRole(ctx, role); err != nil {
			logger.Error("Failed to create role", err,
				logging.FieldOperation, "create_role",
				logging.FieldEntity, "role",
				"code", req.Code,
			)
			return nil, err
		}

		logger.Info("Successfully created role",
			logging.FieldOperation, "create_role",
			logging.FieldEntity, "role",
			logging.FieldEntityID, role.Id,
			"code", role.Code,
		)
		return role, nil
	})(ctx)
}

// GetRoleByID retrieves a role by ID with proper error handling and structured logging
func (s *roleService) GetRoleByID(ctx context.Context, id string) (*userPb.Role, error) {
	return decorator.WithTimeout[*userPb.Role](10 * time.Second)(func(ctx context.Context) (*userPb.Role, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting role by ID",
			logging.FieldOperation, "get_role",
			logging.FieldEntity, "role",
			logging.FieldEntityID, id,
		)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid role ID format", err,
				logging.FieldOperation, "get_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, id,
			)
			return nil, exceptions.InvalidInput("invalid role ID format", err,
				exceptions.WithEntity("role", id))
		}

		role, err := s.roleRepository.FindRoleByID(ctx, objectID)
		if err != nil {
			logger.Error("Failed to get role by ID", err,
				logging.FieldOperation, "get_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		logger.Info("Successfully retrieved role",
			logging.FieldOperation, "get_role",
			logging.FieldEntity, "role",
			logging.FieldEntityID, id,
			"code", role.Code,
		)
		return role, nil
	})(ctx)
}

// GetAllRoles retrieves all roles with proper error handling and structured logging
func (s *roleService) GetAllRoles(ctx context.Context) ([]*userPb.Role, error) {
	return decorator.WithTimeout[[]*userPb.Role](10 * time.Second)(func(ctx context.Context) ([]*userPb.Role, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting all roles",
			logging.FieldOperation, "get_all_roles",
			logging.FieldEntity, "role",
		)

		// Fetch all roles from the repository
		roles, err := s.roleRepository.FindAllRoles(ctx)
		if err != nil {
			logger.Error("Failed to get all roles", err,
				logging.FieldOperation, "get_all_roles",
				logging.FieldEntity, "role",
			)
			return nil, err
		}

		logger.Info("Successfully retrieved all roles",
			logging.FieldOperation, "get_all_roles",
			logging.FieldEntity, "role",
			"count", len(roles),
		)
		return roles, nil
	})(ctx)
}

// UpdateRole updates a role with proper error handling and structured logging
func (s *roleService) UpdateRole(ctx context.Context, id string, req *userPb.UpdateRoleRequest) (*userPb.Role, error) {
	return decorator.WithTimeout[*userPb.Role](10 * time.Second)(func(ctx context.Context) (*userPb.Role, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Updating role",
			logging.FieldOperation, "update_role",
			logging.FieldEntity, "role",
			logging.FieldEntityID, id,
		)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid role ID format", err,
				logging.FieldOperation, "update_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, id,
			)
			return nil, exceptions.InvalidInput("invalid role ID format", err,
				exceptions.WithEntity("role", id))
		}

		// Fetch the existing role
		role, err := s.roleRepository.FindRoleByID(ctx, objectID)
		if err != nil {
			logger.Error("Failed to find role for update", err,
				logging.FieldOperation, "update_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		// If code is changing, check for duplicates
		if req.Code != "" && req.Code != role.Code {
			existingRole, err := s.roleRepository.FindRoleByCode(ctx, req.Code)
			if err != nil && !exceptions.IsNotFound(err) {
				logger.Error("Error checking code uniqueness", err,
					logging.FieldOperation, "update_role",
					logging.FieldEntity, "role",
					"code", req.Code,
				)
				return nil, err
			}
			
			if existingRole != nil {
				logger.Warn("Role with code already exists",
					logging.FieldOperation, "update_role",
					logging.FieldEntity, "role",
					"code", req.Code,
				)
				return nil, exceptions.AlreadyExists("role", "code", req.Code, nil,
					exceptions.WithOperation("update_role"))
			}
		}

		// Update the role fields
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
		role.UpdatedAt = time.Now().Format(time.RFC3339)

		// Save the updated role to the repository
		if err := s.roleRepository.UpdateRole(ctx, role); err != nil {
			logger.Error("Failed to update role", err,
				logging.FieldOperation, "update_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		logger.Info("Successfully updated role",
			logging.FieldOperation, "update_role",
			logging.FieldEntity, "role",
			logging.FieldEntityID, id,
			"code", role.Code,
		)
		return role, nil
	})(ctx)
}

// DeleteRole deletes a role with proper error handling and structured logging
func (s *roleService) DeleteRole(ctx context.Context, id string) error {
	_, err := decorator.WithTimeout[struct{}](5 * time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deleting role",
			logging.FieldOperation, "delete_role",
			logging.FieldEntity, "role",
			logging.FieldEntityID, id,
		)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid role ID format", err,
				logging.FieldOperation, "delete_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, id,
			)
			return struct{}{}, exceptions.InvalidInput("invalid role ID format", err,
				exceptions.WithEntity("role", id))
		}

		// Check if role exists before deletion
		role, err := s.roleRepository.FindRoleByID(ctx, objectID)
		if err != nil {
			logger.Error("Failed to find role for deletion", err,
				logging.FieldOperation, "delete_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, id,
			)
			return struct{}{}, err
		}

		// Delete the role from the repository
		if err := s.roleRepository.DeleteRole(ctx, objectID); err != nil {
			logger.Error("Failed to delete role", err,
				logging.FieldOperation, "delete_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, id,
			)
			return struct{}{}, err
		}

		logger.Info("Successfully deleted role",
			logging.FieldOperation, "delete_role",
			logging.FieldEntity, "role",
			logging.FieldEntityID, id,
			"code", role.Code,
		)
		return struct{}{}, nil
	})(ctx)

	return err
}

// GetRoleByCode retrieves a role by code with proper error handling and structured logging
func (s *roleService) GetRoleByCode(ctx context.Context, code string) (*userPb.Role, error) {
	return decorator.WithTimeout[*userPb.Role](10 * time.Second)(func(ctx context.Context) (*userPb.Role, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting role by code",
			logging.FieldOperation, "get_role_by_code",
			logging.FieldEntity, "role",
			"code", code,
		)

		// Fetch the role by code
		role, err := s.roleRepository.FindRoleByCode(ctx, code)
		if err != nil {
			logger.Error("Failed to get role by code", err,
				logging.FieldOperation, "get_role_by_code",
				logging.FieldEntity, "role",
				"code", code,
			)
			return nil, err
		}

		logger.Info("Successfully retrieved role by code",
			logging.FieldOperation, "get_role_by_code",
			logging.FieldEntity, "role",
			logging.FieldEntityID, role.Id,
			"code", code,
		)
		return role, nil
	})(ctx)
}
