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
		collection *mongo.Collection
	}
)

func NewSchoolService(db *mongo.Database) *SchoolService {
	collection := db.Collection("schools")
	return &SchoolService{
		BaseService: queries.NewBaseService[model.School](collection),
		collection: collection,
	}
}

// GetSchools retrieves schools with pagination
func (s *SchoolService) GetSchools(ctx context.Context, opts queries.QueryOptions) (*queries.Response[model.School], error) {

	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}

	return s.FindAll(ctx, opts)
}

// GetSchoolById retrieves a single school by ID
func (s *SchoolService) GetSchoolById(ctx context.Context, id string) (*model.School, error) {
	school, err := s.FindOneById(ctx, id)
	if err != nil {
		return nil, err
	}
	return &school.Data[0], nil
}