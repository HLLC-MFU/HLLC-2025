package repository

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
)

// PermissionRepositoryService defines permission-specific operations
type (
	PermissionRepositoryService interface {
		CreatePermission(ctx context.Context, permission *userPb.Permission) error
		FindPermissionByID(ctx context.Context, id primitive.ObjectID) (*userPb.Permission, error)
		FindPermissionByCode(ctx context.Context, code string) (*userPb.Permission, error)
		FindAllPermissions(ctx context.Context) ([]*userPb.Permission, error)
		UpdatePermission(ctx context.Context, permission *userPb.Permission) error
		DeletePermission(ctx context.Context, id primitive.ObjectID) error
	}

	permissionRepository struct {
		db *mongo.Client
	}
)

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
		
		// Create a document with both _id and id fields matching
		objectID, err := primitive.ObjectIDFromHex(permission.Id)
		if err != nil {
			return struct{}{}, exceptions.NewAppError(exceptions.ErrInvalidID, "invalid permission ID format", err)
		}
		
		doc := bson.M{
			"_id":         objectID,
			"id":          permission.Id,
			"name":        permission.Name,
			"code":        permission.Code,
			"description": permission.Description,
			"created_at":  permission.CreatedAt,
			"updated_at":  permission.UpdatedAt,
		}
		
		if _, err := collection.InsertOne(ctx, doc); err != nil {
			if mongo.IsDuplicateKeyError(err) {
				return struct{}{}, exceptions.NewAppError(exceptions.ErrConflict, "permission already exists", err)
			}
			return struct{}{}, exceptions.NewAppError(exceptions.ErrInternalServerError, "failed to create permission", err)
		}
		
		log.Printf("Created permission in database: %s (%s)", 
			permission.Name, permission.Id)
		
		return struct{}{}, nil
	})(ctx)
	return err
}

// FindPermissionByID finds a permission by ID with timeout handling
func (r *permissionRepository) FindPermissionByID(ctx context.Context, id primitive.ObjectID) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](5*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		collection := r.dbConnect(ctx).Collection("permissions")
		
		// Try finding by _id first
		var permission userPb.Permission
		result := collection.FindOne(ctx, bson.M{"_id": id})
		if result.Err() != nil {
			if result.Err() == mongo.ErrNoDocuments {
				// If not found by _id, try by id string field
				idStr := id.Hex()
				result = collection.FindOne(ctx, bson.M{"id": idStr})
				if result.Err() != nil {
					if result.Err() == mongo.ErrNoDocuments {
						return nil, exceptions.NewAppError(exceptions.ErrNotFound, "permission not found", result.Err())
					}
					return nil, exceptions.NewAppError(exceptions.ErrInternalServerError, "failed to find permission", result.Err())
				}
			} else {
				return nil, exceptions.NewAppError(exceptions.ErrInternalServerError, "failed to find permission", result.Err())
			}
		}
		
		if err := result.Decode(&permission); err != nil {
			return nil, exceptions.NewAppError(exceptions.ErrInternalServerError, "failed to decode permission", err)
		}
		
		return &permission, nil
	})(ctx)
}

// FindPermissionByCode finds a permission by code with timeout handling
func (r *permissionRepository) FindPermissionByCode(ctx context.Context, code string) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](5*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		collection := r.dbConnect(ctx).Collection("permissions")
		
		var permission userPb.Permission
		err := collection.FindOne(ctx, bson.M{"code": code}).Decode(&permission)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return nil, exceptions.NewAppError(exceptions.ErrNotFound, "permission not found", err)
			}
			return nil, exceptions.NewAppError(exceptions.ErrInternalServerError, "failed to find permission", err)
		}
		
		return &permission, nil
	})(ctx)
}

// FindAllPermissions retrieves all permissions with timeout handling
func (r *permissionRepository) FindAllPermissions(ctx context.Context) ([]*userPb.Permission, error) {
	return decorator.WithTimeout[[]*userPb.Permission](10*time.Second)(func(ctx context.Context) ([]*userPb.Permission, error) {
		collection := r.dbConnect(ctx).Collection("permissions")
		
		// Get all permissions from the collection
		cursor, err := collection.Find(ctx, bson.M{})
		if err != nil {
			return nil, exceptions.NewAppError(exceptions.ErrInternalServerError, "failed to find permissions", err)
		}
		defer cursor.Close(ctx)

		var permissions []*userPb.Permission
		if err := cursor.All(ctx, &permissions); err != nil {
			return nil, exceptions.NewAppError(exceptions.ErrInternalServerError, "failed to decode permissions", err)
		}
		
		// If nil, return empty array instead
		if permissions == nil {
			permissions = []*userPb.Permission{}
		}
		
		return permissions, nil
	})(ctx)
}

// UpdatePermission updates permission information with timeout handling
func (r *permissionRepository) UpdatePermission(ctx context.Context, permission *userPb.Permission) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("permissions")
		
		objectID, err := primitive.ObjectIDFromHex(permission.Id)
		if err != nil {
			return struct{}{}, exceptions.NewAppError(exceptions.ErrInvalidID, "invalid permission ID format", err)
		}
		
		update := bson.M{
			"$set": bson.M{
				"name":        permission.Name,
				"code":        permission.Code,
				"description": permission.Description,
				"updated_at":  permission.UpdatedAt,
			},
		}
		
		result, err := collection.UpdateOne(ctx, bson.M{"_id": objectID}, update)
		if err != nil {
			return struct{}{}, exceptions.NewAppError(exceptions.ErrInternalServerError, "failed to update permission", err)
		}
		
		if result.MatchedCount == 0 {
			// Try by string ID if not found by ObjectID
			result, err = collection.UpdateOne(ctx, bson.M{"id": permission.Id}, update)
			if err != nil {
				return struct{}{}, exceptions.NewAppError(exceptions.ErrInternalServerError, "failed to update permission", err)
			}
			
			if result.MatchedCount == 0 {
				return struct{}{}, exceptions.NewAppError(exceptions.ErrNotFound, "permission not found", nil)
			}
		}
		
		return struct{}{}, nil
	})(ctx)
	return err
}

// DeletePermission deletes a permission with timeout handling
func (r *permissionRepository) DeletePermission(ctx context.Context, id primitive.ObjectID) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("permissions")
		
		result, err := collection.DeleteOne(ctx, bson.M{"_id": id})
		if err != nil {
			return struct{}{}, exceptions.NewAppError(exceptions.ErrInternalServerError, "failed to delete permission", err)
		}
		
		if result.DeletedCount == 0 {
			// Try by string ID if not found by ObjectID
			result, err = collection.DeleteOne(ctx, bson.M{"id": id.Hex()})
			if err != nil {
				return struct{}{}, exceptions.NewAppError(exceptions.ErrInternalServerError, "failed to delete permission", err)
			}
			
			if result.DeletedCount == 0 {
				return struct{}{}, exceptions.NewAppError(exceptions.ErrNotFound, "permission not found", nil)
			}
		}
		
		return struct{}{}, nil
	})(ctx)
	return err
} 