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
	ErrPermissionNotFound = errors.New("permission not found")
	ErrPermissionExists   = errors.New("permission with this code already exists")
)

// PermissionService defines the permission service operations
type PermissionService interface {
	// Permission gRPC methods - direct use of protobuf types
	CreatePermissionGRPC(ctx context.Context, req *userPb.CreatePermissionRequest) (*userPb.Permission, error)
	GetPermissionGRPC(ctx context.Context, req *userPb.GetPermissionRequest) (*userPb.Permission, error)
	GetAllPermissionsGRPC(ctx context.Context, req *userPb.GetAllPermissionsRequest) (*userPb.GetAllPermissionsResponse, error)
	UpdatePermissionGRPC(ctx context.Context, req *userPb.UpdatePermissionRequest) (*userPb.Permission, error)
	DeletePermissionGRPC(ctx context.Context, req *userPb.DeletePermissionRequest) (*userPb.Empty, error)
	
	// Legacy methods (will be deprecated)
	CreatePermission(ctx context.Context, req *userPb.CreatePermissionRequest) (*userPb.Permission, error)
	GetPermissionByID(ctx context.Context, id string) (*userPb.Permission, error)
	GetAllPermissions(ctx context.Context) ([]*userPb.Permission, error)
	UpdatePermission(ctx context.Context, id string, req *userPb.UpdatePermissionRequest) (*userPb.Permission, error)
	DeletePermission(ctx context.Context, id string) error
}

// permissionService implements PermissionService
type permissionService struct {
	cfg      *config.Config
	permRepo repository.PermissionRepositoryService
}

// NewPermissionService creates a new permission service
func NewPermissionService(
	cfg *config.Config,
	permRepo repository.PermissionRepositoryService,
) PermissionService {
	return &permissionService{
		cfg:      cfg,
		permRepo: permRepo,
	}
}

// CreatePermission creates a new permission
func (s *permissionService) CreatePermission(ctx context.Context, req *userPb.CreatePermissionRequest) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](10*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		log.Printf("CreatePermission: Creating new permission with code %s", req.Code)
		
		// Create permission entity
		newPermission := &userPb.Permission{
			Id:          primitive.NewObjectID().Hex(),
			Name:        req.Name,
			Code:        req.Code,
			Description: req.Description,
			Module:      req.Module,
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		}

		// Save permission
		if err := s.permRepo.CreatePermission(ctx, newPermission); err != nil {
			log.Printf("CreatePermission: Error saving permission to database: %v", err)
			return nil, err
		}

		log.Printf("CreatePermission: Successfully created permission %s with ID %s", newPermission.Name, newPermission.Id)
		return newPermission, nil
	})(ctx)
}

// GetPermissionByID gets a permission by ID
func (s *permissionService) GetPermissionByID(ctx context.Context, id string) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](5*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		log.Printf("GetPermissionByID: Fetching permission with ID %s", id)
		
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("GetPermissionByID: Invalid ID format %s: %v", id, err)
			return nil, err
		}

		permission, err := s.permRepo.FindPermissionByID(ctx, objectID)
		if err != nil {
			log.Printf("GetPermissionByID: Error finding permission: %v", err)
			return nil, err
		}

		return permission, nil
	})(ctx)
}

// GetAllPermissions gets all permissions
func (s *permissionService) GetAllPermissions(ctx context.Context) ([]*userPb.Permission, error) {
	return decorator.WithTimeout[[]*userPb.Permission](10*time.Second)(func(ctx context.Context) ([]*userPb.Permission, error) {
		log.Printf("GetAllPermissions: Fetching all permissions")
		
		permissions, err := s.permRepo.FindAllPermissions(ctx)
		if err != nil {
			log.Printf("GetAllPermissions: Error finding permissions: %v", err)
			return nil, err
		}

		log.Printf("GetAllPermissions: Successfully retrieved %d permissions", len(permissions))
		return permissions, nil
	})(ctx)
}

// UpdatePermission updates a permission
func (s *permissionService) UpdatePermission(ctx context.Context, id string, req *userPb.UpdatePermissionRequest) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](10*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		log.Printf("UpdatePermission: Updating permission with ID %s", id)
		
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("UpdatePermission: Invalid ID format %s: %v", id, err)
			return nil, err
		}

		// Get existing permission
		permission, err := s.permRepo.FindPermissionByID(ctx, objectID)
		if err != nil {
			log.Printf("UpdatePermission: Error finding permission: %v", err)
			return nil, err
		}

		// Update fields if provided
		if req.Name != "" {
			permission.Name = req.Name
		}
		
		if req.Code != "" {
			permission.Code = req.Code
		}
		
		if req.Description != "" {
			permission.Description = req.Description
		}
		
		if req.Module != "" {
			permission.Module = req.Module
		}

		// Update timestamp
		permission.UpdatedAt = time.Now().Format(time.RFC3339)

		// Save updated permission
		if err := s.permRepo.UpdatePermission(ctx, permission); err != nil {
			log.Printf("UpdatePermission: Error updating permission: %v", err)
			return nil, err
		}

		log.Printf("UpdatePermission: Successfully updated permission %s", permission.Name)
		return permission, nil
	})(ctx)
}

// DeletePermission deletes a permission
func (s *permissionService) DeletePermission(ctx context.Context, id string) error {
	_, innerErr := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		log.Printf("DeletePermission: Deleting permission with ID %s", id)
		
		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Printf("DeletePermission: Invalid ID format %s: %v", id, err)
			return struct{}{}, err
		}

		if err := s.permRepo.DeletePermission(ctx, objectID); err != nil {
			log.Printf("DeletePermission: Error deleting permission: %v", err)
			return struct{}{}, err
		}

		log.Printf("DeletePermission: Successfully deleted permission with ID %s", id)
		return struct{}{}, nil
	})(ctx)
	
	return innerErr
}

// CreatePermissionGRPC implements the gRPC method for creating a permission
func (s *permissionService) CreatePermissionGRPC(ctx context.Context, req *userPb.CreatePermissionRequest) (*userPb.Permission, error) {
	// Simply call the non-GRPC version now that it uses the same types
	return s.CreatePermission(ctx, req)
}

// GetPermissionGRPC implements the gRPC method for getting a permission
func (s *permissionService) GetPermissionGRPC(ctx context.Context, req *userPb.GetPermissionRequest) (*userPb.Permission, error) {
	// Call the non-GRPC version with the ID from the request
	return s.GetPermissionByID(ctx, req.Id)
}

// GetAllPermissionsGRPC implements the gRPC method for getting all permissions
func (s *permissionService) GetAllPermissionsGRPC(ctx context.Context, req *userPb.GetAllPermissionsRequest) (*userPb.GetAllPermissionsResponse, error) {
	return decorator.WithTimeout[*userPb.GetAllPermissionsResponse](10*time.Second)(func(ctx context.Context) (*userPb.GetAllPermissionsResponse, error) {
		// Get all permissions using the non-GRPC version
		permissions, err := s.GetAllPermissions(ctx)
		if err != nil {
			return nil, err
		}
		
		// Create the response with the permissions
		return &userPb.GetAllPermissionsResponse{
			Permissions: permissions,
		}, nil
	})(ctx)
}

// UpdatePermissionGRPC implements the gRPC method for updating a permission
func (s *permissionService) UpdatePermissionGRPC(ctx context.Context, req *userPb.UpdatePermissionRequest) (*userPb.Permission, error) {
	// Call the non-GRPC version with the ID from the request
	return s.UpdatePermission(ctx, req.Id, req)
}

// DeletePermissionGRPC implements the gRPC method for deleting a permission
func (s *permissionService) DeletePermissionGRPC(ctx context.Context, req *userPb.DeletePermissionRequest) (*userPb.Empty, error) {
	return decorator.WithTimeout[*userPb.Empty](5*time.Second)(func(ctx context.Context) (*userPb.Empty, error) {
		// Delete the permission using the non-GRPC version
		err := s.DeletePermission(ctx, req.Id)
		if err != nil {
			return nil, err
		}
		
		// Return an empty response
		return &userPb.Empty{}, nil
	})(ctx)
} 