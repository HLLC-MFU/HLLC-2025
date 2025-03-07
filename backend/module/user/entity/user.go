package user

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

/**
 * User represents the core user domain entity
 * Implements: MongoDB document for users collection
 * Used by: UserRepository, UserService
 *
 * @author Dev. Bengi (Backend Team)
 */

type (

	User struct {
		ID           primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
		Name         Name                `bson:"name" json:"name"`
		Roles        []primitive.ObjectID `bson:"roles" json:"roles"`
		Permissions  []primitive.ObjectID `bson:"permissions" json:"permissions"`
		Username     string              `bson:"username" json:"username"`
		PasswordHash string              `bson:"passwordHash" json:"passwordHash"`
		CreatedAt    time.Time           `bson:"createdAt" json:"createdAt"`
		UpdatedAt    time.Time           `bson:"updatedAt" json:"updatedAt"`
	}

	Name struct {
		FirstName  string `bson:"firstName" json:"firstName" validate:"required"`
		MiddleName string `bson:"middleName" json:"middleName"`
		LastName   string `bson:"lastName" json:"lastName" validate:"required"`
	}
)