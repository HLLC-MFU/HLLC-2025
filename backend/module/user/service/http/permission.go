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
	PermissionService interface {
		//Default
		CreatePermission(ctx context.Context, req *userPb.CreatePermissionRequest) (*userPb.Permission, error)
		GetPermissionByID(ctx context.Context, id string) (*userPb.Permission, error)
		GetAllPermissions(ctx context.Context) ([]*userPb.Permission, error)
		UpdatePermission(ctx context.Context, id string, req *userPb.UpdatePermissionRequest) (*userPb.Permission, error)
		DeletePermission(ctx context.Context, id string) error
	}

	permissionService struct {
		//Default
		permissionRepository repository.PermissionRepositoryService
	}
)

func NewPermissionService(
	permissionRepository repository.PermissionRepositoryService,
) PermissionService {
	return &permissionService{
		permissionRepository: permissionRepository,
	}
}

// Create New Permission
func (s *permissionService) CreatePermission(ctx context.Context, req *userPb.CreatePermissionRequest) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](10 * time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating new permission",
			logging.FieldOperation, "create_permission",
			logging.FieldEntity, "permission",
			"code", req.Code,
			"name", req.Name,
		)

		// Create a new permission
		permission := &userPb.Permission{
			Id:          primitive.NewObjectID().Hex(),
			Code:        req.Code,
			Name:        req.Name,
			Description: req.Description,
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		}

		// Save permission
		if err := s.permissionRepository.CreatePermission(ctx, permission); err != nil {
			logger.Error("Failed to create permission", err,
				logging.FieldOperation, "create_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, permission.Id,
				"code", permission.Code,
			)
			return nil, err
		}

		logger.Info("Permission created successfully",
			logging.FieldOperation, "create_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, permission.Id,
			"code", permission.Code,
		)

		return permission, nil
	})(ctx)
}

// Get Permission By ID
func (s *permissionService) GetPermissionByID(ctx context.Context, id string) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](10 * time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting permission by ID",
			logging.FieldOperation, "get_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id,
		)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid permission ID format", err,
				logging.FieldOperation, "get_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id,
			)
			return nil, exceptions.InvalidInput("invalid permission ID format", err,
				exceptions.WithOperation("get_permission"),
				exceptions.WithEntity("permission", id))
		}

		permission, err := s.permissionRepository.FindPermissionByID(ctx, objectID)
		if err != nil {
			logger.Error("Failed to find permission", err,
				logging.FieldOperation, "get_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		logger.Info("Permission retrieved successfully",
			logging.FieldOperation, "get_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, permission.Id,
			"code", permission.Code,
		)

		return permission, nil
	})(ctx)
}

// Get All Permissions
func (s *permissionService) GetAllPermissions(ctx context.Context) ([]*userPb.Permission, error) {
	return decorator.WithTimeout[[]*userPb.Permission](10 * time.Second)(func(ctx context.Context) ([]*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting all permissions",
			logging.FieldOperation, "get_all_permissions",
			logging.FieldEntity, "permission",
		)

		permissions, err := s.permissionRepository.FindAllPermissions(ctx)
		if err != nil {
			logger.Error("Failed to find permissions", err,
				logging.FieldOperation, "get_all_permissions",
				logging.FieldEntity, "permission",
			)
			return nil, err
		}

		logger.Info("Retrieved all permissions successfully",
			logging.FieldOperation, "get_all_permissions",
			logging.FieldEntity, "permission",
			"count", len(permissions),
		)

		return permissions, nil
	})(ctx)
}

// Update Permission
func (s *permissionService) UpdatePermission(ctx context.Context, id string, req *userPb.UpdatePermissionRequest) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](10 * time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Updating permission",
			logging.FieldOperation, "update_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id,
		)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid permission ID format", err,
				logging.FieldOperation, "update_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id,
			)
			return nil, exceptions.InvalidInput("invalid permission ID format", err,
				exceptions.WithOperation("update_permission"),
				exceptions.WithEntity("permission", id))
		}

		// Update permission entity
		permission := &userPb.Permission{
			Id:          objectID.Hex(),
			Code:        req.Code,
			Name:        req.Name,
			Description: req.Description,
			UpdatedAt:   time.Now().Format(time.RFC3339),
		}

		// Save permission
		if err := s.permissionRepository.UpdatePermission(ctx, permission); err != nil {
			logger.Error("Failed to update permission", err,
				logging.FieldOperation, "update_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id,
				"code", req.Code,
			)
			return nil, err
		}

		logger.Info("Permission updated successfully",
			logging.FieldOperation, "update_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id,
			"code", req.Code,
		)

		return permission, nil
	})(ctx)
}

// Delete Permission
func (s *permissionService) DeletePermission(ctx context.Context, id string) error {
	_, err := decorator.WithTimeout[struct{}](5 * time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deleting permission",
			logging.FieldOperation, "delete_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id,
		)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid permission ID format", err,
				logging.FieldOperation, "delete_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id,
			)
			return struct{}{}, exceptions.InvalidInput("invalid permission ID format", err,
				exceptions.WithOperation("delete_permission"),
				exceptions.WithEntity("permission", id))
		}

		if err := s.permissionRepository.DeletePermission(ctx, objectID); err != nil {
			logger.Error("Failed to delete permission", err,
				logging.FieldOperation, "delete_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id,
			)
			return struct{}{}, err
		}

		logger.Info("Permission deleted successfully",
			logging.FieldOperation, "delete_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id,
		)

		return struct{}{}, nil
	})(ctx)

	return err
}
