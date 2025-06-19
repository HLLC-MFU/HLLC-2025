package helper

import (
	"chat/pkg/database/queries"
	"context"
	"errors"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var ErrAlreadyExists = errors.New("data already exists")
var ErrNotFound = errors.New("data not found")

func ThrowIfExists[T any](
	ctx context.Context,
	svc interface {
		FindOne(context.Context, interface{}) (*queries.Response[T], error)
	},
	filter interface{},
	message string,
) error {
	_, err := svc.FindOne(ctx, filter)
	if err == nil {
		if message == "" {
			message = "data already exists"
		}
		return fmt.Errorf("%w: %s", ErrAlreadyExists, message)
	}
	if err == mongo.ErrNoDocuments {
		return nil // not found → OK
	}
	return err // some DB error
}

func FindOrThrow[T any](
	ctx context.Context,
	svc interface {
		FindOne(context.Context, interface{}) (*T, error)
	},
	idOrFilter interface{},
	name string,
) (*T, error) {
	var filter interface{}

	switch v := idOrFilter.(type) {
	case string:
		filter = bson.M{"_id": v}
	case primitive.ObjectID:
		filter = bson.M{"_id": v}
	case bson.M:
		filter = v
	default:
		return nil, fmt.Errorf("invalid filter type: %T", v)
	}

	item, err := svc.FindOne(ctx, filter)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			if name == "" {
				name = "item"
			}
			return nil, fmt.Errorf("%w: %s not found", ErrNotFound, name)
		}
		return nil, err
	}

	return item, nil
}