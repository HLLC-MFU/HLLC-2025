package service

import (
	"chat/module/user/model"
	"chat/pkg/database/queries"
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type (
	UserService struct {
		*queries.BaseService[model.User]
		majorService *MajorService
		db          *mongo.Database
	}
)

func NewUserService(db *mongo.Database) *UserService {
	collection := db.Collection("users")
	return &UserService{
		BaseService:  queries.NewBaseService[model.User](collection),
		majorService: NewMajorService(db),
		db:          db,
	}
}

func (s *UserService) GetUsers(ctx context.Context, opts queries.QueryOptions) (*queries.Response[model.User], error) {
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}

	populateConfigs := []queries.NestedPopulateConfig{
		{
			Field:      "role",
			Collection: "roles",
		},
		{
			Field:      "major",
			Collection: "majors",
			NestedPath: "metadata.major",
		},
	}

	return s.FindAllWithNestedPopulate(ctx, opts, populateConfigs)
}

func (s *UserService) GetUserById(ctx context.Context, id string) (*model.User, error) {
	return s.GetUserByIdWithPopulate(ctx, id)
}

func (s *UserService) GetUserByIdWithPopulate(ctx context.Context, id string) (*model.User, error) {
	userObjID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	populateConfigs := []queries.NestedPopulateConfig{
		{
			Field:      "role",
			Collection: "roles",
		},
		{
			Field:      "metadata.major",
			Collection: "majors",
			NestedPath: "metadata.major",
			SubPopulate: &queries.NestedPopulateConfig{
				Field:      "school",
				Collection: "schools",
			},
		},
	}

	filter := map[string]interface{}{"_id": userObjID}
	response, err := s.FindOneWithNestedPopulate(ctx, filter, populateConfigs)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}

	if len(response.Data) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	return &response.Data[0], nil
}

