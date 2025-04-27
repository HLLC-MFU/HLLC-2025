package http

import (
	"context"

	permissionPb "github.com/HLLC-MFU/HLLC-2025/backend/module/permission/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/permission/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PermissionService interface {
	CreatePermission(ctx context.Context, req *permissionPb.Permission) error
	GetPermission(ctx context.Context, id string) (*permissionPb.Permission, error)
	ListPermissions(ctx context.Context) ([]*permissionPb.Permission, error)
	UpdatePermission(ctx context.Context, id string, req *permissionPb.Permission) error
	DeletePermission(ctx context.Context, id string) error
}

type permissionService struct {
	repo repository.PermissionRepository
}

func NewPermissionService(repo repository.PermissionRepository) PermissionService {
	return &permissionService{repo: repo}
}

func (s *permissionService) CreatePermission(ctx context.Context, req *permissionPb.Permission) error {
	return s.repo.Create(ctx, req)
}

func (s *permissionService) GetPermission(ctx context.Context, id string) (*permissionPb.Permission, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	return s.repo.FindByID(ctx, objID)
}

func (s *permissionService) ListPermissions(ctx context.Context) ([]*permissionPb.Permission, error) {
	return s.repo.List(ctx)
}

func (s *permissionService) UpdatePermission(ctx context.Context, id string, req *permissionPb.Permission) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	return s.repo.Update(ctx, objID, req)
}

func (s *permissionService) DeletePermission(ctx context.Context, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	return s.repo.Delete(ctx, objID)
}
