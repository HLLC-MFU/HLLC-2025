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

// permissionRepository implements permission-specific operations
type permissionRepository struct {
	db *mongo.Client
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
	var permission userPb.Permission
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("permissions")
		err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&permission)
		if err == mongo.ErrNoDocuments {
			return struct{}{}, ErrNotFound
		}
		return struct{}{}, err
	})(ctx)
	if err != nil {
		return nil, err
	}
	return &permission, nil
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