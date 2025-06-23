package service

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/roles/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/roles/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RoleService interface {
	ListRoles(ctx context.Context, page, limit int64) ([]*model.Role, int64, error)
	GetRole(ctx context.Context, id primitive.ObjectID) (*model.Role, error)
}

type service struct {
	repo repository.Rolerepository
}

func NewRoleService(repo repository.Rolerepository) RoleService {
	return &service{repo: repo}
}

func (s *service) ListRoles(ctx context.Context, page, limit int64) ([]*model.Role, int64, error) {
	return s.repo.List(ctx, page, limit)
}

func (s *service) GetRole(ctx context.Context, id primitive.ObjectID) (*model.Role, error) {
	return s.repo.GetById(ctx, id)
}
