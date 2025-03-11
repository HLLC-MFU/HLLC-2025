package repository

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
)

// roleRepository implements role-specific operations
type roleRepository struct {
	db *mongo.Client
}

// NewRoleRepository creates a new role repository instance
func NewRoleRepository(db *mongo.Client) RoleRepositoryService {
	return &roleRepository{db: db}
}

func (r *roleRepository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

// CreateRole creates a new role with timeout handling
func (r *roleRepository) CreateRole(ctx context.Context, role *userPb.Role) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("roles")
		_, err := collection.InsertOne(ctx, role)
		return struct{}{}, err
	})(ctx)
	return err
}

// FindRoleByID finds a role by ID with timeout handling
func (r *roleRepository) FindRoleByID(ctx context.Context, id primitive.ObjectID) (*userPb.Role, error) {
	var role userPb.Role
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("roles")
		err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&role)
		if err == mongo.ErrNoDocuments {
			return struct{}{}, ErrNotFound
		}
		return struct{}{}, err
	})(ctx)
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// FindAllRoles retrieves all roles with timeout and cursor handling
func (r *roleRepository) FindAllRoles(ctx context.Context) ([]*userPb.Role, error) {
	var roles []*userPb.Role
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("roles")
		cursor, err := collection.Find(ctx, bson.M{})
		if err != nil {
			return struct{}{}, err
		}
		defer cursor.Close(ctx)

		if err := cursor.All(ctx, &roles); err != nil {
			return struct{}{}, err
		}
		return struct{}{}, nil
	})(ctx)
	if err != nil {
		return nil, err
	}
	return roles, nil
}

// UpdateRole updates role information with timeout handling
func (r *roleRepository) UpdateRole(ctx context.Context, role *userPb.Role) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("roles")
		update := bson.M{
			"$set": bson.M{
				"name":        role.Name,
				"code":        role.Code,
				"description": role.Description,
				"updated_at":  time.Now(),
			},
		}
		_, err := collection.UpdateByID(ctx, role.Id, update)
		return struct{}{}, err
	})(ctx)
	return err
}

// DeleteRole deletes a role with timeout handling
func (r *roleRepository) DeleteRole(ctx context.Context, id primitive.ObjectID) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("roles")
		_, err := collection.DeleteOne(ctx, bson.M{"_id": id})
		return struct{}{}, err
	})(ctx)
	return err
} 