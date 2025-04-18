package repository

import (
	"context"

	"go.mongodb.org/mongo-driver/bson/primitive"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
)

// UserRepositoryService defines user-specific operations
type UserRepositoryService interface {
	CreateUser(ctx context.Context, user *userPb.User) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*userPb.User, error)
	FindByUsername(ctx context.Context, username string) (*userPb.User, error)
	FindAll(ctx context.Context) ([]*userPb.User, error)
	UpdateUser(ctx context.Context, user *userPb.User) error
	UpdatePassword(ctx context.Context, userID primitive.ObjectID, password string) error
	DeleteUser(ctx context.Context, id primitive.ObjectID) error
	ValidatePassword(ctx context.Context, username, password string) (bool, error)
}

// RoleRepositoryService defines role-specific operations
type RoleRepositoryService interface {
	CreateRole(ctx context.Context, role *userPb.Role) error
	FindRoleByID(ctx context.Context, id primitive.ObjectID) (*userPb.Role, error)
	FindAllRoles(ctx context.Context) ([]*userPb.Role, error)
	UpdateRole(ctx context.Context, role *userPb.Role) error
	DeleteRole(ctx context.Context, id primitive.ObjectID) error
}

// PermissionRepositoryService defines permission-specific operations
type PermissionRepositoryService interface {
	CreatePermission(ctx context.Context, permission *userPb.Permission) error
	FindPermissionByID(ctx context.Context, id primitive.ObjectID) (*userPb.Permission, error)
	FindAllPermissions(ctx context.Context) ([]*userPb.Permission, error)
	UpdatePermission(ctx context.Context, permission *userPb.Permission) error
	DeletePermission(ctx context.Context, id primitive.ObjectID) error
} 