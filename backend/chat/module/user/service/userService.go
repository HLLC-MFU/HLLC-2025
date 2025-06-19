package service

import (
	"chat/module/user/model"
	"chat/pkg/database/queries"
	"context"

	"go.mongodb.org/mongo-driver/mongo"
)

type (
	UserService struct {
		*queries.BaseService[model.User]
		MajorService *MajorService
		RoleService *RoleService
	}
)

func NewUserService(db *mongo.Database) *UserService {
	return &UserService{
		BaseService: queries.NewBaseService[model.User](db.Collection("users")),
		MajorService: NewMajorService(db),
		RoleService: NewRoleService(db),
	}
}

func (s *UserService) GetUsers(ctx context.Context, filter map[string]interface{}) ([]model.User, error) {
	users, err := s.FindAll(ctx, queries.QueryOptions{
		Filter: filter,
	})
	if err != nil {
		return nil, err
	}

	return users.Data, nil
}

func (s *UserService) GetUserById(ctx context.Context, id string) (*model.User, error) {
	user, err := s.FindOneById(ctx, id)
	if err != nil {
		return nil, err
	}
	return &user.Data[0], nil
}

