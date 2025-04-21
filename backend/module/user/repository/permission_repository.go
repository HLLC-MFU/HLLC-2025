package repository

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
)

// PermissionRepositoryService defines permission-specific operations
type PermissionRepositoryService interface {
	CreatePermission(ctx context.Context, permission *userPb.Permission) error
	FindPermissionByID(ctx context.Context, id primitive.ObjectID) (*userPb.Permission, error)
	FindAllPermissions(ctx context.Context) ([]*userPb.Permission, error)
	UpdatePermission(ctx context.Context, permission *userPb.Permission) error
	DeletePermission(ctx context.Context, id primitive.ObjectID) error
}

// permissionRepository implements permission-specific operations
type permissionRepository struct {
	db *mongo.Client
}

// NewPermissionRepository creates a new permission repository instance
func NewPermissionRepository(db *mongo.Client) PermissionRepositoryService {
	return &permissionRepository{db: db}
}

func (r *permissionRepository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

// CreatePermission creates a new permission with timeout handling
func (r *permissionRepository) CreatePermission(ctx context.Context, permission *userPb.Permission) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("permissions")
		_, err := collection.InsertOne(ctx, permission)
		return struct{}{}, err
	})(ctx)
	return err
}

// FindPermissionByID finds a permission by ID with timeout handling
func (r *permissionRepository) FindPermissionByID(ctx context.Context, id primitive.ObjectID) (*userPb.Permission, error) {
	var permission *userPb.Permission
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("permissions")
		
		// Try finding by _id field first
		result := collection.FindOne(ctx, bson.M{"_id": id})
		if result.Err() != nil {
			if result.Err() == mongo.ErrNoDocuments {
				// If not found by _id, try by id string field
				idStr := id.Hex()
				result = collection.FindOne(ctx, bson.M{"id": idStr})
				if result.Err() != nil {
					if result.Err() == mongo.ErrNoDocuments {
						return struct{}{}, ErrNotFound
					}
					return struct{}{}, result.Err()
				}
			} else {
				return struct{}{}, result.Err()
			}
		}
		
		// Decode the permission document
		permission = &userPb.Permission{}
		if err := result.Decode(permission); err != nil {
			return struct{}{}, err
		}
		
		return struct{}{}, nil
	})(ctx)
	if err != nil {
		return nil, err
	}
	return permission, nil
}

// FindAllPermissions retrieves all permissions with timeout and cursor handling
func (r *permissionRepository) FindAllPermissions(ctx context.Context) ([]*userPb.Permission, error) {
	var permissions []*userPb.Permission
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("permissions")
		cursor, err := collection.Find(ctx, bson.M{})
		if err != nil {
			return struct{}{}, err
		}
		defer cursor.Close(ctx)

		if err := cursor.All(ctx, &permissions); err != nil {
			return struct{}{}, err
		}
		return struct{}{}, nil
	})(ctx)
	if err != nil {
		return nil, err
	}
	return permissions, nil
}

// UpdatePermission updates permission information with timeout handling
func (r *permissionRepository) UpdatePermission(ctx context.Context, permission *userPb.Permission) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("permissions")
		update := bson.M{
			"$set": bson.M{
				"name":        permission.Name,
				"code":        permission.Code,
				"description": permission.Description,
				"module":      permission.Module,
				"updated_at":  time.Now(),
			},
		}
		_, err := collection.UpdateByID(ctx, permission.Id, update)
		return struct{}{}, err
	})(ctx)
	return err
}

// DeletePermission deletes a permission with timeout handling
func (r *permissionRepository) DeletePermission(ctx context.Context, id primitive.ObjectID) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("permissions")
		_, err := collection.DeleteOne(ctx, bson.M{"_id": id})
		return struct{}{}, err
	})(ctx)
	return err
} 