package serviceHttp

import (
	"context"
	"time"

	rolePb "github.com/HLLC-MFU/HLLC-2025/backend/module/role/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/role/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RoleService interface {
	CreateRole(ctx context.Context, req *rolePb.Role) error
	GetRole(ctx context.Context, id string) (*rolePb.Role, error)
	ListRoles(ctx context.Context) ([]*rolePb.Role, error)
	UpdateRole(ctx context.Context, id string, req *rolePb.Role) error
	DeleteRole(ctx context.Context, id string) error
}

type roleService struct {
	roleRepository repository.RoleRepository
}

func NewRoleService(roleRepository repository.RoleRepository) RoleService {
	return &roleService{
		roleRepository: roleRepository,
	}
}

func (s *roleService) CreateRole(ctx context.Context, req *rolePb.Role) error {
	// Set created_at / updated_at
	now := time.Now().Unix()
	req.CreatedAt = now
	req.UpdatedAt = now

	return s.roleRepository.Create(ctx, req)
}

func (s *roleService) GetRole(ctx context.Context, id string) (*rolePb.Role, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	return s.roleRepository.FindByID(ctx, objectID)
}

func (s *roleService) ListRoles(ctx context.Context) ([]*rolePb.Role, error) {
	return s.roleRepository.List(ctx)
}

func (s *roleService) UpdateRole(ctx context.Context, id string, req *rolePb.Role) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	// Update updated_at
	req.UpdatedAt = time.Now().Unix()

	return s.roleRepository.Update(ctx, objectID, req)
}

func (s *roleService) DeleteRole(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	return s.roleRepository.Delete(ctx, objectID)
}
