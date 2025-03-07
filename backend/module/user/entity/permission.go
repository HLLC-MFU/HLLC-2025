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
		ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		PermissionName string             `bson:"permissionName" json:"permissionName" validate:"required"`
	}
)