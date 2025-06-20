package service

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// ForeignKeyValidator is a struct that holds the database connection
type ForeignKeyValidator struct {
	db *mongo.Database
}

// NewForeignKeyValidator creates a new instance of ForeignKeyValidator
func NewForeignKeyValidator(db *mongo.Database) *ForeignKeyValidator {
	return &ForeignKeyValidator{db: db}
}

// ValidateForeignKey checks if a document exists in the specified collection with the given ID
func (v *ForeignKeyValidator) ValidateForeignKey(ctx context.Context, collection string, id interface{}) error {
	var objectID primitive.ObjectID

	switch v := id.(type) {
	case string:
		var err error
		objectID, err = primitive.ObjectIDFromHex(v)
		if err != nil {
			return fmt.Errorf("invalid ID format for %s: %w", collection, err)
		}
	case primitive.ObjectID:
		objectID = v
	default:
		return fmt.Errorf("unsupported ID type for %s: %T", collection, id)
	}

	result := v.db.Collection(collection).FindOne(ctx, bson.M{"_id": objectID})
	if err := result.Err(); err != nil {
		if err == mongo.ErrNoDocuments {
			return fmt.Errorf("referenced %s with ID %s not found", collection, objectID.Hex())
		}
		return fmt.Errorf("error validating foreign key for %s: %w", collection, err)
	}

	return nil
}

// ValidateForeignKeys validates multiple foreign keys at once
func (v *ForeignKeyValidator) ValidateForeignKeys(ctx context.Context, refs map[string]interface{}) error {
	for collection, id := range refs {
		if err := v.ValidateForeignKey(ctx, collection, id); err != nil {
			return err
		}
	}
	return nil
} 