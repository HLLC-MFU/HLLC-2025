package repository

import (
	"context"
	"time"

	studentPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type StudentRepository interface {
	Create(ctx context.Context, student *studentPb.Student) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*studentPb.Student, error)
	FindByUsername(ctx context.Context, username string) (*studentPb.Student, error)
	List(ctx context.Context) ([]*studentPb.Student, error)
	Update(ctx context.Context, id primitive.ObjectID, student *studentPb.Student) error
	Delete(ctx context.Context, id primitive.ObjectID) error
}

type studentRepository struct {
	collection *mongo.Collection
}

func NewStudentRepository(db *mongo.Database) StudentRepository {
	return &studentRepository{
		collection: db.Collection("students"),
	}
}

func (r *studentRepository) Create(ctx context.Context, student *studentPb.Student) error {
	now := time.Now().Unix()

	doc := bson.M{
		"name": bson.M{
			"first":  student.User.Name.First,
			"middle": student.User.Name.Middle,
			"last":   student.User.Name.Last,
		},
		"username":   student.User.Username,
		"password":   student.User.Password,
		"role_ids":   student.User.RoleIds,
		"created_at": now,
		"updated_at": now,
		"profile": bson.M{
			"major_id": student.MajorId,
			"type":     student.Type.String(),
			"round":    student.Round.String(),
		},
	}

	_, err := r.collection.InsertOne(ctx, doc)
	return err
}

func (r *studentRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*studentPb.Student, error) {
	var doc bson.M
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&doc)
	if err != nil {
		return nil, err
	}
	return decodeStudent(doc), nil
}

func (r *studentRepository) FindByUsername(ctx context.Context, username string) (*studentPb.Student, error) {
	var doc bson.M
	err := r.collection.FindOne(ctx, bson.M{"username": username}).Decode(&doc)
	if err != nil {
		return nil, err
	}
	return decodeStudent(doc), nil
}

func (r *studentRepository) List(ctx context.Context) ([]*studentPb.Student, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var students []*studentPb.Student
	for cursor.Next(ctx) {
		var doc bson.M
		if err := cursor.Decode(&doc); err != nil {
			return nil, err
		}
		students = append(students, decodeStudent(doc))
	}
	return students, nil
}

func (r *studentRepository) Update(ctx context.Context, id primitive.ObjectID, student *studentPb.Student) error {
	update := bson.M{
		"$set": bson.M{
			"name": bson.M{
				"first":  student.User.Name.First,
				"middle": student.User.Name.Middle,
				"last":   student.User.Name.Last,
			},
			"username":   student.User.Username,
			"password":   student.User.Password,
			"role_ids":   student.User.RoleIds,
			"updated_at": time.Now().Unix(),
			"profile": bson.M{
				"major_id": student.MajorId,
				"type":     student.Type.String(),
				"round":    student.Round.String(),
			},
		},
	}
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, update)
	return err
}

func (r *studentRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// --- helper ---
func decodeStudent(doc bson.M) *studentPb.Student {
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

	profile := bson.M{}
	if p, ok := doc["profile"].(bson.M); ok {
		profile = p
	}

	majorId, _ := profile["major_id"].(string)
	typeStr, _ := profile["type"].(string)
	roundStr, _ := profile["round"].(string)

	typeEnum := studentPb.UserType(studentPb.UserType_value[typeStr])
	roundEnum := studentPb.UserRound(studentPb.UserRound_value[roundStr])

	return &studentPb.Student{
		User: &userPb.User{
			Id:        id,
			Name:      name,
			Username:  username,
			Password:  password,
			RoleIds:   roleIds,
			CreatedAt: createdAt,
			UpdatedAt: updatedAt,
		},
		MajorId: majorId,
		Type:    typeEnum,
		Round:   roundEnum,
	}
}
