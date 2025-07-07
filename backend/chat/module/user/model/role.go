package model

import "go.mongodb.org/mongo-driver/bson/primitive"

const (
	ActionRead   = "read"
	ActionCreate = "create"
	ActionUpdate = "update"
	ActionDelete = "delete"
	ActionAll    = "*"
)

type (
	Role struct {
		ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
		Name      string              `bson:"name" json:"name"`
		Permissions    []string                 `bson:"permissions" json:"permissions"`
		MetadataSchema map[string]interface{} `bson:"metadataSchema,omitempty" json:"metadataSchema"`
	}

	MetadataField struct {
		Type     string `bson:"type" json:"type"`
		Label    string `bson:"label,omitempty" json:"label,omitempty"`
		Required bool   `bson:"required,omitempty" json:"required,omitempty"`
	}
)