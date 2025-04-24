package http

import (
	"context"
	"log"
	"time"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
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
			log.Printf("CreatePermission: Error saving permission to database: %v", err)
			return nil, err
		}

		return permission, nil
	})(ctx)
}

// Get Permission By ID
func (s *permissionService) GetPermissionByID(ctx context.Context, id string) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](10 * time.Second)(func(ctx context.Context) (*userPb.Permission, error) {

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("GetPermissionByID: Invalid ID format %s: %v", id, err)
			return nil, err
		}

		permission, err := s.permissionRepository.FindPermissionByID(ctx, objectID)
		if err != nil {
			log.Printf("GetPermissionByID: Error finding permission: %v", err)
			return nil, err
		}

		return permission, nil
	})(ctx)
}

// Get All Permissions
func (s *permissionService) GetAllPermissions(ctx context.Context) ([]*userPb.Permission, error) {
	return decorator.WithTimeout[[]*userPb.Permission](10 * time.Second)(func(ctx context.Context) ([]*userPb.Permission, error) {
		log.Printf("GetAllPermissions: Fetching all permissions")

		permissions, err := s.permissionRepository.FindAllPermissions(ctx)
		if err != nil {
			log.Printf("GetAllPermissions: Error finding permissions: %v", err)
			return nil, err
		}

		return permissions, nil
	})(ctx)
}

// Update Permission
func (s *permissionService) UpdatePermission(ctx context.Context, id string, req *userPb.UpdatePermissionRequest) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](10 * time.Second)(func(ctx context.Context) (*userPb.Permission, error) {

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("UpdatePermission: Invalid ID format %s: %v", id, err)
			return nil, err
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
			log.Printf("UpdatePermission: Error updating permission in database: %v", err)
			return nil, err
		}

		return permission, nil
	})(ctx)
}

// Delete Permission
func (s *permissionService) DeletePermission(ctx context.Context, id string) error {
	_, err := decorator.WithTimeout[struct{}](5 * time.Second)(func(ctx context.Context) (struct{}, error) {
		log.Printf("DeletePermission: Deleting permission with ID %s", id)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("DeletePermission: Invalid ID format %s: %v", id, err)
			return struct{}{}, err
		}

		if err := s.permissionRepository.DeletePermission(ctx, objectID); err != nil {
			log.Printf("DeletePermission: Error deleting permission: %v", err)
			return struct{}{}, err
		}

		return struct{}{}, nil
	})(ctx)

	return err
}
