package service

import (
	"chat/module/user/model"
	"chat/pkg/database/queries"
	"context"

	"go.mongodb.org/mongo-driver/mongo"
)

type (
	RoleService struct {
		*queries.BaseService[model.Role]
	}
)

func NewRoleService(db *mongo.Database) *RoleService {
	return &RoleService{
		BaseService: queries.NewBaseService[model.Role](db.Collection("roles")),
	}
}

func (s *RoleService) GetRoles(ctx context.Context, opts queries.QueryOptions) (*queries.Response[model.Role], error) {
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}

	return s.FindAll(ctx, opts)
}

func (s *RoleService) GetRoleById(ctx context.Context, id string) (*model.Role, error) {
	role, err := s.FindOneById(ctx, id)
	if err != nil {
		return nil, err
	}
	return &role.Data[0], nil
}