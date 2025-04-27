package repository

import (
	"context"
	"time"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserRepository interface {
	Create(ctx context.Context, user *userPb.User) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*userPb.User, error)
	FindByUsername(ctx context.Context, username string) (*userPb.User, error)
	List(ctx context.Context) ([]*userPb.User, error)
	Update(ctx context.Context, id primitive.ObjectID, user *userPb.User) error
	Delete(ctx context.Context, id primitive.ObjectID) error
}

type userRepository struct {
	collection *mongo.Collection
}

func NewUserRepository(db *mongo.Database) UserRepository {
	return &userRepository{
		collection: db.Collection("users"), // Collection name: users
	}
}

func (r *userRepository) Create(ctx context.Context, user *userPb.User) error {
	now := time.Now().Unix()
	user.CreatedAt = now
	user.UpdatedAt = now

	doc := bson.M{
		"name": bson.M{
			"first":  user.Name.First,
			"middle": user.Name.Middle,
			"last":   user.Name.Last,
		},
		"username":   user.Username,
		"password":   user.Password,
		"role_ids":   user.RoleIds,
		"created_at": user.CreatedAt,
		"updated_at": user.UpdatedAt,
	}
	_, err := r.collection.InsertOne(ctx, doc)
	return err
}

func (r *userRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*userPb.User, error) {
	var doc bson.M
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&doc)
	if err != nil {
		return nil, err
	}
	return decodeUser(doc), nil
}

func (r *userRepository) FindByUsername(ctx context.Context, username string) (*userPb.User, error) {
	var doc bson.M
	err := r.collection.FindOne(ctx, bson.M{"username": username}).Decode(&doc)
	if err != nil {
		return nil, err
	}
	return decodeUser(doc), nil
}

func (r *userRepository) List(ctx context.Context) ([]*userPb.User, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []*userPb.User
	for cursor.Next(ctx) {
		var doc bson.M
		if err := cursor.Decode(&doc); err != nil {
			return nil, err
		}
		users = append(users, decodeUser(doc))
	}
	return users, nil
}

func (r *userRepository) Update(ctx context.Context, id primitive.ObjectID, user *userPb.User) error {
	update := bson.M{
		"$set": bson.M{
			"name": bson.M{
				"first":  user.Name.First,
				"middle": user.Name.Middle,
				"last":   user.Name.Last,
			},
			"username":   user.Username,
			"password":   user.Password,
			"role_ids":   user.RoleIds,
			"updated_at": time.Now().Unix(),
		},
	}
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, update)
	return err
}

func (r *userRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// --- helper ---
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
