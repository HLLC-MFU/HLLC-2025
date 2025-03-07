package user

import "go.mongodb.org/mongo-driver/bson/primitive"

/**
 * RolePermission represents the role permission domain entity
 * Implements: MongoDB document for role permissions collection
 * Used by: RolePermissionRepository, RolePermissionService
 *
 * @author Dev. Bengi (Backend Team)
 */

type (

	RolePermission struct {
		ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		RoleID       primitive.ObjectID `bson:"roleId" json:"roleId" validate:"required"`
		PermissionID primitive.ObjectID `bson:"permissionId" json:"permissionId" validate:"required"`
	}
)