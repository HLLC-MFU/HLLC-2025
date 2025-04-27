package http

import (
	"context"
	"time"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserService interface {
	CreateUser(ctx context.Context, user *userPb.User) error
	GetUserByID(ctx context.Context, id string) (*userPb.User, error)
	GetUserByUsername(ctx context.Context, username string) (*userPb.User, error)
	ListUsers(ctx context.Context) ([]*userPb.User, error)
	UpdateUser(ctx context.Context, id string, user *userPb.User) error
	DeleteUser(ctx context.Context, id string) error
}

type userService struct {
	userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) CreateUser(ctx context.Context, user *userPb.User) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	return s.userRepo.Create(ctx, user)
}

func (s *userService) GetUserByID(ctx context.Context, id string) (*userPb.User, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	return s.userRepo.FindByID(ctx, objectID)
}

func (s *userService) GetUserByUsername(ctx context.Context, username string) (*userPb.User, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	return s.userRepo.FindByUsername(ctx, username)
}

func (s *userService) ListUsers(ctx context.Context) ([]*userPb.User, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	return s.userRepo.List(ctx)
}

func (s *userService) UpdateUser(ctx context.Context, id string, user *userPb.User) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	return s.userRepo.Update(ctx, objectID, user)
}

func (s *userService) DeleteUser(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	return s.userRepo.Delete(ctx, objectID)
}
