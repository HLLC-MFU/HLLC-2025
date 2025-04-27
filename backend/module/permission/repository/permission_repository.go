package repository

import (
	"context"
	"time"

	permissionPb "github.com/HLLC-MFU/HLLC-2025/backend/module/permission/proto/generated"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type PermissionRepository interface {
	Create(ctx context.Context, permission *permissionPb.Permission) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*permissionPb.Permission, error)
	List(ctx context.Context) ([]*permissionPb.Permission, error)
	Update(ctx context.Context, id primitive.ObjectID, permission *permissionPb.Permission) error
	Delete(ctx context.Context, id primitive.ObjectID) error
}

type permissionRepository struct {
	collection *mongo.Collection
}

func NewPermissionRepository(db *mongo.Database) PermissionRepository {
	return &permissionRepository{
		collection: db.Collection("permissions"), // ใช้ collection ชื่อ permissions
	}
}

func (r *permissionRepository) Create(ctx context.Context, permission *permissionPb.Permission) error {
	now := time.Now().Unix()
	obj := bson.M{
		"name":       permission.Name,
		"module":     permission.Module,
		"action":     permission.Action,
		"created_at": now,
		"updated_at": now,
	}
	_, err := r.collection.InsertOne(ctx, obj)
	return err
}

func (r *permissionRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*permissionPb.Permission, error) {
	var result bson.M
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&result)
	if err != nil {
		return nil, err
	}
	return decodePermission(result), nil
}

func (r *permissionRepository) List(ctx context.Context) ([]*permissionPb.Permission, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var permissions []*permissionPb.Permission
	for cursor.Next(ctx) {
		var result bson.M
		if err := cursor.Decode(&result); err != nil {
			return nil, err
		}
		permissions = append(permissions, decodePermission(result))
	}
	return permissions, nil
}

func (r *permissionRepository) Update(ctx context.Context, id primitive.ObjectID, permission *permissionPb.Permission) error {
	update := bson.M{
		"name":       permission.Name,
		"module":     permission.Module,
		"action":     permission.Action,
		"updated_at": time.Now().Unix(),
	}
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
}

func (r *permissionRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// helper function
func decodePermission(data bson.M) *permissionPb.Permission {
	id := ""
	if oid, ok := data["_id"].(primitive.ObjectID); ok {
		id = oid.Hex()
	}
	module := ""
	if m, ok := data["module"].(string); ok {
		module = m
	}
	action := ""
	if a, ok := data["action"].(string); ok {
		action = a
	}
	name := ""
	if n, ok := data["name"].(string); ok {
		name = n
	}

	createdAt := int64(0)
	if t, ok := data["created_at"].(int64); ok {
		createdAt = t
	}
	updatedAt := int64(0)
	if t, ok := data["updated_at"].(int64); ok {
		updatedAt = t
	}

	return &permissionPb.Permission{
		Id:        id,
		Name:      name,
		Module:    module,
		Action:    action,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}
