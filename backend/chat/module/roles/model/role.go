package model

import (
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	ActionRead   = "read"
	ActionCreate = "create"
	ActionUpdate = "update"
	ActionDelete = "delete"
	ActionAll    = "*"
)

type MetadataField struct {
	Type     string `bson:"type" json:"type"`
	Label    string `bson:"label,omitempty" json:"label,omitempty"`
	Required bool   `bson:"required,omitempty" json:"required,omitempty"`
}

type Role struct {
	coreModel.Base `bson:",inline"`
	ID             primitive.ObjectID       `bson:"_id,omitempty" json:"id"`
	Name           string                   `bson:"name" json:"name"`
	Permissions    []string                 `bson:"permissions" json:"permissions"`
	MetadataSchema map[string]MetadataField `bson:"metadataSchema,omitempty" json:"metadataSchema"`
}
