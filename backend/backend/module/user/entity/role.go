package user

import "go.mongodb.org/mongo-driver/bson/primitive"

/**
 * Role represents the role domain entity
 * Implements: MongoDB document for roles collection
 * Used by: RoleRepository, RoleService
 *
 * @author Dev. Bengi (Backend Team)
 */

type (

	Role struct {
		ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		RoleTitle   string            `bson:"role_title" json:"role_title"`
		RoleCode    int               `bson:"role_code" json:"role_code"`
		Description string            `bson:"description" json:"description"`
	}

)