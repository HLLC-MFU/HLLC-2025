package repository

import (
	"go.mongodb.org/mongo-driver/mongo"
)

// Factory creates repository instances
type Factory struct {
	db *mongo.Client
}

// NewFactory creates a new repository factory
func NewFactory(db *mongo.Client) *Factory {
	return &Factory{db: db}
}

// NewUserRepository creates a new user repository instance
func (f *Factory) NewUserRepository() UserRepositoryService {
	return &userRepository{db: f.db}
}

// NewRoleRepository creates a new role repository instance
func (f *Factory) NewRoleRepository() RoleRepositoryService {
	return &roleRepository{db: f.db}
}

// NewPermissionRepository creates a new permission repository instance
func (f *Factory) NewPermissionRepository() PermissionRepositoryService {
	return &permissionRepository{db: f.db}
} 