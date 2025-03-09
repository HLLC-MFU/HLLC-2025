package service

import (
	"context"
	"errors"

	"golang.org/x/crypto/bcrypt"

	userDto "github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userEntity "github.com/HLLC-MFU/HLLC-2025/backend/module/user/entity"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
)

var ErrNotFound = errors.New("user not found")

type (
	UserService interface {
		CreateUser(ctx context.Context, req *userDto.CreateUserRequest) (*userDto.UserResponse, error)
		GetUserByUsername(ctx context.Context, username string) (*userDto.UserResponse, error)
		ValidatePassword(ctx context.Context, username, password string) (bool, error)
	}

	userService struct {
		userRepo repository.UserRepositoryService
	}
)

func NewUserService(userRepo repository.UserRepositoryService) UserService {
	return &userService{
		userRepo: userRepo,
	}
}

func (s *userService) CreateUser(ctx context.Context, req *userDto.CreateUserRequest) (*userDto.UserResponse, error) {
	// Check if user already exists
	existingUser, err := s.userRepo.FindByUsername(ctx, req.Username)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("username already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user entity
	user := &userEntity.User{
		Username: req.Username,
		Password: string(hashedPassword),
		Name: userEntity.Name{
			FirstName: req.Name.FirstName,
			MiddleName: req.Name.MiddleName,
			LastName: req.Name.LastName,
		},
	}

	// Save user
	if err := s.userRepo.CreateUser(ctx, user); err != nil {
		return nil, err
	}

	// Return response
	return &userDto.UserResponse{
		ID: user.ID.Hex(),
		Name: req.Name,
		Username: user.Username,
	}, nil
}

func (s *userService) GetUserByUsername(ctx context.Context, username string) (*userDto.UserResponse, error) {
	user, err := s.userRepo.FindByUsername(ctx, username)
	if err != nil {
		return nil, err
	}

	return &userDto.UserResponse{
		ID: user.ID.Hex(),
		Name: userDto.Name{
			FirstName: user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName: user.Name.LastName,
		},
		Username: user.Username,
	}, nil
}

func (s *userService) ValidatePassword(ctx context.Context, username, password string) (bool, error) {
	user, err := s.userRepo.FindByUsername(ctx, username)
	if err != nil {
		return false, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		if err == bcrypt.ErrMismatchedHashAndPassword {
			return false, nil
		}
		return false, err
	}

	return true, nil
}