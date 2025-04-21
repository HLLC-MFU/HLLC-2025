package repository

import (
	"context"
	"errors"
	"log"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
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
		
		// Ensure we have an ID and convert it to ObjectID for MongoDB _id field
		if role.Id == "" {
			role.Id = primitive.NewObjectID().Hex()
		}
		
		objectID, err := primitive.ObjectIDFromHex(role.Id)
		if err != nil {
			// If the ID is invalid, generate a new one
			objectID = primitive.NewObjectID()
			role.Id = objectID.Hex()
		}
		
		// Create a document with both _id and id fields matching
		doc := bson.M{
			"_id":            objectID,
			"id":             role.Id,
			"name":           role.Name,
			"code":           role.Code,
			"description":    role.Description,
			"permission_ids": role.PermissionIds,
			"created_at":     role.CreatedAt,
			"updated_at":     role.UpdatedAt,
		}
		
		_, err = collection.InsertOne(ctx, doc)
		if err != nil {
			if mongo.IsDuplicateKeyError(err) {
				return struct{}{}, errors.New("role already exists")
			}
			return struct{}{}, err
		}
		
		log.Printf("Created role in database: %s (%s) with %d permissions", 
			role.Name, role.Id, len(role.PermissionIds))
		
		return struct{}{}, nil
	})(ctx)
	return err
}

// FindRoleByID finds a role by ID with timeout handling
func (r *roleRepository) FindRoleByID(ctx context.Context, id primitive.ObjectID) (*userPb.Role, error) {
	var role *userPb.Role
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("roles")
		
		// Log what we're looking for
		log.Printf("FindRoleByID: Looking for role with ID %s", id.Hex())
		
		// First try to get the raw document for debugging
		var rawDoc bson.M
		err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&rawDoc)
		if err == nil {
			// Log the raw document to see exactly what's in the database
			log.Printf("FindRoleByID: Raw role document: %+v", rawDoc)
			
			// Log permission IDs from the raw document
			if pids, ok := rawDoc["permission_ids"].(primitive.A); ok {
				log.Printf("FindRoleByID: Found permission_ids as primitive.A: %v", pids)
			} else if pids, ok := rawDoc["permissionIds"].(primitive.A); ok {
				log.Printf("FindRoleByID: Found permissionIds as primitive.A: %v", pids)
			} else {
				log.Printf("FindRoleByID: Could not find permission IDs in document")
			}
		} else {
			log.Printf("FindRoleByID: Error getting raw document: %v", err)
		}
		
		// Try finding by _id first
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
		
		if err := result.Decode(&role); err != nil {
			return struct{}{}, err
		}
		
		// Ensure permissionIds is at least an empty array instead of nil
		if role.PermissionIds == nil {
			role.PermissionIds = []string{}
		}
		
		// Log the role structure for debugging
		log.Printf("FindRoleByID: Found role by ID %s: %s (%s) with %d permission IDs: %v", 
			id.Hex(), role.Name, role.Id, len(role.PermissionIds), role.PermissionIds)
		
		return struct{}{}, nil
	})(ctx)
	if err != nil {
		return nil, err
	}
	return role, nil
}

// FindAllRoles retrieves all roles with timeout and cursor handling
func (r *roleRepository) FindAllRoles(ctx context.Context) ([]*userPb.Role, error) {
	var roles []*userPb.Role
	
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("roles")
		
		// Get all roles from the collection
		log.Printf("Finding all roles in the database...")
		cursor, err := collection.Find(ctx, bson.M{})
		if err != nil {
			log.Printf("Error finding roles: %v", err)
			return struct{}{}, err
		}
		defer cursor.Close(ctx)

		// Decode into raw BSON documents first for better debugging
		var rawDocs []bson.M
		if err := cursor.All(ctx, &rawDocs); err != nil {
			log.Printf("Error decoding roles: %v", err)
			return struct{}{}, err
		}
		
		log.Printf("Found %d roles in database", len(rawDocs))
		
		// Convert raw documents to proto objects
		roles = make([]*userPb.Role, 0, len(rawDocs))
		for _, doc := range rawDocs {
			// Debug log the document key names
			keys := make([]string, 0, len(doc))
			for k := range doc {
				keys = append(keys, k)
			}
			log.Printf("Role document keys: %v", keys)
			
			// Extract ID fields properly
			var roleID string
			if id, ok := doc["_id"].(primitive.ObjectID); ok {
				roleID = id.Hex()
				log.Printf("Extracted role ID from _id field: %s", roleID)
			} else if id, ok := doc["id"].(string); ok {
				roleID = id
				log.Printf("Extracted role ID from id field: %s", roleID)
			} else {
				log.Printf("Warning: Role document has invalid ID format: %v", doc["_id"])
				continue
			}
			
			// Extract permission IDs, handling different field name formats
			var permissionIDs []string
			
			// First check for permission_ids (snake_case)
			if pids, ok := doc["permission_ids"].(primitive.A); ok {
				log.Printf("Found permission_ids as primitive.A with %d elements", len(pids))
				for _, pid := range pids {
					if pidStr, ok := pid.(string); ok {
						permissionIDs = append(permissionIDs, pidStr)
						log.Printf("Added permission ID: %s", pidStr)
					} else {
						log.Printf("Warning: Non-string permission ID: %T %v", pid, pid)
					}
				}
			} else if pids, ok := doc["permission_ids"].([]interface{}); ok {
				log.Printf("Found permission_ids as []interface{} with %d elements", len(pids))
				for _, pid := range pids {
					if pidStr, ok := pid.(string); ok {
						permissionIDs = append(permissionIDs, pidStr)
						log.Printf("Added permission ID: %s", pidStr)
					} else {
						log.Printf("Warning: Non-string permission ID: %T %v", pid, pid)
					}
				}
			} else {
				// Then check for permissionIds (camelCase)
				if pids, ok := doc["permissionIds"].(primitive.A); ok {
					log.Printf("Found permissionIds as primitive.A with %d elements", len(pids))
					for _, pid := range pids {
						if pidStr, ok := pid.(string); ok {
							permissionIDs = append(permissionIDs, pidStr)
							log.Printf("Added permission ID: %s", pidStr)
						} else {
							log.Printf("Warning: Non-string permission ID: %T %v", pid, pid)
						}
					}
				} else if pids, ok := doc["permissionIds"].([]interface{}); ok {
					log.Printf("Found permissionIds as []interface{} with %d elements", len(pids))
					for _, pid := range pids {
						if pidStr, ok := pid.(string); ok {
							permissionIDs = append(permissionIDs, pidStr)
							log.Printf("Added permission ID: %s", pidStr)
						} else {
							log.Printf("Warning: Non-string permission ID: %T %v", pid, pid)
						}
					}
				} else {
					log.Printf("No permission IDs found in role document")
					permissionIDs = []string{}
				}
			}
			
			// Create Role object
			role := &userPb.Role{
				Id:            roleID,
				Name:          getStringValue(doc, "name"),
				Code:          getStringValue(doc, "code"),
				Description:   getStringValue(doc, "description"),
				PermissionIds: permissionIDs,
				CreatedAt:     getStringValue(doc, "created_at"),
				UpdatedAt:     getStringValue(doc, "updated_at"),
			}
			
			log.Printf("Processed role: %s (%s) with %d permission IDs: %v", 
				role.Name, role.Id, len(role.PermissionIds), role.PermissionIds)
			
			roles = append(roles, role)
		}
		
		log.Printf("Successfully processed %d roles", len(roles))
		return struct{}{}, nil
	})(ctx)
	
	if err != nil {
		return nil, err
	}
	return roles, nil
}

// getStringValue safely extracts string values from BSON documents
func getStringValue(doc bson.M, key string) string {
	// Try snake_case first
	if val, ok := doc[key].(string); ok {
		return val
	}
	
	// Try camelCase alternative
	camelKey := toCamelCase(key)
	if val, ok := doc[camelKey].(string); ok {
		return val
	}
	
	return ""
}

// toCamelCase converts a snake_case string to camelCase
func toCamelCase(s string) string {
	parts := strings.Split(s, "_")
	for i := 1; i < len(parts); i++ {
		if len(parts[i]) > 0 {
			parts[i] = strings.ToUpper(parts[i][:1]) + parts[i][1:]
		}
	}
	return strings.Join(parts, "")
}

// UpdateRole updates role information with timeout handling
func (r *roleRepository) UpdateRole(ctx context.Context, role *userPb.Role) error {
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		collection := r.dbConnect(ctx).Collection("roles")
		
		// Ensure permissionIds is at least an empty array 
		if role.PermissionIds == nil {
			role.PermissionIds = []string{}
		}
		
		// Log what we're about to update
		log.Printf("Updating role %s with permission IDs: %v", role.Id, role.PermissionIds)
		
		// Check if the role exists first
		var existing bson.M
		objectID, err := primitive.ObjectIDFromHex(role.Id)
		if err != nil {
			log.Printf("Error converting role ID to ObjectID: %v", err)
			return struct{}{}, err
		}
		
		err = collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&existing)
		if err != nil {
			// Try by string ID
			err = collection.FindOne(ctx, bson.M{"id": role.Id}).Decode(&existing)
			if err != nil {
				log.Printf("Error finding role to update: %v", err)
				return struct{}{}, err
			}
		}
		
		// Create the update with both snake_case and camelCase for maximum compatibility
		update := bson.M{
			"$set": bson.M{
				"name":           role.Name,
				"code":           role.Code,
				"description":    role.Description,
				"permission_ids": role.PermissionIds, // snake_case
				"permissionIds":  role.PermissionIds, // camelCase
				"updated_at":     time.Now().Format(time.RFC3339),
			},
		}
		
		// Update by _id field
		result, err := collection.UpdateOne(ctx, 
			bson.M{"_id": objectID}, 
			update)
			
		if err != nil {
			log.Printf("Error updating role: %v", err)
			return struct{}{}, err
		}
		
		if result.MatchedCount == 0 {
			// Try updating by string ID
			result, err = collection.UpdateOne(ctx, 
				bson.M{"id": role.Id}, 
				update)
				
			if err != nil {
				log.Printf("Error updating role by string ID: %v", err)
				return struct{}{}, err
			}
			
			if result.MatchedCount == 0 {
				log.Printf("Role not found for update: %s", role.Id)
				return struct{}{}, ErrNotFound
			}
		}
		
		log.Printf("Successfully updated role %s (%s) with %d permissions", 
			role.Name, role.Id, len(role.PermissionIds))
		
		return struct{}{}, nil
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