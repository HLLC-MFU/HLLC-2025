package repository

import (
	"context"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// ----------- Interface -----------

type AuthRepository interface {
	FindUserByUsername(ctx context.Context, username string) (*userPb.User, error)
}

// ----------- Mongo Implementation -----------

type authRepository struct {
	userCollection    *mongo.Collection
	studentCollection *mongo.Collection
}

func NewAuthRepository(db *mongo.Database) AuthRepository {
	return &authRepository{
		userCollection:    db.Collection("users"),
		studentCollection: db.Collection("students"),
	}
}

func (r *authRepository) FindUserByUsername(ctx context.Context, username string) (*userPb.User, error) {
	// ลองหาใน user collection ก่อน
	var userDoc bson.M
	err := r.userCollection.FindOne(ctx, bson.M{"username": username}).Decode(&userDoc)
	if err == nil {
		return decodeUser(userDoc), nil
	}

	// ถ้าไม่เจอใน user, ลองหาใน student collection
	var studentDoc bson.M
	err = r.studentCollection.FindOne(ctx, bson.M{"username": username}).Decode(&studentDoc)
	if err == nil {
		return decodeStudentAsUser(studentDoc), nil
	}

	return nil, err
}

// ----------- decode functions -----------

func decodeUser(doc bson.M) *userPb.User {
	id := ""
	if oid, ok := doc["_id"].(primitive.ObjectID); ok {
		id = oid.Hex()
	}

	name := &userPb.Name{}
	if n, ok := doc["name"].(bson.M); ok {
		name.First, _ = n["first"].(string)
		name.Middle, _ = n["middle"].(string)
		name.Last, _ = n["last"].(string)
	}

	username, _ := doc["username"].(string)
	password, _ := doc["password"].(string)

	roleIds := []string{}
	if roles, ok := doc["role_ids"].(primitive.A); ok {
		for _, r := range roles {
			if roleStr, ok := r.(string); ok {
				roleIds = append(roleIds, roleStr)
			}
		}
	}

	createdAt := int64(0)
	if t, ok := doc["created_at"].(int64); ok {
		createdAt = t
	}
	updatedAt := int64(0)
	if t, ok := doc["updated_at"].(int64); ok {
		updatedAt = t
	}

	return &userPb.User{
		Id:        id,
		Name:      name,
		Username:  username,
		Password:  password,
		RoleIds:   roleIds,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}

func decodeStudentAsUser(doc bson.M) *userPb.User {
	id := ""
	if oid, ok := doc["_id"].(primitive.ObjectID); ok {
		id = oid.Hex()
	}

	name := &userPb.Name{}
	if n, ok := doc["name"].(bson.M); ok {
		name.First, _ = n["first"].(string)
		name.Middle, _ = n["middle"].(string)
		name.Last, _ = n["last"].(string)
	}

	username, _ := doc["username"].(string)
	password, _ := doc["password"].(string)

	roleIds := []string{}
	if roles, ok := doc["role_ids"].(primitive.A); ok {
		for _, r := range roles {
			if roleStr, ok := r.(string); ok {
				roleIds = append(roleIds, roleStr)
			}
		}
	}

	createdAt := int64(0)
	if t, ok := doc["created_at"].(int64); ok {
		createdAt = t
	}
	updatedAt := int64(0)
	if t, ok := doc["updated_at"].(int64); ok {
		updatedAt = t
	}

	return &userPb.User{
		Id:        id,
		Name:      name,
		Username:  username,
		Password:  password,
		RoleIds:   roleIds,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}
