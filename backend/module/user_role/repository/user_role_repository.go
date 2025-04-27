package repository

import (
	"context"

	userRolePb "github.com/HLLC-MFU/HLLC-2025/backend/module/user_role/proto/generated"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserRoleRepository interface {
	Create(ctx context.Context, userRole *userRolePb.UserRole) error
	FindAll(ctx context.Context) ([]*userRolePb.UserRole, error)
	FindByUserID(ctx context.Context, userID primitive.ObjectID) (*userRolePb.UserRole, error)
	Update(ctx context.Context, userID primitive.ObjectID, userRole *userRolePb.UserRole) error
	Delete(ctx context.Context, userID primitive.ObjectID) error
}

type userRoleRepository struct {
	collection *mongo.Collection
}

func NewUserRoleRepository(db *mongo.Database) UserRoleRepository {
	return &userRoleRepository{
		collection: db.Collection("user_roles"),
	}
}

func (r *userRoleRepository) Create(ctx context.Context, userRole *userRolePb.UserRole) error {
	_, err := r.collection.InsertOne(ctx, userRole)
	return err
}

func (r *userRoleRepository) FindAll(ctx context.Context) ([]*userRolePb.UserRole, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var userRoles []*userRolePb.UserRole
	if err := cursor.All(ctx, &userRoles); err != nil {
		return nil, err
	}
	return userRoles, nil
}

func (r *userRoleRepository) FindByUserID(ctx context.Context, userID primitive.ObjectID) (*userRolePb.UserRole, error) {
	var userRole userRolePb.UserRole
	err := r.collection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&userRole)
	return &userRole, err
}

func (r *userRoleRepository) Update(ctx context.Context, userID primitive.ObjectID, userRole *userRolePb.UserRole) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"user_id": userID}, bson.M{"$set": userRole})
	return err
}

func (r *userRoleRepository) Delete(ctx context.Context, userID primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"user_id": userID})
	return err
}
