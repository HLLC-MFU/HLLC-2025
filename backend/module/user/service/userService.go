package service

import (
	"context"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/user"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/ansel1/merry/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	CreateUser(ctx context.Context, req *user.CreateUserRequest) (*user.UserResponse, error)
	GetUserByID(ctx context.Context, id string) (*user.UserResponse, error)
	UpdateUser(ctx context.Context, id string, req *user.UpdateUserRequest) (*user.UserResponse, error)
	DeleteUser(ctx context.Context, id string) error
	ListUsers(ctx context.Context, page, limit int64) (*user.UserListResponse, error)
	UpdatePassword(ctx context.Context, id string, req *user.UpdatePasswordRequest) error
}

type userService struct {
	userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{
		userRepo: userRepo,
	}
}

func (s *userService) CreateUser(ctx context.Context, req *user.CreateUserRequest) (*user.UserResponse, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, merry.Wrap(err, merry.WithHTTPCode(500))
	}

	// Convert role IDs to ObjectIDs
	roleIDs := make([]primitive.ObjectID, len(req.RoleIDs))
	for i, id := range req.RoleIDs {
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return nil, merry.New("invalid role ID", merry.WithHTTPCode(400))
		}
		roleIDs[i] = objID
	}

	user := &user.User{
		Name: user.Name{
			FirstName:  req.FirstName,
			MiddleName: req.MiddleName,
			LastName:   req.LastName,
		},
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		Roles:        roleIDs,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return s.mapUserToResponse(user), nil
}

func (s *userService) GetUserByID(ctx context.Context, id string) (*user.UserResponse, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, merry.New("invalid user ID", merry.WithHTTPCode(400))
	}

	user, err := s.userRepo.FindByID(ctx, objID)
	if err != nil {
		return nil, err
	}

	return s.mapUserToResponse(user), nil
}

func (s *userService) UpdateUser(ctx context.Context, id string, req *user.UpdateUserRequest) (*user.UserResponse, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, merry.New("invalid user ID", merry.WithHTTPCode(400))
	}

	user, err := s.userRepo.FindByID(ctx, objID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.FirstName != "" {
		user.Name.FirstName = req.FirstName
	}
	user.Name.MiddleName = req.MiddleName // Middle name can be empty
	if req.LastName != "" {
		user.Name.LastName = req.LastName
	}

	if len(req.RoleIDs) > 0 {
		roleIDs := make([]primitive.ObjectID, len(req.RoleIDs))
		for i, id := range req.RoleIDs {
			objID, err := primitive.ObjectIDFromHex(id)
			if err != nil {
				return nil, merry.New("invalid role ID", merry.WithHTTPCode(400))
			}
			roleIDs[i] = objID
		}
		user.Roles = roleIDs
	}

	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	return s.mapUserToResponse(user), nil
}

func (s *userService) DeleteUser(ctx context.Context, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return merry.New("invalid user ID", merry.WithHTTPCode(400))
	}

	return s.userRepo.Delete(ctx, objID)
}

func (s *userService) ListUsers(ctx context.Context, page, limit int64) (*user.UserListResponse, error) {
	users, total, err := s.userRepo.List(ctx, page, limit)
	if err != nil {
		return nil, err
	}

	userResponses := make([]user.UserResponse, len(users))
	for i, user := range users {
		userResponses[i] = *s.mapUserToResponse(user)
	}

	return &user.UserListResponse{
		Users: userResponses,
		Total: total,
	}, nil
}

func (s *userService) UpdatePassword(ctx context.Context, id string, req *user.UpdatePasswordRequest) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return merry.New("invalid user ID", merry.WithHTTPCode(400))
	}

	user, err := s.userRepo.FindByID(ctx, objID)
	if err != nil {
		return err
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		return merry.New("invalid old password", merry.WithHTTPCode(400))
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return merry.Wrap(err, merry.WithHTTPCode(500))
	}

	user.PasswordHash = string(hashedPassword)
	user.UpdatedAt = time.Now()

	return s.userRepo.Update(ctx, user)
}

func (s *userService) mapUserToResponse(user *user.User) *user.UserResponse {
	return &user.UserResponse{
		ID:         user.ID.Hex(),
		FirstName:  user.Name.FirstName,
		MiddleName: user.Name.MiddleName,
		LastName:   user.Name.LastName,
		Username:   user.Username,
		CreatedAt:  user.CreatedAt,
		UpdatedAt:  user.UpdatedAt,
	}
} 