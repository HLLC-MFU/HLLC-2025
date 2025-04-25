package repository

import (
	"context"
	"fmt"
	"time"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const (
	collectionRoles = "roles"
)

// RoleRepositoryService defines role-specific operations
type (
	RoleRepositoryService interface {
		CreateRole(ctx context.Context, role *userPb.Role) error
		FindRoleByID(ctx context.Context, id primitive.ObjectID) (*userPb.Role, error)
		FindRoleByCode(ctx context.Context, code string) (*userPb.Role, error)
		FindAllRoles(ctx context.Context) ([]*userPb.Role, error)
		UpdateRole(ctx context.Context, role *userPb.Role) error
		DeleteRole(ctx context.Context, id primitive.ObjectID) error
	}

	roleRepository struct {
		db *mongo.Client
	}
)

// NewRoleRepository creates a new role repository
func NewRoleRepository(db *mongo.Client) RoleRepositoryService {
	return &roleRepository{db: db}
}

func (r *roleRepository) dbConnect(ctx context.Context) *mongo.Database {
	return r.db.Database("hllc-2025")
}

func (r *roleRepository) rolesColl(ctx context.Context) *mongo.Collection {
	return r.dbConnect(ctx).Collection(collectionRoles)
}

// CreateRole creates a new role with proper error handling and structured logging
func (r *roleRepository) CreateRole(ctx context.Context, role *userPb.Role) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating role",
			logging.FieldOperation, "create_role",
			logging.FieldEntity, "role",
			"code", role.Code,
			"name", role.Name,
		)
		
		rolesColl := r.rolesColl(ctx)
		
		// Check if role already exists by code
		var existingRole userPb.Role
		err := rolesColl.FindOne(ctx, bson.M{"code": role.Code}).Decode(&existingRole)
		if err == nil {
			logger.Warn("Role already exists",
				logging.FieldOperation, "create_role",
				logging.FieldEntity, "role",
				"code", role.Code,
			)
			return struct{}{}, exceptions.AlreadyExists(
				"role", "code", role.Code, nil,
				exceptions.WithOperation("create"),
			)
		} else if err != mongo.ErrNoDocuments {
			logger.Error("Error checking existing role", err,
				logging.FieldOperation, "create_role",
				logging.FieldEntity, "role",
				"code", role.Code,
			)
			return struct{}{}, exceptions.Internal("error checking existing role", err)
		}
		
		// Convert string ID to ObjectID for MongoDB
		var objectID primitive.ObjectID
		if role.Id == "" {
			objectID = primitive.NewObjectID()
			role.Id = objectID.Hex()
		} else {
			var err error
			objectID, err = primitive.ObjectIDFromHex(role.Id)
			if err != nil {
				logger.Error("Invalid role ID format", err,
					logging.FieldOperation, "create_role",
					logging.FieldEntity, "role",
					"role_id", role.Id,
				)
				return struct{}{}, exceptions.InvalidInput(fmt.Sprintf("invalid role ID format: %s", role.Id), err)
			}
		}
		
		// Create document
		doc := bson.M{
			"_id":           objectID,
			"id":            role.Id,
			"name":          role.Name,
			"code":          role.Code,
			"description":   role.Description,
			"permission_ids": role.PermissionIds,
			"created_at":    role.CreatedAt,
			"updated_at":    role.UpdatedAt,
		}
		
		// Insert role
		_, err = rolesColl.InsertOne(ctx, doc)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				logger.Warn("Duplicate key error when creating role", 
					logging.FieldOperation, "create_role",
					logging.FieldEntity, "role",
					"code", role.Code,
				)
				return struct{}{}, exceptions.AlreadyExists("role", "code", role.Code, err)
			}
			
			logger.Error("Error creating role", err,
				logging.FieldOperation, "create_role",
				logging.FieldEntity, "role",
				"code", role.Code,
			)
			return struct{}{}, exceptions.Internal("error creating role", err)
		}
		
		logger.Info("Role created successfully",
			logging.FieldOperation, "create_role",
			logging.FieldEntity, "role",
			logging.FieldEntityID, role.Id,
			"code", role.Code,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// FindRoleByID finds a role by ID with proper error handling and logging
func (r *roleRepository) FindRoleByID(ctx context.Context, id primitive.ObjectID) (*userPb.Role, error) {
	return decorator.WithTimeout[*userPb.Role](5*time.Second)(func(ctx context.Context) (*userPb.Role, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding role by ID",
			logging.FieldOperation, "find_role_by_id",
			logging.FieldEntity, "role",
			logging.FieldEntityID, id.Hex(),
		)
		
		rolesColl := r.rolesColl(ctx)
		
		// Try finding by both ID formats (_id and id string)
		filter := bson.M{
			"$or": []bson.M{
				{"_id": id},
				{"id": id.Hex()},
			},
		}
		
		var role userPb.Role
		err := rolesColl.FindOne(ctx, filter).Decode(&role)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("Role not found",
					logging.FieldOperation, "find_role_by_id",
					logging.FieldEntity, "role",
					logging.FieldEntityID, id.Hex(),
				)
				return nil, exceptions.NotFound("role", id.Hex(), err)
			}
			
			logger.Error("Error finding role by ID", err,
				logging.FieldOperation, "find_role_by_id",
				logging.FieldEntity, "role",
				logging.FieldEntityID, id.Hex(),
			)
			return nil, exceptions.Internal("error finding role by ID", err)
		}
		
		logger.Info("Found role by ID",
			logging.FieldOperation, "find_role_by_id",
			logging.FieldEntity, "role",
			logging.FieldEntityID, id.Hex(),
			"code", role.Code,
		)
		
		return &role, nil
	})(ctx)
}

// FindRoleByCode finds a role by code with proper error handling and logging
func (r *roleRepository) FindRoleByCode(ctx context.Context, code string) (*userPb.Role, error) {
	return decorator.WithTimeout[*userPb.Role](5*time.Second)(func(ctx context.Context) (*userPb.Role, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding role by code",
			logging.FieldOperation, "find_role_by_code",
			logging.FieldEntity, "role",
			"code", code,
		)
		
		rolesColl := r.rolesColl(ctx)
		
		var role userPb.Role
		err := rolesColl.FindOne(ctx, bson.M{"code": code}).Decode(&role)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("Role not found by code",
					logging.FieldOperation, "find_role_by_code",
					logging.FieldEntity, "role",
					"code", code,
				)
				return nil, exceptions.NotFound("role", fmt.Sprintf("code:%s", code), err)
			}
			
			logger.Error("Error finding role by code", err,
				logging.FieldOperation, "find_role_by_code",
				logging.FieldEntity, "role",
				"code", code,
			)
			return nil, exceptions.Internal("error finding role by code", err)
		}
		
		logger.Info("Found role by code",
			logging.FieldOperation, "find_role_by_code",
			logging.FieldEntity, "role",
			logging.FieldEntityID, role.Id,
			"code", code,
		)
		
		return &role, nil
	})(ctx)
}

// FindAllRoles retrieves all roles with proper error handling and logging
func (r *roleRepository) FindAllRoles(ctx context.Context) ([]*userPb.Role, error) {
	return decorator.WithTimeout[[]*userPb.Role](10*time.Second)(func(ctx context.Context) ([]*userPb.Role, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Finding all roles",
			logging.FieldOperation, "find_all_roles",
			logging.FieldEntity, "role",
		)
		
		rolesColl := r.rolesColl(ctx)
		
		// Find all roles
		cursor, err := rolesColl.Find(ctx, bson.M{})
		if err != nil {
			logger.Error("Error finding all roles", err,
				logging.FieldOperation, "find_all_roles",
				logging.FieldEntity, "role",
			)
			return nil, exceptions.Internal("error finding all roles", err)
		}
		defer cursor.Close(ctx)
		
		var roles []*userPb.Role
		if err := cursor.All(ctx, &roles); err != nil {
			logger.Error("Error decoding roles", err,
				logging.FieldOperation, "find_all_roles",
				logging.FieldEntity, "role",
			)
			return nil, exceptions.Internal("error decoding roles", err)
		}
		
		// Return empty array instead of nil
		if roles == nil {
			roles = []*userPb.Role{}
		}
		
		logger.Info("Found roles",
			logging.FieldOperation, "find_all_roles",
			logging.FieldEntity, "role",
			"count", len(roles),
		)
		
		return roles, nil
	})(ctx)
}

// UpdateRole updates a role with proper error handling and logging
func (r *roleRepository) UpdateRole(ctx context.Context, role *userPb.Role) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Updating role",
			logging.FieldOperation, "update_role",
			logging.FieldEntity, "role",
			logging.FieldEntityID, role.Id,
			"code", role.Code,
		)
		
		roleColl := r.rolesColl(ctx)
		
		// Convert string ID to ObjectID
		objectID, err := primitive.ObjectIDFromHex(role.Id)
		if err != nil {
			logger.Error("Invalid role ID format", err,
				logging.FieldOperation, "update_role",
				logging.FieldEntity, "role",
				"role_id", role.Id,
			)
			return struct{}{}, exceptions.InvalidInput(fmt.Sprintf("invalid role ID format: %s", role.Id), err)
		}
		
		// Check if role exists
		filter := bson.M{
			"$or": []bson.M{
				{"_id": objectID},
				{"id": role.Id},
			},
		}
		
		var existingRole userPb.Role
		err = roleColl.FindOne(ctx, filter).Decode(&existingRole)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("Role not found for update",
					logging.FieldOperation, "update_role",
					logging.FieldEntity, "role",
					logging.FieldEntityID, role.Id,
				)
				return struct{}{}, exceptions.NotFound("role", role.Id, err)
			}
			
			logger.Error("Error finding role for update", err,
				logging.FieldOperation, "update_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, role.Id,
			)
			return struct{}{}, exceptions.Internal("error finding role for update", err)
		}
		
		// Prepare update document
		update := bson.M{
			"$set": bson.M{
				"name":           role.Name,
				"code":           role.Code,
				"description":    role.Description,
				"permission_ids": role.PermissionIds,
				"updated_at":     role.UpdatedAt,
			},
		}
		
		// If code is changing, check for duplicates
		if role.Code != existingRole.Code {
			// Check if the new code already exists for another role
			var duplicateRole userPb.Role
			err = roleColl.FindOne(ctx, bson.M{
				"code": role.Code,
				"_id": bson.M{"$ne": objectID},
			}).Decode(&duplicateRole)
			
			if err == nil {
				logger.Warn("Role code already taken",
					logging.FieldOperation, "update_role",
					logging.FieldEntity, "role",
					"code", role.Code,
				)
				return struct{}{}, exceptions.AlreadyExists("role", "code", role.Code, nil)
			} else if err != mongo.ErrNoDocuments {
				logger.Error("Error checking code uniqueness", err,
					logging.FieldOperation, "update_role",
					logging.FieldEntity, "role",
					"code", role.Code,
				)
				return struct{}{}, exceptions.Internal("error checking code uniqueness", err)
			}
		}
		
		// Update role
		result, err := roleColl.UpdateOne(ctx, filter, update)
		if err != nil {
			logger.Error("Error updating role", err,
				logging.FieldOperation, "update_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, role.Id,
			)
			return struct{}{}, exceptions.Internal("error updating role", err)
		}
		
		if result.MatchedCount == 0 {
			logger.Warn("Role not found for update after check",
				logging.FieldOperation, "update_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, role.Id,
			)
			return struct{}{}, exceptions.NotFound("role", role.Id, nil)
		}
		
		logger.Info("Role updated successfully",
			logging.FieldOperation, "update_role",
			logging.FieldEntity, "role",
			logging.FieldEntityID, role.Id,
			"code", role.Code,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}

// DeleteRole deletes a role with proper error handling and logging
func (r *roleRepository) DeleteRole(ctx context.Context, id primitive.ObjectID) error {
	_, err := decorator.WithTimeout[struct{}](5*time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deleting role",
			logging.FieldOperation, "delete_role",
			logging.FieldEntity, "role",
			logging.FieldEntityID, id.Hex(),
		)
		
		collection := r.dbConnect(ctx).Collection("roles")
		
		// Find role first for better logging and error reporting
		filter := bson.M{
			"$or": []bson.M{
				{"_id": id},
				{"id": id.Hex()},
			},
		}
		
		var role userPb.Role
		err := collection.FindOne(ctx, filter).Decode(&role)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				logger.Warn("Role not found for deletion",
					logging.FieldOperation, "delete_role",
					logging.FieldEntity, "role",
					logging.FieldEntityID, id.Hex(),
				)
				return struct{}{}, exceptions.NotFound("role", id.Hex(), err)
			}
			
			logger.Error("Error finding role for deletion", err,
				logging.FieldOperation, "delete_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, id.Hex(),
			)
			return struct{}{}, exceptions.Internal("error finding role for deletion", err)
		}
		
		// Delete role
		result, err := collection.DeleteOne(ctx, filter)
		if err != nil {
			logger.Error("Error deleting role", err,
				logging.FieldOperation, "delete_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, id.Hex(),
				"code", role.Code,
			)
			return struct{}{}, exceptions.Internal("error deleting role", err)
		}
		
		if result.DeletedCount == 0 {
			logger.Warn("Role not deleted after found",
				logging.FieldOperation, "delete_role",
				logging.FieldEntity, "role",
				logging.FieldEntityID, id.Hex(),
				"code", role.Code,
			)
			return struct{}{}, exceptions.Internal("role not deleted after found", nil)
		}
		
		logger.Info("Role deleted successfully",
			logging.FieldOperation, "delete_role",
			logging.FieldEntity, "role",
			logging.FieldEntityID, id.Hex(),
			"code", role.Code,
		)
		
		return struct{}{}, nil
	})(ctx)
	
	return err
}