package service

import (
	"chat/module/user/model"
	"chat/pkg/database/queries"
	"context"

	"go.mongodb.org/mongo-driver/mongo"
)

type (
	MajorService struct {
		*queries.BaseService[model.Major]
	}
)

func NewMajorService(db *mongo.Database) *MajorService {
	return &MajorService{
		BaseService: queries.NewBaseService[model.Major](db.Collection("majors")),
	}
}

func (s *MajorService) GetMajors(ctx context.Context, filter map[string]interface{}) ([]model.Major, error) {
	majors, err := s.FindAll(ctx, queries.QueryOptions{
		Filter: filter,
	})
	if err != nil {
		return nil, err
	}
	return majors.Data, nil
}

func (s *MajorService) GetMajorById(ctx context.Context, id string) (*model.Major, error) {
	major, err := s.FindOneById(ctx, id)
	if err != nil {
		return nil, err
	}
	return &major.Data[0], nil
}