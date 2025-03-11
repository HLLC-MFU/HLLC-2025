package decorator

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
)

/**
 * MongoWrapper is a wrapper for the mongo client
 *
 * @author Dev. Bengi (Backend Team)
 */

type (

	MongoWrapper struct {
		Client *mongo.Client
		Database string
	}
)

func (m *MongoWrapper) WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error {
	session, err := m.Client.StartSession()
	if err != nil {
		return err
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(sessCtx mongo.SessionContext) (interface{}, error) {
        return nil, fn(sessCtx)
    })
    return err
}

func (m *MongoWrapper) getCollection(name string) *mongo.Collection {
	return m.Client.Database(m.Database).Collection(name)
}

// WithMongoTimeout adds a timeout to MongoDB operations
func WithMongoTimeout(timeout time.Duration, operation func(ctx context.Context) error) error {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	return operation(ctx)
}

// WithMongoTimeoutResult adds a timeout to MongoDB operations that return a result
func WithMongoTimeoutResult[T any](timeout time.Duration, operation func(ctx context.Context) (T, error)) (T, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	return operation(ctx)
}

