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
		majorService *MajorService
	}
)

func NewUserService(db *mongo.Database) *UserService {
	collection := db.Collection("users")
	return &UserService{
		BaseService:  queries.NewBaseService[model.User](collection),
		majorService: NewMajorService(db),
	}
}

func (s *UserService) GetUsers(ctx context.Context, opts queries.QueryOptions) (*queries.Response[model.User], error) {
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}

	response, err := s.FindAllWithPopulateNested(ctx, opts, "metadata.major", "majors")
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (s *UserService) GetUserById(ctx context.Context, id string) (*model.User, error) {
	user, err := s.FindOneById(ctx, id)
	if err != nil {
		return nil, err
	}
	return &user.Data[0], nil
}

