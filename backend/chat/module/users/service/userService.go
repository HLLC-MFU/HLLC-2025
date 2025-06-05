package service

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserService interface {
	Create(ctx context.Context, user *model.User) error

	GetById(ctx context.Context, id primitive.ObjectID) (*model.User, error)

	GetByUsername(ctx context.Context, username string) (*model.User, error)

	ExistsByID(ctx context.Context, id primitive.ObjectID) (bool, error)

	ExistsByUsername(ctx context.Context, username string) (bool, error)

	List(ctx context.Context, page, limit int64) ([]*model.User, int64, error)

	Update(ctx context.Context, user *model.User) error

	Delete(ctx context.Context, id primitive.ObjectID) error
}

type service struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, user *model.User) error {
	return s.repo.Create(ctx, user)
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

func (s *service) Update(ctx context.Context, user *model.User) error {
	return s.repo.Update(ctx, user)
}

func (s *service) Delete(ctx context.Context, id primitive.ObjectID) error {
	return s.repo.Delete(ctx, id)
}
