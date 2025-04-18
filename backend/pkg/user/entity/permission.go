package user

import "go.mongodb.org/mongo-driver/bson/primitive"

/**
 * Permission represents the permission domain entity
 * Implements: MongoDB document for permissions collection
 * Used by: PermissionRepository, PermissionService
 *
 * @author Dev. Bengi (Backend Team)
 */

type (

	Permission struct {
		ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		Name        string            `bson:"name" json:"name"`
		Code        string            `bson:"code" json:"code"`
		Description string            `bson:"description" json:"description"`
	}
)