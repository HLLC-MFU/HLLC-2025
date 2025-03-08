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
		Username     string              `bson:"username" json:"username"`
		Password     string              `bson:"password" json:"-"`
		Name         Name                `bson:"name" json:"name"`
		Role         []Role              `bson:"role" json:"role"`
		CreatedAt    time.Time           `bson:"created_at" json:"created_at"`
		UpdatedAt    time.Time           `bson:"updated_at" json:"updated_at"`
	}

	Name struct {
		FirstName  string `bson:"first_name" json:"first_name"`
		MiddleName string `bson:"middle_name" json:"middle_name"`
		LastName   string `bson:"last_name" json:"last_name"`
	}


)