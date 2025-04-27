package repository

import (
	"context"

	rolePb "github.com/HLLC-MFU/HLLC-2025/backend/module/role/proto/generated"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type RoleRepository interface {
	Create(ctx context.Context, role *rolePb.Role) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*rolePb.Role, error)
	List(ctx context.Context) ([]*rolePb.Role, error)
	Update(ctx context.Context, id primitive.ObjectID, update *rolePb.Role) error
	Delete(ctx context.Context, id primitive.ObjectID) error
}

type roleRepository struct {
	roleCollection *mongo.Collection
}

func NewRoleRepository(db *mongo.Database) RoleRepository {
	return &roleRepository{
		roleCollection: db.Collection("roles"),
	}
}

func (r *roleRepository) Create(ctx context.Context, role *rolePb.Role) error {
	_, err := r.roleCollection.InsertOne(ctx, role)
	return err
}

func (r *roleRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*rolePb.Role, error) {
	var role rolePb.Role
	err := r.roleCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&role)
	return &role, err
}

func (r *roleRepository) List(ctx context.Context) ([]*rolePb.Role, error) {
	cursor, err := r.roleCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var roles []*rolePb.Role
	if err := cursor.All(ctx, &roles); err != nil {
		return nil, err
	}
	return roles, nil
}

func (r *roleRepository) Update(ctx context.Context, id primitive.ObjectID, update *rolePb.Role) error {
	_, err := r.roleCollection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	return err
}

func (r *roleRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.roleCollection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
