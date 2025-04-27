package http

import (
	"context"

	userRolePb "github.com/HLLC-MFU/HLLC-2025/backend/module/user_role/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user_role/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserRoleService interface {
	CreateUserRole(ctx context.Context, req *userRolePb.UserRole) error
	GetUserRole(ctx context.Context, userID string) (*userRolePb.UserRole, error)
	UpdateUserRole(ctx context.Context, userID string, req *userRolePb.UserRole) error
	DeleteUserRole(ctx context.Context, userID string) error
}

type userRoleService struct {
	repo repository.UserRoleRepository
}

func NewUserRoleService(repo repository.UserRoleRepository) UserRoleService {
	return &userRoleService{repo: repo}
}

func (s *userRoleService) CreateUserRole(ctx context.Context, req *userRolePb.UserRole) error {
	return s.repo.Create(ctx, req)
}

func (s *userRoleService) GetUserRole(ctx context.Context, userID string) (*userRolePb.UserRole, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}
	return s.repo.FindByUserID(ctx, objID)
}

func (s *userRoleService) UpdateUserRole(ctx context.Context, userID string, req *userRolePb.UserRole) error {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}
	return s.repo.Update(ctx, objID, req)
}

func (s *userRoleService) DeleteUserRole(ctx context.Context, userID string) error {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}
	return s.repo.Delete(ctx, objID)
}
