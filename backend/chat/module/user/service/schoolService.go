package service

import (
	"chat/module/user/model"
	"chat/pkg/database/queries"
	"context"

	"go.mongodb.org/mongo-driver/mongo"
)

type (
	SchoolService struct {
		*queries.BaseService[model.School]
	}
)

func NewSchoolService(db *mongo.Database) *SchoolService {
	return &SchoolService{
		BaseService: queries.NewBaseService[model.School](db.Collection("schools")),
	}
}

func (s *SchoolService) GetSchools(ctx context.Context, filter map[string]interface{}) ([]model.School, error) {
	schools, err := s.FindAll(ctx, queries.QueryOptions{
		Filter: filter,
	})
	if err != nil {
		return nil, err
	}
	return schools.Data, nil
}

func (s *SchoolService) GetSchoolById(ctx context.Context, id string) (*model.School, error) {
	school, err := s.FindOneById(ctx, id)
	if err != nil {
		return nil, err
	}
	return &school.Data[0], nil
}