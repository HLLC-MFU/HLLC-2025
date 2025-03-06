package user

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Name struct {
	FirstName  string `bson:"firstName" json:"firstName" validate:"required"`
	MiddleName string `bson:"middleName" json:"middleName"`
	LastName   string `bson:"lastName" json:"lastName" validate:"required"`
}

type User struct {
	ID           primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Name         Name                `bson:"name" json:"name"`
	Roles        []primitive.ObjectID `bson:"roles" json:"roles"`
	Username     string              `bson:"username" json:"username"`
	PasswordHash string              `bson:"passwordHash" json:"passwordHash"`
	CreatedAt    time.Time           `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time           `bson:"updatedAt" json:"updatedAt"`
}

type Role struct {
	ID   primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name string            `bson:"name" json:"name" validate:"required"`
}

type Permission struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PermissionName string            `bson:"permissionName" json:"permissionName" validate:"required"`
}

type RolePermission struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	RoleID       primitive.ObjectID `bson:"roleId" json:"roleId" validate:"required"`
	PermissionID primitive.ObjectID `bson:"permissionId" json:"permissionId" validate:"required"`
} 