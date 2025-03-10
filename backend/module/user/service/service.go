package service

import (
	"context"
	"errors"

	"golang.org/x/crypto/bcrypt"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	userDto "github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userEntity "github.com/HLLC-MFU/HLLC-2025/backend/module/user/entity"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/user"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
)

var ErrNotFound = errors.New("user not found")

type UserService interface {
	// HTTP Service methods
	CreateUser(ctx context.Context, req *userDto.CreateUserRequest) (*userDto.UserResponse, error)
	GetUserByUsername(ctx context.Context, username string) (*userDto.UserResponse, error)
	ValidatePassword(ctx context.Context, username, password string) (bool, error)
	
	// gRPC Service methods
	CreateUserGRPC(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error)
	GetUserGRPC(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error)
	ValidateCredentialsGRPC(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error)
}

type userService struct {
	cfg  *config.Config
	repo repository.UserRepository
}

func NewUserService(cfg *config.Config, repo repository.UserRepository) UserService {
	return &userService{
		cfg:  cfg,
		repo: repo,
	}
}

// HTTP Service implementations
func (s *userService) CreateUser(ctx context.Context, req *userDto.CreateUserRequest) (*userDto.UserResponse, error) {
	// Check if user already exists
	existingUser, err := s.repo.FindByUsername(ctx, req.Username)
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
	if err := s.repo.CreateUser(ctx, user); err != nil {
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
	user, err := s.repo.FindByUsername(ctx, username)
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
	user, err := s.repo.FindByUsername(ctx, username)
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

// gRPC Service implementations
func (s *userService) CreateUserGRPC(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error) {
	// Convert gRPC request to internal DTO
	dtoReq := &userDto.CreateUserRequest{
		Username: req.Username,
		Password: req.Password,
		Name: userDto.Name{
			FirstName:  req.FirstName,
			MiddleName: req.MiddleName,
			LastName:   req.LastName,
		},
		RoleIDs: req.RoleIds,
	}

	// Use the same core logic as HTTP endpoint
	user, err := s.CreateUser(ctx, dtoReq)
	if err != nil {
		return nil, err
	}

	// Convert response to gRPC format
	return &userPb.User{
		Id:         user.ID,
		Username:   user.Username,
		FirstName:  user.Name.FirstName,
		MiddleName: user.Name.MiddleName,
		LastName:   user.Name.LastName,
		Roles:      user.Roles,
	}, nil
}

func (s *userService) GetUserGRPC(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error) {
	// Use the same core logic as HTTP endpoint
	user, err := s.GetUserByUsername(ctx, req.Username)
	if err != nil {
		return nil, err
	}

	// Convert response to gRPC format
	return &userPb.User{
		Id:         user.ID,
		Username:   user.Username,
		FirstName:  user.Name.FirstName,
		MiddleName: user.Name.MiddleName,
		LastName:   user.Name.LastName,
		Roles:      user.Roles,
	}, nil
}

func (s *userService) ValidateCredentialsGRPC(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error) {
	// Use the same core logic as HTTP endpoint
	isValid, err := s.ValidatePassword(ctx, req.Username, req.Password)
	if err != nil {
		return nil, err
	}

	if !isValid {
		return &userPb.ValidateCredentialsResponse{
			Valid: false,
		}, nil
	}

	// If credentials are valid, get user details
	user, err := s.GetUserByUsername(ctx, req.Username)
	if err != nil {
		return nil, err
	}

	return &userPb.ValidateCredentialsResponse{
		Valid: true,
		User: &userPb.User{
			Id:         user.ID,
			Username:   user.Username,
			FirstName:  user.Name.FirstName,
			MiddleName: user.Name.MiddleName,
			LastName:   user.Name.LastName,
			Roles:      user.Roles,
		},
	}, nil
}