package service

import (
	"context"
	"fmt"

	majorService "github.com/HLLC-MFU/HLLC-2025/backend/module/majors/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserService interface {
	GetById(ctx context.Context, id primitive.ObjectID) (*model.User, error)

	GetByUsername(ctx context.Context, username string) (*model.User, error)

	ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error)

	ExistsByUsername(ctx context.Context, username string) (bool, error)

	List(ctx context.Context, page, limit int64) ([]*model.User, int64, error)

	GetUsersByMetadataField(ctx context.Context, field, value string) ([]*model.User, error)
}

type service struct {
	repo         repository.UserRepository
	majorService majorService.MajorService
}

func NewUserService(repo repository.UserRepository, majorService majorService.MajorService) UserService {
	return &service{
		repo:         repo,
		majorService: majorService,
	}
}

func (s *service) GetById(ctx context.Context, id primitive.ObjectID) (*model.User, error) {
	return s.repo.GetById(ctx, id)
}

func (s *service) GetByUsername(ctx context.Context, username string) (*model.User, error) {
	return s.repo.GetByUsername(ctx, username)
}

func (s *service) ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error) {
	return s.repo.ExistsByID(ctx, id)
}

func (s *service) ExistsByUsername(ctx context.Context, username string) (bool, error) {
	return s.repo.ExistsByUsername(ctx, username)
}

func (s *service) List(ctx context.Context, page, limit int64) ([]*model.User, int64, error) {
	return s.repo.List(ctx, page, limit)
}

func (s *service) GetUsersByMetadataField(ctx context.Context, field, value string) ([]*model.User, error) {
	var filter bson.M

	switch field {
	case "major":
		filter = bson.M{
			"$or": []bson.M{
				{"metadata.major": value},
				{"metadata.major.id": value},
			},
		}
	case "school":
		schoolID, err := primitive.ObjectIDFromHex(value)
		if err != nil {
			return nil, fmt.Errorf("invalid school ID: %v", err)
		}

		// 1. ค้นหา majors ทั้งหมดที่อยู่ในโรงเรียนที่ต้องการ
		majors, _, err := s.majorService.ListMajors(ctx, 1, 1000) // ดึงทั้งหมด
		if err != nil {
			return nil, fmt.Errorf("failed to list majors: %v", err)
		}

		// 2. กรอง majors ที่อยู่ในโรงเรียนที่ต้องการ
		var majorIDs []string
		for _, major := range majors {
			if major.School == schoolID {
				majorIDs = append(majorIDs, major.ID.Hex())
			}
		}

		if len(majorIDs) == 0 {
			return []*model.User{}, nil // ไม่พบ majors ในโรงเรียนนี้
		}

		// 3. ค้นหา users ที่มี major อยู่ในรายการที่เราหาได้
		filter = bson.M{
			"metadata.major": bson.M{
				"$in": majorIDs,
			},
		}

	default:
		filter = bson.M{fmt.Sprintf("metadata.%s", field): value}
	}

	fmt.Printf("🔍 Final MongoDB Filter: %+v\n", filter)
	return s.repo.FindByFilter(ctx, filter)
}
