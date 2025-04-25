package repository

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
)

const (
	collectionPermissions = "permissions"
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

func (r *permissionRepository) permissionsColl(ctx context.Context) *mongo.Collection {
	return r.dbConnect(ctx).Collection(collectionPermissions)
}

// CreatePermission creates a new permission with proper error handling and logging
func (r *permissionRepository) CreatePermission(ctx context.Context, permission *userPb.Permission) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating permission",
			logging.FieldOperation, "create_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, permission.Id,
			"code", permission.Code,
		)

		permissionsColl := r.permissionsColl(ctx)
		
		// Create a document with both _id and id fields matching
		objectID, err := primitive.ObjectIDFromHex(permission.Id)
		if err != nil {
			logger.Error("Invalid permission ID format", err,
				logging.FieldOperation, "create_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, permission.Id,
			)
			return struct{}{}, exceptions.InvalidInput("invalid permission ID format", err, 
				exceptions.WithOperation("create_permission"))
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
		
		if _, err := permissionsColl.InsertOne(ctx, doc); err != nil {
			if mongo.IsDuplicateKeyError(err) {
				logger.Warn("Permission already exists",
					logging.FieldOperation, "create_permission",
					logging.FieldEntity, "permission",
					logging.FieldEntityID, permission.Id,
					"code", permission.Code,
				)
				return struct{}{}, exceptions.AlreadyExists("permission", "code or id", permission.Code, err,
					exceptions.WithOperation("create_permission"))
			}
			
			logger.Error("Failed to create permission", err,
				logging.FieldOperation, "create_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, permission.Id,
				"code", permission.Code,
			)
			return struct{}{}, exceptions.Internal("failed to create permission", err,
				exceptions.WithOperation("create_permission"))
		}
		
		logger.Info("Permission created successfully",
			logging.FieldOperation, "create_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, permission.Id,
			"code", permission.Code,
		)
		
		return struct{}{}, nil
	})(ctx)
	return err
}

// FindPermissionByID finds a permission by ID with proper error handling and logging
func (r *permissionRepository) FindPermissionByID(ctx context.Context, id primitive.ObjectID) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](5*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding permission by ID",
			logging.FieldOperation, "find_permission_by_id",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id.Hex(),
		)
		
		permissionsColl := r.permissionsColl(ctx)
		
		// Try finding by _id first
		var permission userPb.Permission
		result := permissionsColl.FindOne(ctx, bson.M{"_id": id})
		if result.Err() != nil {
			if result.Err() == mongo.ErrNoDocuments {
				// If not found by _id, try by id string field
				idStr := id.Hex()
				logger.Info("Permission not found by _id, trying by id field",
					logging.FieldOperation, "find_permission_by_id",
					logging.FieldEntity, "permission",
					logging.FieldEntityID, idStr,
				)
				
				result = permissionsColl.FindOne(ctx, bson.M{"id": idStr})
				if result.Err() != nil {
					if result.Err() == mongo.ErrNoDocuments {
						logger.Warn("Permission not found",
							logging.FieldOperation, "find_permission_by_id",
							logging.FieldEntity, "permission",
							logging.FieldEntityID, idStr,
						)
						return nil, exceptions.NotFound("permission", idStr, result.Err(),
							exceptions.WithOperation("find_permission_by_id"))
					}
					
					logger.Error("Failed to find permission by id field", result.Err(),
						logging.FieldOperation, "find_permission_by_id",
						logging.FieldEntity, "permission",
						logging.FieldEntityID, idStr,
					)
					return nil, exceptions.Internal("failed to find permission", result.Err(),
						exceptions.WithOperation("find_permission_by_id"))
				}
			} else {
				logger.Error("Failed to find permission by _id", result.Err(),
					logging.FieldOperation, "find_permission_by_id",
					logging.FieldEntity, "permission",
					logging.FieldEntityID, id.Hex(),
				)
				return nil, exceptions.Internal("failed to find permission", result.Err(),
					exceptions.WithOperation("find_permission_by_id"))
			}
		}
		
		if err := result.Decode(&permission); err != nil {
			logger.Error("Failed to decode permission", err,
				logging.FieldOperation, "find_permission_by_id",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id.Hex(),
			)
			return nil, exceptions.Internal("failed to decode permission", err,
				exceptions.WithOperation("find_permission_by_id"))
		}
		
		logger.Info("Permission found successfully",
			logging.FieldOperation, "find_permission_by_id",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, permission.Id,
			"code", permission.Code,
		)
		
		return &permission, nil
	})(ctx)
}

// FindPermissionByCode finds a permission by code with proper error handling and logging
func (r *permissionRepository) FindPermissionByCode(ctx context.Context, code string) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](5*time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding permission by code",
			logging.FieldOperation, "find_permission_by_code",
			logging.FieldEntity, "permission",
			"code", code,
		)
		
		collection := r.permissionsColl(ctx)
		
		var permission userPb.Permission
		err := collection.FindOne(ctx, bson.M{"code": code}).Decode(&permission)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("Permission not found by code",
					logging.FieldOperation, "find_permission_by_code",
					logging.FieldEntity, "permission",
					"code", code,
				)
				return nil, exceptions.NotFound("permission", code, err,
					exceptions.WithOperation("find_permission_by_code"),
					exceptions.WithContext(map[string]interface{}{"identifier": "code"}))
			}
			
			logger.Error("Failed to find permission by code", err,
				logging.FieldOperation, "find_permission_by_code",
				logging.FieldEntity, "permission",
				"code", code,
			)
			return nil, exceptions.Internal("failed to find permission", err,
				exceptions.WithOperation("find_permission_by_code"))
		}
		
		logger.Info("Permission found successfully by code",
			logging.FieldOperation, "find_permission_by_code",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, permission.Id,
			"code", permission.Code,
		)
		
		return &permission, nil
	})(ctx)
}

// FindAllPermissions retrieves all permissions with proper error handling and logging
func (r *permissionRepository) FindAllPermissions(ctx context.Context) ([]*userPb.Permission, error) {
	return decorator.WithTimeout[[]*userPb.Permission](10*time.Second)(func(ctx context.Context) ([]*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding all permissions",
			logging.FieldOperation, "find_all_permissions",
			logging.FieldEntity, "permission",
		)
		
		permissionsColl := r.permissionsColl(ctx)
		
		// Get all permissions from the collection
		cursor, err := permissionsColl.Find(ctx, bson.M{})
		if err != nil {
			logger.Error("Failed to find permissions", err,
				logging.FieldOperation, "find_all_permissions",
				logging.FieldEntity, "permission",
			)
			return nil, exceptions.Internal("failed to find permissions", err,
				exceptions.WithOperation("find_all_permissions"))
		}
		defer cursor.Close(ctx)

		var permissions []*userPb.Permission
		if err := cursor.All(ctx, &permissions); err != nil {
			logger.Error("Failed to decode permissions", err,
				logging.FieldOperation, "find_all_permissions",
				logging.FieldEntity, "permission",
			)
			return nil, exceptions.Internal("failed to decode permissions", err,
				exceptions.WithOperation("find_all_permissions"))
		}
		
		// If nil, return empty array instead
		if permissions == nil {
			permissions = []*userPb.Permission{}
		}
		
		logger.Info("Found permissions successfully",
			logging.FieldOperation, "find_all_permissions",
			logging.FieldEntity, "permission",
			"count", len(permissions),
		)
		
		return permissions, nil
	})(ctx)
}

// UpdatePermission updates permission information with proper error handling and logging
func (r *permissionRepository) UpdatePermission(ctx context.Context, permission *userPb.Permission) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Updating permission",
			logging.FieldOperation, "update_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, permission.Id,
			"code", permission.Code,
		)
		
		permissionsColl := r.permissionsColl(ctx)
		
		objectID, err := primitive.ObjectIDFromHex(permission.Id)
		if err != nil {
			logger.Error("Invalid permission ID format", err,
				logging.FieldOperation, "update_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, permission.Id,
			)
			return struct{}{}, exceptions.InvalidInput("invalid permission ID format", err,
				exceptions.WithOperation("update_permission"))
		}
		
		update := bson.M{
			"$set": bson.M{
				"name":        permission.Name,
				"code":        permission.Code,
				"description": permission.Description,
				"updated_at":  permission.UpdatedAt,
			},
		}
		
		result, err := permissionsColl.UpdateOne(ctx, bson.M{"_id": objectID}, update)
		if err != nil {
			logger.Error("Failed to update permission", err,
				logging.FieldOperation, "update_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, permission.Id,
			)
			return struct{}{}, exceptions.Internal("failed to update permission", err,
				exceptions.WithOperation("update_permission"))
		}
		
		if result.MatchedCount == 0 {
			// Try by string ID if not found by ObjectID
			logger.Info("Permission not found by _id, trying by id field",
				logging.FieldOperation, "update_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, permission.Id,
			)
			
			result, err = permissionsColl.UpdateOne(ctx, bson.M{"id": permission.Id}, update)
			if err != nil {
				logger.Error("Failed to update permission by id field", err,
					logging.FieldOperation, "update_permission",
					logging.FieldEntity, "permission",
					logging.FieldEntityID, permission.Id,
				)
				return struct{}{}, exceptions.Internal("failed to update permission", err,
					exceptions.WithOperation("update_permission"))
			}
			
			if result.MatchedCount == 0 {
				logger.Warn("Permission not found for update",
					logging.FieldOperation, "update_permission",
					logging.FieldEntity, "permission",
					logging.FieldEntityID, permission.Id,
				)
				return struct{}{}, exceptions.NotFound("permission", permission.Id, nil,
					exceptions.WithOperation("update_permission"))
			}
		}
		
		logger.Info("Permission updated successfully",
			logging.FieldOperation, "update_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, permission.Id,
			"code", permission.Code,
		)
		
		return struct{}{}, nil
	})(ctx)
	return err
}

// DeletePermission deletes a permission with proper error handling and logging
func (r *permissionRepository) DeletePermission(ctx context.Context, id primitive.ObjectID) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deleting permission",
			logging.FieldOperation, "delete_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id.Hex(),
		)
		
		permissionsColl := r.permissionsColl(ctx)
		
		result, err := permissionsColl.DeleteOne(ctx, bson.M{"_id": id})
		if err != nil {
			logger.Error("Failed to delete permission", err,
				logging.FieldOperation, "delete_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id.Hex(),
			)
			return struct{}{}, exceptions.Internal("failed to delete permission", err,
				exceptions.WithOperation("delete_permission"))
		}
		
		if result.DeletedCount == 0 {
			// Try by string ID if not found by ObjectID
			logger.Info("Permission not found by _id, trying by id field",
				logging.FieldOperation, "delete_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id.Hex(),
			)
			
			result, err = permissionsColl.DeleteOne(ctx, bson.M{"id": id.Hex()})
			if err != nil {
				logger.Error("Failed to delete permission by id field", err,
					logging.FieldOperation, "delete_permission",
					logging.FieldEntity, "permission",
					logging.FieldEntityID, id.Hex(),
				)
				return struct{}{}, exceptions.Internal("failed to delete permission", err,
					exceptions.WithOperation("delete_permission"))
			}
			
			if result.DeletedCount == 0 {
				logger.Warn("Permission not found for deletion",
					logging.FieldOperation, "delete_permission",
					logging.FieldEntity, "permission",
					logging.FieldEntityID, id.Hex(),
				)
				return struct{}{}, exceptions.NotFound("permission", id.Hex(), nil,
					exceptions.WithOperation("delete_permission"))
			}
		}
		
		logger.Info("Permission deleted successfully",
			logging.FieldOperation, "delete_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id.Hex(),
		)
		
		return struct{}{}, nil
	})(ctx)
	return err
} 