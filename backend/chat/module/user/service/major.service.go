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
	MajorService struct {
		*queries.BaseService[model.Major]
	}
)

func NewMajorService(db *mongo.Database) *MajorService {
	return &MajorService{
		BaseService: queries.NewBaseService[model.Major](db.Collection("majors")),
	}
}

func (s *MajorService) GetMajors(ctx context.Context, opts queries.QueryOptions) (*queries.Response[model.Major], error) {
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}

	return s.FindAllWithPopulate(ctx, opts, "school", "schools")		
}

func (s *MajorService) GetMajorById(ctx context.Context, id string) (*model.Major, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid major ID: %w", err)
	}
	
	response, err := s.FindOneWithPopulate(ctx, map[string]interface{}{"_id": objID}, "school", "schools")	
	if err != nil {
		return nil, err
	}
	if len(response.Data) == 0 {
		return nil, fmt.Errorf("major not found")
	}
	return &response.Data[0], nil
}
